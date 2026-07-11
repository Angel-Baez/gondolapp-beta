import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AtributosVariante,
  CategoriaAtributo,
  CrearProductoDTO,
  ProductoBase,
  ProductoVariante,
} from "@/types";

export interface ProductoCompleto {
  base: ProductoBase;
  variante: ProductoVariante;
}

interface ProductoBaseRow {
  id: string;
  nombre: string;
  marca: string | null;
  categoria: string | null;
  imagen: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductoVarianteRow {
  id: string;
  producto_base_id: string;
  codigo_barras: string;
  nombre_completo: string;
  atributos: Record<string, string> | null;
  imagen: string | null;
  created_at: string;
}

function mapProductoBase(row: ProductoBaseRow): ProductoBase {
  return {
    id: row.id,
    nombre: row.nombre,
    marca: row.marca ?? undefined,
    categoria: row.categoria ?? undefined,
    imagen: row.imagen ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapProductoVariante(row: ProductoVarianteRow): ProductoVariante {
  return {
    id: row.id,
    productoBaseId: row.producto_base_id,
    codigoBarras: row.codigo_barras,
    nombreCompleto: row.nombre_completo,
    // `?? {}` defensivo: respuestas viejas o caché con shape anterior
    // pueden no traer la clave; el resto del código asume objeto.
    atributos: row.atributos ?? {},
    imagen: row.imagen ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

interface ProductoVarianteConBaseRow extends ProductoVarianteRow {
  producto_bases: ProductoBaseRow | null;
}

function mapProductoCompleto(row: ProductoVarianteConBaseRow): ProductoCompleto | null {
  if (!row.producto_bases) return null;
  return {
    base: mapProductoBase(row.producto_bases),
    variante: mapProductoVariante(row),
  };
}

/**
 * Busca un producto por código de barras. Devuelve null si no existe.
 *
 * Trae variante + base en un solo round-trip vía embedding de PostgREST
 * (antes eran dos consultas secuenciales, lo que duplicaba la latencia
 * en el camino crítico de "escanear código").
 */
export async function buscarPorCodigoBarras(
  tiendaId: string,
  codigoBarras: string
): Promise<ProductoCompleto | null> {
  // El filtro por tienda es obligatorio: el EAN es único POR TIENDA desde
  // la Fase 2, y para un usuario multi-membresía el maybeSingle() fallaría
  // con dos matches.
  const { data, error } = await supabase
    .from("producto_variantes")
    .select("*, producto_bases(*)")
    .eq("tienda_id", tiendaId)
    .eq("codigo_barras", codigoBarras)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapProductoCompleto(data as ProductoVarianteConBaseRow);
}

/** Obtiene una variante y su producto base a partir del id de la variante. */
export async function obtenerProductoPorVarianteId(
  varianteId: string
): Promise<ProductoCompleto | null> {
  const { data, error } = await supabase
    .from("producto_variantes")
    .select("*, producto_bases(*)")
    .eq("id", varianteId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapProductoCompleto(data as ProductoVarianteConBaseRow);
}

/**
 * Saca caracteres que rompen el filtro `.or()` de PostgREST (coma separa
 * condiciones, `%`/`(`/`)` tienen significado propio en ilike/or).
 */
function sanitizarTerminoBusqueda(termino: string): string {
  return termino.replace(/[,%()]/g, "").trim();
}

/** Busca productos base por nombre o marca (para autocompletado/administración liviana). */
export async function buscarProductos(
  tiendaId: string,
  termino: string
): Promise<ProductoBase[]> {
  const limpio = sanitizarTerminoBusqueda(termino);
  if (limpio.length < 2) return [];

  const { data, error } = await supabase
    .from("producto_bases")
    .select("*")
    .eq("tienda_id", tiendaId)
    .or(`nombre.ilike.%${limpio}%,marca.ilike.%${limpio}%`)
    .limit(20);

  if (error) throw error;
  return (data ?? []).map((row) => mapProductoBase(row as ProductoBaseRow));
}

/**
 * Busca variantes (con su base) por nombre completo, o por nombre/marca de
 * la base — para agregar productos por búsqueda en vez de escaneo. Dos
 * queries en paralelo (PostgREST no permite `.or()` cruzando la tabla
 * principal y la referenciada en la misma llamada) mergeadas por variante.id.
 */
export async function buscarVariantes(
  tiendaId: string,
  termino: string
): Promise<ProductoCompleto[]> {
  const limpio = sanitizarTerminoBusqueda(termino);
  if (limpio.length < 2) return [];

  const [porNombreVariante, porBase] = await Promise.all([
    supabase
      .from("producto_variantes")
      .select("*, producto_bases(*)")
      .eq("tienda_id", tiendaId)
      .ilike("nombre_completo", `%${limpio}%`)
      .limit(15),
    supabase
      .from("producto_variantes")
      .select("*, producto_bases!inner(*)")
      .eq("tienda_id", tiendaId)
      .or(`nombre.ilike.%${limpio}%,marca.ilike.%${limpio}%`, {
        referencedTable: "producto_bases",
      })
      .limit(15),
  ]);

  if (porNombreVariante.error) throw porNombreVariante.error;
  if (porBase.error) throw porBase.error;

  const vistos = new Set<string>();
  const resultado: ProductoCompleto[] = [];
  for (const row of [
    ...((porNombreVariante.data ?? []) as ProductoVarianteConBaseRow[]),
    ...((porBase.data ?? []) as ProductoVarianteConBaseRow[]),
  ]) {
    if (vistos.has(row.id)) continue;
    vistos.add(row.id);
    const producto = mapProductoCompleto(row);
    if (producto) resultado.push(producto);
  }
  return resultado;
}

/** Trim de claves y valores, descartando entradas vacías. */
function sanitizarAtributos(atributos?: AtributosVariante): AtributosVariante {
  return Object.fromEntries(
    Object.entries(atributos ?? {})
      .map(([clave, valor]) => [clave.trim(), String(valor).trim()])
      .filter(([clave, valor]) => clave && valor)
  );
}

/**
 * Crea un producto (base + variante) manualmente cuando el código escaneado
 * no está en el catálogo. Reutiliza el producto base si ya existe uno con
 * el mismo nombre + marca.
 */
export async function crearProductoManual(
  tiendaId: string,
  dto: CrearProductoDTO,
  client: SupabaseClient = supabase
): Promise<ProductoCompleto> {
  // Los dos checks de existencia son independientes entre sí: se disparan
  // en paralelo para no pagar dos round-trips secuenciales antes de poder
  // crear el producto. Scoped a la tienda: el mismo EAN/base puede existir
  // en otra tienda.
  const [
    { data: existente, error: buscarError },
    { data: baseExistente, error: baseBuscarError },
  ] = await Promise.all([
    client
      .from("producto_variantes")
      .select("id")
      .eq("tienda_id", tiendaId)
      .eq("codigo_barras", dto.ean)
      .maybeSingle(),
    // ilike sin comodines = igualdad case-insensitive: reutiliza la base
    // aunque el tipeo difiera en mayúsculas ("MILEX" → base "Milex"), en
    // vez de chocar con el índice único de la migración 0010.
    client
      .from("producto_bases")
      .select("*")
      .eq("tienda_id", tiendaId)
      .ilike("nombre", dto.productoBase.nombre.trim())
      .ilike("marca", dto.productoBase.marca.trim())
      .maybeSingle(),
  ]);
  if (buscarError) throw buscarError;
  if (existente) {
    throw new Error("Este código de barras ya existe en el catálogo");
  }
  if (baseBuscarError) throw baseBuscarError;

  let baseRow = baseExistente as ProductoBaseRow | null;
  if (!baseRow) {
    // producto_bases es tabla raíz: tienda_id explícito (las variantes lo
    // derivan por trigger desde la base).
    const { data, error } = await client
      .from("producto_bases")
      .insert({
        tienda_id: tiendaId,
        nombre: dto.productoBase.nombre.trim(),
        marca: dto.productoBase.marca.trim(),
        categoria: dto.productoBase.categoria?.trim() || null,
        imagen: dto.productoBase.imagen,
      })
      .select()
      .single();
    if (error) throw error;
    baseRow = data as ProductoBaseRow;
  }

  // nombre_completo no se manda: es un campo derivado y su dueño es el
  // trigger de BD (migración 0008), que lo arma desde atributos con el
  // orden de la categoría. Así imports masivos o fixes por SQL nunca lo
  // dejan desincronizado de la búsqueda ilike.
  const { data: varianteRow, error: varianteError } = await client
    .from("producto_variantes")
    .insert({
      producto_base_id: baseRow.id,
      codigo_barras: dto.ean.trim(),
      atributos: sanitizarAtributos(dto.variante.atributos),
      imagen: dto.variante.imagen,
    })
    .select()
    .single();
  if (varianteError) throw varianteError;

  return {
    base: mapProductoBase(baseRow),
    variante: mapProductoVariante(varianteRow as ProductoVarianteRow),
  };
}

/**
 * Trae base+variante para un lote de varianteId de una sola vez (evita N+1 en las listas).
 *
 * Devuelve un objeto plano (no un Map): esta query se persiste en IndexedDB
 * vía JSON.stringify (ver queryPersister.ts) y un Map serializa como `{}`,
 * lo que rompía la app al rehidratar (`.get is not a function`).
 */
export async function obtenerProductosPorVarianteIds(
  varianteIds: string[]
): Promise<Record<string, ProductoCompleto>> {
  const idsUnicos = Array.from(new Set(varianteIds));
  const resultado: Record<string, ProductoCompleto> = {};
  if (idsUnicos.length === 0) return resultado;

  const { data, error } = await supabase
    .from("producto_variantes")
    .select("*, producto_bases(*)")
    .in("id", idsUnicos);
  if (error) throw error;

  for (const row of (data ?? []) as ProductoVarianteConBaseRow[]) {
    const producto = mapProductoCompleto(row);
    if (!producto) continue;
    resultado[row.id] = producto;
  }
  return resultado;
}

interface CategoriaAtributoRow {
  categoria: string | null;
  clave: string;
  etiqueta: string;
  orden: number;
  sugerencias: string[] | null;
}

export interface DefinicionesAtributos {
  /** Claves del default global (filas con categoria null). */
  default: CategoriaAtributo[];
  /** Una categoría con >=1 fila REEMPLAZA al default (no mergea). */
  porCategoria: Record<string, CategoriaAtributo[]>;
}

/**
 * Definiciones de atributos por categoría: qué claves mostrar en el
 * formulario dinámico, con qué etiqueta/orden y qué valores sugerir.
 * La tabla es diminuta (unas filas por categoría), se trae entera.
 */
export async function obtenerDefinicionesAtributos(
  tiendaId: string,
  client: SupabaseClient = supabase
): Promise<DefinicionesAtributos> {
  const { data, error } = await client
    .from("categoria_atributos")
    .select("categoria, clave, etiqueta, orden, sugerencias")
    .eq("tienda_id", tiendaId)
    .order("orden");
  if (error) throw error;

  const resultado: DefinicionesAtributos = { default: [], porCategoria: {} };
  for (const row of (data ?? []) as CategoriaAtributoRow[]) {
    const def: CategoriaAtributo = {
      clave: row.clave,
      etiqueta: row.etiqueta,
      orden: row.orden,
      sugerencias: row.sugerencias?.length ? row.sugerencias : undefined,
    };
    if (row.categoria === null) {
      resultado.default.push(def);
    } else {
      (resultado.porCategoria[row.categoria] ??= []).push(def);
    }
  }
  return resultado;
}

/** Marcas y categorías existentes, para autocompletar el formulario de alta manual. */
export async function obtenerMarcasYCategorias(
  tiendaId: string,
  client: SupabaseClient = supabase
): Promise<{
  marcas: string[];
  categorias: string[];
}> {
  const { data, error } = await client
    .from("producto_bases")
    .select("marca, categoria")
    .eq("tienda_id", tiendaId);
  if (error) throw error;

  const marcas = Array.from(
    new Set((data ?? []).map((d) => d.marca).filter((v): v is string => Boolean(v)))
  ).sort();
  const categorias = Array.from(
    new Set((data ?? []).map((d) => d.categoria).filter((v): v is string => Boolean(v)))
  ).sort();

  return { marcas, categorias };
}

export interface CatalogoCompleto {
  bases: ProductoBase[];
  variantes: ProductoVariante[];
  definiciones: DefinicionesAtributos;
}

/**
 * Todo el catálogo (bases + variantes + definiciones de atributos) en un
 * solo objeto: 110 bases / 402 variantes pesan ~164KB en JSON, trivial para
 * cachear entero en IndexedDB. Es la fuente para lookup/búsqueda offline
 * (ver src/lib/catalogoLocal.ts) — reemplaza N round-trips por 1 sync.
 */
export async function obtenerCatalogoCompleto(
  tiendaId: string
): Promise<CatalogoCompleto> {
  const [basesResult, variantesResult, definiciones] = await Promise.all([
    supabase.from("producto_bases").select("*").eq("tienda_id", tiendaId),
    supabase.from("producto_variantes").select("*").eq("tienda_id", tiendaId),
    obtenerDefinicionesAtributos(tiendaId),
  ]);
  if (basesResult.error) throw basesResult.error;
  if (variantesResult.error) throw variantesResult.error;

  return {
    bases: (basesResult.data ?? []).map((row) => mapProductoBase(row as ProductoBaseRow)),
    variantes: (variantesResult.data ?? []).map((row) =>
      mapProductoVariante(row as ProductoVarianteRow)
    ),
    definiciones,
  };
}
