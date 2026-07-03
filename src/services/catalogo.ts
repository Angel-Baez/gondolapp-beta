import { supabase } from "@/lib/supabase";
import { CrearProductoDTO, ProductoBase, ProductoVariante } from "@/types";

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
  tipo: string | null;
  tamano: string | null;
  sabor: string | null;
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
    tipo: row.tipo ?? undefined,
    tamano: row.tamano ?? undefined,
    sabor: row.sabor ?? undefined,
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
  codigoBarras: string
): Promise<ProductoCompleto | null> {
  const { data, error } = await supabase
    .from("producto_variantes")
    .select("*, producto_bases(*)")
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
export async function buscarProductos(termino: string): Promise<ProductoBase[]> {
  const limpio = sanitizarTerminoBusqueda(termino);
  if (limpio.length < 2) return [];

  const { data, error } = await supabase
    .from("producto_bases")
    .select("*")
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
export async function buscarVariantes(termino: string): Promise<ProductoCompleto[]> {
  const limpio = sanitizarTerminoBusqueda(termino);
  if (limpio.length < 2) return [];

  const [porNombreVariante, porBase] = await Promise.all([
    supabase
      .from("producto_variantes")
      .select("*, producto_bases(*)")
      .ilike("nombre_completo", `%${limpio}%`)
      .limit(15),
    supabase
      .from("producto_variantes")
      .select("*, producto_bases!inner(*)")
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

/**
 * Crea un producto (base + variante) manualmente cuando el código escaneado
 * no está en el catálogo. Reutiliza el producto base si ya existe uno con
 * el mismo nombre + marca.
 */
export async function crearProductoManual(
  dto: CrearProductoDTO
): Promise<ProductoCompleto> {
  // Los dos checks de existencia son independientes entre sí: se disparan
  // en paralelo para no pagar dos round-trips secuenciales antes de poder
  // crear el producto.
  const [
    { data: existente, error: buscarError },
    { data: baseExistente, error: baseBuscarError },
  ] = await Promise.all([
    supabase
      .from("producto_variantes")
      .select("id")
      .eq("codigo_barras", dto.ean)
      .maybeSingle(),
    supabase
      .from("producto_bases")
      .select("*")
      .eq("nombre", dto.productoBase.nombre.trim())
      .eq("marca", dto.productoBase.marca.trim())
      .maybeSingle(),
  ]);
  if (buscarError) throw buscarError;
  if (existente) {
    throw new Error("Este código de barras ya existe en el catálogo");
  }
  if (baseBuscarError) throw baseBuscarError;

  let baseRow = baseExistente as ProductoBaseRow | null;
  if (!baseRow) {
    const { data, error } = await supabase
      .from("producto_bases")
      .insert({
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

  const nombreCompleto = [dto.variante.tipo, dto.variante.tamano, dto.variante.sabor]
    .filter(Boolean)
    .join(" ")
    .trim();

  const { data: varianteRow, error: varianteError } = await supabase
    .from("producto_variantes")
    .insert({
      producto_base_id: baseRow.id,
      codigo_barras: dto.ean.trim(),
      nombre_completo: nombreCompleto || dto.productoBase.nombre,
      tipo: dto.variante.tipo?.trim(),
      tamano: dto.variante.tamano?.trim() || null,
      sabor: dto.variante.sabor?.trim(),
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

/** Trae base+variante para un lote de varianteId de una sola vez (evita N+1 en las listas). */
export async function obtenerProductosPorVarianteIds(
  varianteIds: string[]
): Promise<Map<string, ProductoCompleto>> {
  const idsUnicos = Array.from(new Set(varianteIds));
  if (idsUnicos.length === 0) return new Map();

  const { data, error } = await supabase
    .from("producto_variantes")
    .select("*, producto_bases(*)")
    .in("id", idsUnicos);
  if (error) throw error;

  const resultado = new Map<string, ProductoCompleto>();
  for (const row of (data ?? []) as ProductoVarianteConBaseRow[]) {
    const producto = mapProductoCompleto(row);
    if (!producto) continue;
    resultado.set(row.id, producto);
  }
  return resultado;
}

/** Marcas y categorías existentes, para autocompletar el formulario de alta manual. */
export async function obtenerMarcasYCategorias(): Promise<{
  marcas: string[];
  categorias: string[];
}> {
  const { data, error } = await supabase
    .from("producto_bases")
    .select("marca, categoria");
  if (error) throw error;

  const marcas = Array.from(
    new Set((data ?? []).map((d) => d.marca).filter((v): v is string => Boolean(v)))
  ).sort();
  const categorias = Array.from(
    new Set((data ?? []).map((d) => d.categoria).filter((v): v is string => Boolean(v)))
  ).sort();

  return { marcas, categorias };
}
