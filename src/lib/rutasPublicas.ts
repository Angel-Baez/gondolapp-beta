/**
 * Rutas navegables sin sesión — única fuente para el gate del proxy (Edge)
 * y el gate client-side (AuthProvider). /sw.js y /offline.html son
 * críticas: el matcher del proxy no excluye .js/.html y sin ellas el
 * service worker no podría registrarse ni precachear estando deslogueado.
 */
export const RUTAS_PUBLICAS = [
  "/login",
  "/registro",
  "/recuperar",
  "/restablecer",
  "/unirse",
  "/sw.js",
  "/offline.html",
] as const;

export function esRutaPublica(pathname: string): boolean {
  return RUTAS_PUBLICAS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  );
}
