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
  search: parseInt(process.env.RATE_LIMIT_SEARCH || "20"),
  create: parseInt(process.env.RATE_LIMIT_CREATE || "15"),
  ai: parseInt(process.env.RATE_LIMIT_AI || "10"),
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

const searchLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.search, "1 m"),
      analytics: true,
      prefix: "@gondolapp/search",
    })
  : null;

const aiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.ai, "1 m"),
      analytics: true,
      prefix: "@gondolapp/ai",
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

// 🔄 Nueva convención Next.js 16: export default (antes era "export async function middleware")
export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Solo aplicar rate limiting a API routes
  if (!pathname.startsWith("/api/")) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Obtener IP del cliente
  const ip = getClientIp(request);
  const identifier = `ip:${ip}`;

  // En desarrollo, permitir todo
  if (process.env.NODE_ENV === "development" || !redis) {
    console.log(`🔓 [DEV] Rate limiting deshabilitado para ${pathname}`);
    return addSecurityHeaders(NextResponse.next());
  }

  // Seleccionar limiter según el endpoint
  let limiter = apiLimiter;
  let limitType = "API general";
  let cacheKey = `${identifier}:api`;

  if (pathname.includes("/api/productos/buscar")) {
    limiter = searchLimiter;
    limitType = "Búsqueda";
    cacheKey = `${identifier}:search`;
  } else if (pathname.includes("/api/productos/crear-manual")) {
    limiter = createLimiter;
    limitType = "Creación";
    cacheKey = `${identifier}:create`;
  } else if (pathname.includes("/api/productos/normalizar")) {
    limiter = aiLimiter;
    limitType = "IA";
    cacheKey = `${identifier}:ai`;
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
      "connect-src 'self' https://images.openfoodfacts.org https://generativelanguage.googleapis.com https://*.mongodb.net",
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
