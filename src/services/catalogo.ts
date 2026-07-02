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
    createdAt: new Date(row.created_at),
  };
}

/** Busca un producto por código de barras. Devuelve null si no existe. */
export async function buscarPorCodigoBarras(
  codigoBarras: string
): Promise<ProductoCompleto | null> {
  const { data: variante, error } = await supabase
    .from("producto_variantes")
    .select("*")
    .eq("codigo_barras", codigoBarras)
    .maybeSingle();

  if (error) throw error;
  if (!variante) return null;

  const { data: base, error: baseError } = await supabase
    .from("producto_bases")
    .select("*")
    .eq("id", variante.producto_base_id)
    .single();

  if (baseError) throw baseError;

  return {
    base: mapProductoBase(base as ProductoBaseRow),
    variante: mapProductoVariante(variante as ProductoVarianteRow),
  };
}

/** Obtiene una variante y su producto base a partir del id de la variante. */
export async function obtenerProductoPorVarianteId(
  varianteId: string
): Promise<ProductoCompleto | null> {
  const { data: variante, error } = await supabase
    .from("producto_variantes")
    .select("*")
    .eq("id", varianteId)
    .maybeSingle();

  if (error) throw error;
  if (!variante) return null;

  const { data: base, error: baseError } = await supabase
    .from("producto_bases")
    .select("*")
    .eq("id", variante.producto_base_id)
    .single();

  if (baseError) throw baseError;

  return {
    base: mapProductoBase(base as ProductoBaseRow),
    variante: mapProductoVariante(variante as ProductoVarianteRow),
  };
}

/** Busca productos base por nombre o marca (para autocompletado/administración liviana). */
export async function buscarProductos(termino: string): Promise<ProductoBase[]> {
  const { data, error } = await supabase
    .from("producto_bases")
    .select("*")
    .or(`nombre.ilike.%${termino}%,marca.ilike.%${termino}%`)
    .limit(20);

  if (error) throw error;
  return (data ?? []).map((row) => mapProductoBase(row as ProductoBaseRow));
}

/**
 * Crea un producto (base + variante) manualmente cuando el código escaneado
 * no está en el catálogo. Reutiliza el producto base si ya existe uno con
 * el mismo nombre + marca.
 */
export async function crearProductoManual(
  dto: CrearProductoDTO
): Promise<ProductoCompleto> {
  const { data: existente, error: buscarError } = await supabase
    .from("producto_variantes")
    .select("id")
    .eq("codigo_barras", dto.ean)
    .maybeSingle();
  if (buscarError) throw buscarError;
  if (existente) {
    throw new Error("Este código de barras ya existe en el catálogo");
  }

  const { data: baseExistente, error: baseBuscarError } = await supabase
    .from("producto_bases")
    .select("*")
    .eq("nombre", dto.productoBase.nombre.trim())
    .eq("marca", dto.productoBase.marca.trim())
    .maybeSingle();
  if (baseBuscarError) throw baseBuscarError;

  let baseRow = baseExistente as ProductoBaseRow | null;
  if (!baseRow) {
    const { data, error } = await supabase
      .from("producto_bases")
      .insert({
        nombre: dto.productoBase.nombre.trim(),
        marca: dto.productoBase.marca.trim(),
        categoria: dto.productoBase.categoria.trim(),
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
      tamano: dto.variante.tamano.trim(),
      sabor: dto.variante.sabor?.trim(),
    })
    .select()
    .single();
  if (varianteError) throw varianteError;

  return {
    base: mapProductoBase(baseRow),
    variante: mapProductoVariante(varianteRow as ProductoVarianteRow),
  };
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
