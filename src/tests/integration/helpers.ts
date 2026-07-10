import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

/**
 * Helpers del harness de integración (docs/SPECMULTIUSER.md §2.4): clientes
 * contra un stack de Supabase real y fixtures de usuarios con JWTs de
 * verdad, creados vía Admin API con la service_role key.
 *
 * Las keys NO se hardcodean (ni siquiera las demo del stack local, para no
 * disparar escáneres de secretos): se leen de env vars. Con el stack local
 * corriendo, `supabase status` las imprime.
 */

export const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** Falla rápido con instrucciones si el entorno no está configurado. */
export function verificarConfiguracion(): void {
  if (SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY) return;
  throw new Error(
    [
      "Tests de integración sin configurar. Necesitan un stack de Supabase real:",
      "  1. supabase start   (requiere Docker; usa supabase/config.toml)",
      "  2. supabase status  (imprime las keys del stack local)",
      "  3. export SUPABASE_ANON_KEY=<anon key>",
      "     export SUPABASE_SERVICE_ROLE_KEY=<service_role key>",
      "     (SUPABASE_URL opcional; default http://127.0.0.1:54321)",
      "  4. npm run test:integration",
    ].join("\n")
  );
}

export function crearClienteAnon(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente con service_role: solo para fixtures (crear/borrar usuarios). */
export function crearClienteAdmin(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface UsuarioDePrueba {
  id: string;
  email: string;
  /** Cliente ya autenticado con el JWT real de este usuario. */
  client: SupabaseClient;
}

export async function crearUsuarioDePrueba(
  admin: SupabaseClient,
  prefijo = "test"
): Promise<UsuarioDePrueba> {
  const email = `${prefijo}-${randomUUID()}@integration.local`;

  const { data: creado, error: crearError } =
    await admin.auth.admin.createUser({ email, email_confirm: true });
  if (crearError) throw crearError;

  // Sin contraseñas: el login consume un magic link generado por la Admin
  // API (no se envía ningún email; el token se canjea directo por sesión).
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError) throw linkError;

  const client = crearClienteAnon();
  const { error: loginError } = await client.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (loginError) throw loginError;

  return { id: creado.user.id, email, client };
}

export async function eliminarUsuarioDePrueba(
  admin: SupabaseClient,
  usuario: UsuarioDePrueba
): Promise<void> {
  await usuario.client.auth.signOut();
  const { error } = await admin.auth.admin.deleteUser(usuario.id);
  if (error) throw error;
}
