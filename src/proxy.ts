import { esRutaPublica } from "@/lib/rutasPublicas";
import { createServerClient } from "@supabase/ssr";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// 🔐 Configuración de Rate Limiting con Upstash Redis + Cache en Memoria
// IMPORTANTE: Configura estas variables en Vercel:
// UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
// UPSTASH_REDIS_REST_TOKEN=xxx

// ⚡ CACHE EN MEMORIA para reducir latencia
// Almacena temporalmente el estado de IPs conocidas para evitar consultas innecesarias a Redis
interface CacheEntry {
  allowed: boolean;
  remaining: number;
  reset: number;
  timestamp: number;
}

// Map con TTL de 5 segundos (balance entre precisión y performance)
const CACHE_TTL_MS = 5000;
const ipCache = new Map<string, CacheEntry>();

// Limpiar cache periódicamente (cada 60 segundos)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of ipCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        ipCache.delete(key);
      }
    }
  }, 60000);
}

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// 📊 Límites configurables via Vercel Edge Config (fallback a valores por defecto)
// Para cambiar límites sin redeploy: https://vercel.com/docs/storage/edge-config
const RATE_LIMITS = {
  api: parseInt(process.env.RATE_LIMIT_API || "30"),
  create: parseInt(process.env.RATE_LIMIT_CREATE || "15"),
};

// Límites por tipo de endpoint
const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.api, "1 m"),
      analytics: true,
      prefix: "@gondolapp/api",
    })
  : null;

const createLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.create, "1 m"),
      analytics: true,
      prefix: "@gondolapp/create",
    })
  : null;

/**
 * Refresca la sesión leyendo cookies (@supabase/ssr) y redirige a /login
 * en rutas protegidas sin usuario. Best-effort a propósito (spec §3.1):
 * en arranque offline el SW sirve el shell sin pasar por acá, y si Auth no
 * responde se deja pasar — el gate real de UX es client-side (AuthProvider).
 */
async function gateDeSesion(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.next({ request });

  const redirigirALogin = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  };

  // Sin cookie de Supabase no hay sesión que refrescar: redirect directo,
  // sin pagar el round-trip a Auth.
  const hayCookieDeSesion = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));
  if (!hayCookieDeSesion) {
    return esRutaPublica(pathname)
      ? NextResponse.next({ request })
      : redirigirALogin();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !esRutaPublica(pathname)) {
      const redirect = redirigirALogin();
      // Conservar las cookies del refresh (p.ej. limpieza de una sesión inválida).
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
  } catch {
    // Auth inalcanzable: dejar pasar (best-effort).
  }
  return response;
}

