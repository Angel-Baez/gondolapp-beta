import { supabase } from "@/lib/supabase";
import { calcularNivelAlerta, toDateInputValue } from "@/lib/utils";
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
      // toDateInputValue serializa en horario local: con toISOString() una
      // fecha a medianoche local se corría un día en husos UTC+.
      fecha_vencimiento: toDateInputValue(fechaVencimiento),
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
    .update({ fecha_vencimiento: toDateInputValue(fechaVencimiento) })
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
 * borra de la lista activa. RPC atómica (`retirar_item_vencimiento`): antes
 * eran 4 round-trips secuenciales sin transacción (leer item, leer variante,
 * leer base, insertar historial, borrar) — ahora una sola llamada.
 */
export async function retirarItem(id: string): Promise<void> {
  const { error } = await supabase.rpc("retirar_item_vencimiento", { p_item_id: id });
  if (error) throw error;
}

/**
 * Retira varios items de la góndola (acción masiva). RPC atómica
 * (`retirar_items_vencimiento`, migración 0007): snapshot al historial y
 * borrado de todo el lote en una sola transacción — antes eran N RPCs en
 * paralelo, con fallos parciales posibles a mitad de lote.
 */
export async function retirarItemsMasivo(ids: string[]): Promise<void> {
  const { error } = await supabase.rpc("retirar_items_vencimiento", {
    p_item_ids: ids,
  });
  if (!error) return;
  // PGRST202: la función todavía no existe en el proyecto (migración 0007
  // sin aplicar). Fallback al retiro item por item para que el deploy del
  // front no dependa del orden de aplicación. Borrar cuando 0007 esté en prod.
  if (error.code === "PGRST202") {
    await Promise.all(ids.map((id) => retirarItem(id)));
    return;
  }
  throw error;
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

interface EstadisticasRpcResult {
  total_retirados: number;
  promedio_dias_a_retiro: number;
  productos_mas_retirados: Array<{ producto_nombre: string; cantidad: number }>;
}

/**
 * Estadísticas de retiros del período. Agrega en Postgres
 * (`obtener_estadisticas_vencimiento`, migración 0011): antes bajaba todo el
 * historial del período y agregaba en JS, con el cap implícito de 1000 filas
 * de PostgREST que silenciosamente recortaba períodos largos.
 * `totalRetirados` cuenta unidades (cantidad, o 1 si no se registró), igual
 * que el top de productos.
 */
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

  const { data, error } = await supabase.rpc("obtener_estadisticas_vencimiento", {
    p_desde: fechaInicio.toISOString(),
    p_hasta: ahora.toISOString(),
  });

  if (!error) {
    const stats = data as EstadisticasRpcResult;
    return {
      periodo,
      totalRetirados: stats.total_retirados,
      promedioDiasARetiro: Number(stats.promedio_dias_a_retiro),
      productosMasRetirados: (stats.productos_mas_retirados ?? []).map((p) => ({
        productoNombre: p.producto_nombre,
        cantidad: p.cantidad,
      })),
    };
  }

  // PGRST202: la RPC todavía no existe (migración 0011 sin aplicar).
  // Fallback al cálculo client-side para no depender del orden de deploy.
  if (error.code !== "PGRST202") throw error;
  return obtenerEstadisticasClientSide(periodo, fechaInicio, ahora);
}

async function obtenerEstadisticasClientSide(
  periodo: "semana" | "mes" | "año",
  desde: Date,
  hasta: Date
): Promise<EstadisticasVencimiento> {
  const retirados = await obtenerHistorial({ desde, hasta });

  if (retirados.length === 0) {
    return {
      periodo,
      totalRetirados: 0,
      productosMasRetirados: [],
      promedioDiasARetiro: 0,
    };
  }

  const productosCount = new Map<string, number>();
  let totalUnidades = 0;
  let sumaDias = 0;
  retirados.forEach((item) => {
    const unidades = item.cantidad ?? 1;
    totalUnidades += unidades;
    const count = productosCount.get(item.productoNombre) || 0;
    productosCount.set(item.productoNombre, count + unidades);

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
    totalRetirados: totalUnidades,
    productosMasRetirados,
    promedioDiasARetiro: sumaDias / retirados.length,
  };
}
