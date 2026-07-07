import { CatalogoCompleto, ProductoCompleto } from "@/services/catalogo";

/**
 * Lookups y búsquedas puras/síncronas sobre un catálogo ya cargado en
 * memoria (ver useCatalogoCompleto). Reemplazan los round-trips a Supabase
 * de catalogo.ts para el camino offline: mismos criterios de matching,
 * cero red.
 */

function indexarBases(bases: CatalogoCompleto["bases"]) {
  return new Map(bases.map((b) => [b.id, b]));
}

export function buscarPorCodigoBarrasLocal(
  catalogo: CatalogoCompleto,
  ean: string
): ProductoCompleto | null {
  const variante = catalogo.variantes.find((v) => v.codigoBarras === ean);
  if (!variante) return null;
  const base = indexarBases(catalogo.bases).get(variante.productoBaseId);
  if (!base) return null;
  return { base, variante };
}

export function obtenerProductoPorVarianteIdLocal(
  catalogo: CatalogoCompleto,
  varianteId: string
): ProductoCompleto | null {
  const variante = catalogo.variantes.find((v) => v.id === varianteId);
  if (!variante) return null;
  const base = indexarBases(catalogo.bases).get(variante.productoBaseId);
  if (!base) return null;
  return { base, variante };
}

export function obtenerProductosPorVarianteIdsLocal(
  catalogo: CatalogoCompleto,
  varianteIds: string[]
): Record<string, ProductoCompleto> {
  const idsUnicos = Array.from(new Set(varianteIds));
  const basesPorId = indexarBases(catalogo.bases);
  const variantesPorId = new Map(catalogo.variantes.map((v) => [v.id, v]));
  const resultado: Record<string, ProductoCompleto> = {};
  for (const id of idsUnicos) {
    const variante = variantesPorId.get(id);
    if (!variante) continue;
    const base = basesPorId.get(variante.productoBaseId);
    if (!base) continue;
    resultado[id] = { base, variante };
  }
  return resultado;
}

/**
 * Saca caracteres que en la búsqueda remota rompen el filtro `.or()` de
 * PostgREST (ver catalogo.ts). Localmente no hay razón sintáctica para
 * sanitizar, pero se mantiene para que "qué cuenta como match" no diverja
 * entre la búsqueda online y la offline.
 */
function sanitizarTerminoBusqueda(termino: string): string {
  return termino.replace(/[,%()]/g, "").trim();
}

const LIMITE_BUSQUEDA_LOCAL = 30;

/**
 * Reemplazo fiel de buscarVariantes (catalogo.ts): el original hace 2
 * queries (ilike sobre nombre_completo, or sobre nombre/marca de la base)
 * mergeadas con un Set para dedupe. Acá alcanza un solo pase por variante,
 * ya visitada una única vez, sin Set.
 */
export function buscarVariantesLocal(
  catalogo: CatalogoCompleto,
  termino: string
): ProductoCompleto[] {
  const limpio = sanitizarTerminoBusqueda(termino).toLowerCase();
  if (limpio.length < 2) return [];

  const basesPorId = indexarBases(catalogo.bases);
  const resultado: ProductoCompleto[] = [];

  for (const variante of catalogo.variantes) {
    const base = basesPorId.get(variante.productoBaseId);
    if (!base) continue;

    const matchVariante = variante.nombreCompleto.toLowerCase().includes(limpio);
    const matchBase =
      base.nombre.toLowerCase().includes(limpio) ||
      (base.marca?.toLowerCase().includes(limpio) ?? false);

    if (matchVariante || matchBase) {
      resultado.push({ base, variante });
      if (resultado.length >= LIMITE_BUSQUEDA_LOCAL) break;
    }
  }
  return resultado;
}

export function obtenerMarcasYCategoriasLocal(
  catalogo: CatalogoCompleto
): { marcas: string[]; categorias: string[] } {
  const marcas = Array.from(
    new Set(catalogo.bases.map((b) => b.marca).filter((v): v is string => Boolean(v)))
  ).sort();
  const categorias = Array.from(
    new Set(catalogo.bases.map((b) => b.categoria).filter((v): v is string => Boolean(v)))
  ).sort();
  return { marcas, categorias };
}
