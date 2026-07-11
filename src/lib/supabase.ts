import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Configuralas en .env.local (ver .env.example)."
  );
}

/**
 * Cliente del browser. La sesión vive en cookies (@supabase/ssr) para que
 * el proxy y los route handlers la lean; se restaura sin red en arranque
 * frío offline, igual que localStorage (docs/SPECMULTIUSER.md §3.1).
 * En el servidor este singleton es solo el default de firma de los
 * servicios: los route handlers pasan el cliente por-request de
 * supabaseServer.ts.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
