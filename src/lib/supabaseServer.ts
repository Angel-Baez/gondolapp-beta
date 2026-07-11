import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase por-request para route handlers: lee la sesión del
 * usuario desde las cookies del request, así RLS aplica con su JWT (y no
 * como `anon`, que quedó sin acceso desde la migración 0012).
 */
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // En route handlers sí se puede escribir (refresh de token);
          // si el contexto no lo permite, el proxy ya refresca la sesión.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* contexto de solo lectura */
          }
        },
      },
    }
  );
}