// 🔄 Nueva convención Next.js 16: export default (antes era "export async function middleware")
export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Páginas: gate de sesión. API routes: rate limiting (el 401 lo maneja
  // cada route handler con su cliente por-request).
  if (!pathname.startsWith("/api/")) {
    return addSecurityHeaders(await gateDeSesion(request));
  }

  // Clave del rate limit: usuario si hay cookie de sesión, IP como fallback.
  // El sub se decodifica SIN verificar firma — spoofearlo solo cambia tu
  // bucket de rate limit; la autorización real la hace el route handler con
  // su cliente por-request.
  const ip = getClientIp(request);
  const sub = extraerSubDeSesion(request);
  const identifier = sub ? `user:${sub}` : `ip:${ip}`;

  // En desarrollo, permitir todo
  if (process.env.NODE_ENV === "development" || !redis) {
    console.log(`🔓 [DEV] Rate limiting deshabilitado para ${pathname}`);
    return addSecurityHeaders(NextResponse.next());
  }

  // Seleccionar limiter según el endpoint
  let limiter = apiLimiter;
  let limitType = "API general";
  let cacheKey = `${identifier}:api`;

  if (pathname.includes("/api/productos/crear-manual")) {
    limiter = createLimiter;
    limitType = "Creación";
    cacheKey = `${identifier}:create`;
  } else if (pathname.includes("/api/productos/parsear")) {
    // El parseo llama a la IA (costo por request): mismo límite que creación.
    limiter = createLimiter;
    limitType = "Parseo IA";
    cacheKey = `${identifier}:create`;
  }

  // ⚡ CHECK CACHE PRIMERO (evita llamada a Redis si hay entrada válida)
  const cachedEntry = ipCache.get(cacheKey);
  const now = Date.now();

  if (cachedEntry && now - cachedEntry.timestamp < CACHE_TTL_MS) {
    // Cache hit - usar valores cacheados
    if (!cachedEntry.allowed) {
      console.log(`💨 [CACHE HIT] ${ip} - Rate limit activo (${limitType})`);

      const response = new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `Demasiadas peticiones. Intenta de nuevo en ${Math.ceil(
            (cachedEntry.reset - now) / 1000
          )} segundos.`,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      response.headers.set("X-RateLimit-Limit", "N/A");
      response.headers.set(
        "X-RateLimit-Remaining",
        cachedEntry.remaining.toString()
      );
      response.headers.set("X-RateLimit-Reset", cachedEntry.reset.toString());

      return addSecurityHeaders(response);
    }

    // Si está permitido en cache, verificar si aún está dentro del reset time
    if (now < cachedEntry.reset) {
      console.log(
        `💨 [CACHE HIT] ${ip} - ${cachedEntry.remaining} requests restantes (${limitType})`
      );

      // Decrementar remaining en cache (optimista)
      cachedEntry.remaining = Math.max(0, cachedEntry.remaining - 1);
      cachedEntry.timestamp = now;
      ipCache.set(cacheKey, cachedEntry);

      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", "N/A");
      response.headers.set(
        "X-RateLimit-Remaining",
        cachedEntry.remaining.toString()
      );
      response.headers.set("X-RateLimit-Reset", cachedEntry.reset.toString());

      return addSecurityHeaders(response);
    }
  }

  // Cache miss o expirado - consultar Redis
  try {
    console.log(`🔍 [REDIS] Consultando rate limit para ${ip} (${limitType})`);

    const { success, limit, remaining, reset } = await limiter!.limit(
      identifier
    );

    // Guardar en cache (tanto éxito como rate limit)
    const cacheEntry: CacheEntry = {
      allowed: success,
      remaining,
      reset,
      timestamp: now,
    };
    ipCache.set(cacheKey, cacheEntry);

    const response = success
      ? NextResponse.next()
      : new NextResponse(
          JSON.stringify({
            error: "Rate limit exceeded",
            message: `Demasiadas peticiones. Intenta de nuevo en ${Math.ceil(
              (reset - Date.now()) / 1000
            )} segundos.`,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

    // Headers de rate limiting (estándar RFC 6585)
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());

    // Logging
    console.log(
      `🛡️  [${limitType}] ${ip} - ${remaining}/${limit} requests restantes`
    );

    if (!success) {
      console.warn(
        `⚠️  [${limitType}] Rate limit excedido para ${ip} en ${pathname}`
      );
    }

    return addSecurityHeaders(response);
  } catch (error) {
    console.error("❌ Error en rate limiting:", error);
    // En caso de error, permitir la request pero loggear
    return addSecurityHeaders(NextResponse.next());
  }
}

function decodificarBase64Url(valor: string): string {
  return atob(valor.replace(/-/g, "+").replace(/_/g, "/"));
}

/** sub del JWT de la cookie de Supabase, sin verificar firma (solo rate limit). */
function extraerSubDeSesion(request: NextRequest): string | null {
  try {
    const chunks = request.cookies
      .getAll()
      .filter((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map((c) => c.value);
    if (chunks.length === 0) return null;

    let crudo = chunks.join("");
    if (crudo.startsWith("base64-")) {
      crudo = decodificarBase64Url(crudo.slice("base64-".length));
    }
    const sesion = JSON.parse(crudo) as { access_token?: string };
    if (!sesion.access_token) return null;

    const payload = JSON.parse(
      decodificarBase64Url(sesion.access_token.split(".")[1])
    ) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

// Función para extraer IP del cliente
function getClientIp(request: NextRequest): string {
  // Orden de prioridad de headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare

  if (cfConnectingIp) return cfConnectingIp;
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  if (realIp) return realIp;

  return "unknown";
}

// Función para agregar headers de seguridad
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requiere unsafe-eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  // Otros headers de seguridad
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), interest-cohort=()"
  );

  // PWA headers
  response.headers.set("Service-Worker-Allowed", "/");

  return response;
}

// Configuración del matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)",
  ],
};
