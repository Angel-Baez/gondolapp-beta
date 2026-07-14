/**
 * Definiciones centralizadas de las query keys de React Query.
 *
 * Única fuente de verdad para las keys que comparten hooks, providers y el
 * persister. Desde la Fase 2 multi-tienda (docs/SPECMULTIUSER.md §4.1)
 * todas llevan el prefijo `["tienda", tiendaId, ...]`: los datos de dos
 * tiendas nunca comparten entrada de cache.
 */

export const SIN_TIENDA = "sin-tienda";

export function reposicionItemsKey(tiendaId: string) {
  return ["tienda", tiendaId, "reposicion", "items"] as const;
}
export function reposicionHistorialKey(tiendaId: string) {
  return ["tienda", tiendaId, "reposicion", "historial"] as const;
}
export function reposicionEstadisticasKey(tiendaId: string) {
  return ["tienda", tiendaId, "reposicion", "estadisticas"] as const;
}

export function vencimientoItemsKey(tiendaId: string) {
  return ["tienda", tiendaId, "vencimiento", "items"] as const;
}
export function vencimientoHistorialKey(tiendaId: string) {
  return ["tienda", tiendaId, "vencimiento", "historial"] as const;
}
export function vencimientoEstadisticasKey(tiendaId: string) {
  return ["tienda", tiendaId, "vencimiento", "estadisticas"] as const;
}

export function catalogoCompletoKey(tiendaId: string) {
  return ["tienda", tiendaId, "catalogo", "completo"] as const;
}

export function eanQueryKey(tiendaId: string, ean: string) {
  return ["tienda", tiendaId, "producto", "ean", ean] as const;
}

// Gestión de equipo (Fase 3). No entran en esQueryPersistible a propósito:
// miembros/invitaciones se consultan online (la pantalla /tienda no es un
// flujo offline) y los emails no deben quedar en el cache IDB.
export function tiendaMetaKey(tiendaId: string) {
  return ["tienda", tiendaId, "meta"] as const;
}
export function miembrosKey(tiendaId: string) {
  return ["tienda", tiendaId, "equipo", "miembros"] as const;
}
export function invitacionesKey(tiendaId: string) {
  return ["tienda", tiendaId, "equipo", "invitaciones"] as const;
}
