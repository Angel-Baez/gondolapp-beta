/**
 * Definiciones centralizadas de las query keys de React Query.
 *
 * Única fuente de verdad para las keys que comparten hooks, providers y el
 * persister (ver docs/SPECMULTIUSER.md §4.1): en la Fase 2 del proyecto
 * multi-tienda todas ganan el prefijo `["tienda", tiendaId, ...]` tocando
 * solo este módulo (las constantes pasan a factories que reciben tiendaId).
 */

export const REPOSICION_ITEMS_KEY = ["reposicion", "items"] as const;
export const REPOSICION_HISTORIAL_KEY = ["reposicion", "historial"] as const;
export const REPOSICION_ESTADISTICAS_KEY = ["reposicion", "estadisticas"] as const;

export const VENCIMIENTO_ITEMS_KEY = ["vencimiento", "items"] as const;
export const VENCIMIENTO_HISTORIAL_KEY = ["vencimiento", "historial"] as const;
export const VENCIMIENTO_ESTADISTICAS_KEY = ["vencimiento", "estadisticas"] as const;

export const CATALOGO_COMPLETO_KEY = ["catalogo", "completo"] as const;

export function eanQueryKey(ean: string) {
  return ["producto", "ean", ean] as const;
}
