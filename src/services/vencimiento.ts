import { supabase } from "@/lib/supabase";
import { calcularNivelAlerta } from "@/lib/utils";
import {
  EstadisticasVencimiento,
  ItemVencimiento,
  ItemVencimientoConAlerta,
  ItemVencimientoHistorial,
} from "@/types";

interface ItemVencimientoRow {
  id: string;
  variante_id: string;
  fecha_vencimiento: string;
  cantidad: number | null;
  lote: string | null;
  estado: "pendiente" | "retirado";
  agregado_at: string;
  resuelto_at: string | null;
}

interface ItemVencimientoHistorialRow {
  id: string;
  variante_id: string | null;
  producto_nombre: string;
  producto_marca: string | null;
  variante_nombre: string;
  cantidad: number | null;
  lote: string | null;
  fecha_vencimiento: string;
  fecha_retiro: string;
  nivel_alerta_al_retirar: string;
}

function mapItem(row: ItemVencimientoRow): ItemVencimiento {
  return {
    id: row.id,
    varianteId: row.variante_id,
    // fecha_vencimiento es DATE (sin hora); se interpreta en horario local a medianoche
    fechaVencimiento: new Date(`${row.fecha_vencimiento}T00:00:00`),
    cantidad: row.cantidad ?? undefined,
    lote: row.lote ?? undefined,
    estado: row.estado,
    agregadoAt: new Date(row.agregado_at),
    resueltoAt: row.resuelto_at ? new Date(row.resuelto_at) : undefined,
  };
}

function conAlerta(item: ItemVencimiento): ItemVencimientoConAlerta {
  return { ...item, alertaNivel: calcularNivelAlerta(item.fechaVencimiento) };
}

function mapHistorial(row: ItemVencimientoHistorialRow): ItemVencimientoHistorial {
  return {
    id: row.id,
    varianteId: row.variante_id,
    productoNombre: row.producto_nombre,
    productoMarca: row.producto_marca ?? undefined,
    varianteNombre: row.variante_nombre,
    cantidad: row.cantidad ?? undefined,
    lote: row.lote ?? undefined,
    fechaVencimiento: new Date(`${row.fecha_vencimiento}T00:00:00`),
    fechaRetiro: new Date(row.fecha_retiro),
    nivelAlertaAlRetirar: row.nivel_alerta_al_retirar as ItemVencimientoHistorial["nivelAlertaAlRetirar"],
  };
}

/** Lista los items de vencimiento activos (pendientes), con el nivel de alerta calculado. */
export async function listarItems(): Promise<ItemVencimientoConAlerta[]> {
  const { data, error } = await supabase
    .from("items_vencimiento")
    .select("*")
    .eq("estado", "pendiente")
    .order("fecha_vencimiento", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => conAlerta(mapItem(row as ItemVencimientoRow)));
}

export async function agregarItem(
  varianteId: string,
  fechaVencimiento: Date,
  cantidad?: number,
  lote?: string
): Promise<ItemVencimientoConAlerta> {
  const { data, error } = await supabase
    .from("items_vencimiento")
    .insert({
      variante_id: varianteId,
      fecha_vencimiento: fechaVencimiento.toISOString().slice(0, 10),
      cantidad: cantidad ?? null,
      lote: lote ?? null,
      estado: "pendiente",
    })
    .select()
    .single();
  if (error) throw error;
  return conAlerta(mapItem(data as ItemVencimientoRow));
}

export async function actualizarFecha(
  id: string,
  fechaVencimiento: Date
): Promise<ItemVencimientoConAlerta> {
  const { data, error } = await supabase
    .from("items_vencimiento")
    .update({ fecha_vencimiento: fechaVencimiento.toISOString().slice(0, 10) })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return conAlerta(mapItem(data as ItemVencimientoRow));
}

export async function actualizarCantidad(
  id: string,
  cantidad: number
): Promise<ItemVencimientoConAlerta> {
  const { data, error } = await supabase
    .from("items_vencimiento")
    .update({ cantidad })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return conAlerta(mapItem(data as ItemVencimientoRow));
}

