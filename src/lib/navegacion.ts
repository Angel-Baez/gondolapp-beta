/**
 * Sanea el parámetro `next` de login/registro (adónde volver después de
 * autenticarse, p. ej. /unirse?codigo=X). Solo se aceptan rutas relativas
 * de esta app: un valor absoluto o protocol-relative ("//evil.com") sería
 * un open redirect.
 */
export function destinoSeguro(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}