export async function eliminarItem(id: string): Promise<void> {
  const { error } = await supabase.from("items_vencimiento").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Retira un item de la góndola: guarda un snapshot en el historial y lo
 * borra de la lista activa. Reemplaza a "borrar" como vía principal de
 * resolución (a diferencia de hoy, deja rastro en items_vencimiento_historial).
 */
export async function retirarItem(id: string): Promise<void> {
  const { data: item, error: itemError } = await supabase
    .from("items_vencimiento")
    .select("*")
    .eq("id", id)
    .single();
  if (itemError) throw itemError;

  const { data: variante, error: varianteError } = await supabase
    .from("producto_variantes")
    .select("nombre_completo, producto_base_id")
    .eq("id", item.variante_id)
    .maybeSingle();
  if (varianteError) throw varianteError;

  let productoNombre = "Producto sin nombre";
  let productoMarca: string | null = null;
  if (variante) {
    const { data: base, error: baseError } = await supabase
      .from("producto_bases")
      .select("nombre, marca")
      .eq("id", variante.producto_base_id)
      .maybeSingle();
    if (baseError) throw baseError;
    productoNombre = base?.nombre ?? productoNombre;
    productoMarca = base?.marca ?? null;
  }

  const itemMapeado = mapItem(item as ItemVencimientoRow);

  const { error: historialError } = await supabase
    .from("items_vencimiento_historial")
    .insert({
      variante_id: item.variante_id,
      producto_nombre: productoNombre,
      producto_marca: productoMarca,
      variante_nombre: variante?.nombre_completo ?? "Variante sin nombre",
      cantidad: item.cantidad,
      lote: item.lote,
      fecha_vencimiento: item.fecha_vencimiento,
      nivel_alerta_al_retirar: calcularNivelAlerta(itemMapeado.fechaVencimiento),
    });
  if (historialError) throw historialError;

  const { error: deleteError } = await supabase
    .from("items_vencimiento")
    .delete()
    .eq("id", id);
  if (deleteError) throw deleteError;
}

export async function obtenerHistorial(filtros?: {
  desde?: Date;
  hasta?: Date;
  limite?: number;
}): Promise<ItemVencimientoHistorial[]> {
  let query = supabase
    .from("items_vencimiento_historial")
    .select("*")
    .order("fecha_retiro", { ascending: false });

  if (filtros?.desde) query = query.gte("fecha_retiro", filtros.desde.toISOString());
  if (filtros?.hasta) query = query.lte("fecha_retiro", filtros.hasta.toISOString());
  if (filtros?.limite) query = query.limit(filtros.limite);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapHistorial(row as ItemVencimientoHistorialRow));
}

export async function obtenerEstadisticas(
  periodo: "semana" | "mes" | "año"
): Promise<EstadisticasVencimiento> {
  const ahora = new Date();
  const fechaInicio = new Date();
  switch (periodo) {
    case "semana":
      fechaInicio.setDate(ahora.getDate() - 7);
      break;
    case "mes":
      fechaInicio.setMonth(ahora.getMonth() - 1);
      break;
    case "año":
      fechaInicio.setFullYear(ahora.getFullYear() - 1);
      break;
  }

  const retirados = await obtenerHistorial({ desde: fechaInicio, hasta: ahora });

  if (retirados.length === 0) {
    return {
      periodo,
      totalRetirados: 0,
      productosMasRetirados: [],
      promedioDiasARetiro: 0,
    };
  }

  const productosCount = new Map<string, number>();
  let sumaDias = 0;
  retirados.forEach((item) => {
    const count = productosCount.get(item.productoNombre) || 0;
    productosCount.set(item.productoNombre, count + (item.cantidad ?? 1));

    const dias = Math.floor(
      (item.fechaRetiro.getTime() - item.fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24)
    );
    sumaDias += dias;
  });

  const productosMasRetirados = Array.from(productosCount.entries())
    .map(([productoNombre, cantidad]) => ({ productoNombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  return {
    periodo,
    totalRetirados: retirados.length,
    productosMasRetirados,
    promedioDiasARetiro: sumaDias / retirados.length,
  };
}
