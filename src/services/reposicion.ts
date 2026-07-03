import { supabase } from "@/lib/supabase";
import {
  EstadisticasReposicion,
  EstadoReposicion,
  ItemHistorial,
  ItemReposicion,
  ListaReposicionHistorial,
} from "@/types";

interface ItemReposicionRow {
  id: string;
  variante_id: string;
  cantidad: number;
  estado: EstadoReposicion;
  agregado_at: string;
  actualizado_at: string;
}

interface ListaHistorialRow {
  id: string;
  fecha_creacion: string;
  fecha_guardado: string;
  total_productos: number;
  total_repuestos: number;
  total_sin_stock: number;
  total_pendientes: number;
  duracion_minutos: number | null;
  ubicacion: string | null;
}

interface ItemHistorialRow {
  id: string;
  lista_id: string;
  variante_id: string | null;
  producto_nombre: string;
  producto_marca: string | null;
  variante_nombre: string;
  cantidad: number;
  estado: EstadoReposicion;
}

function mapItem(row: ItemReposicionRow): ItemReposicion {
  return {
    id: row.id,
    varianteId: row.variante_id,
    cantidad: row.cantidad,
    estado: row.estado,
    agregadoAt: new Date(row.agregado_at),
    actualizadoAt: new Date(row.actualizado_at),
  };
}

function mapItemHistorial(row: ItemHistorialRow): ItemHistorial {
  return {
    varianteId: row.variante_id,
    productoNombre: row.producto_nombre,
    productoMarca: row.producto_marca ?? undefined,
    varianteNombre: row.variante_nombre,
    cantidad: row.cantidad,
    estado: row.estado,
  };
}

function mapLista(
  row: ListaHistorialRow,
  items: ItemHistorialRow[]
): ListaReposicionHistorial {
  return {
    id: row.id,
    fechaCreacion: new Date(row.fecha_creacion),
    fechaGuardado: new Date(row.fecha_guardado),
    resumen: {
      totalProductos: row.total_productos,
      totalRepuestos: row.total_repuestos,
      totalSinStock: row.total_sin_stock,
      totalPendientes: row.total_pendientes,
    },
    items: items.map(mapItemHistorial),
    metadata: {
      duracionMinutos: row.duracion_minutos ?? undefined,
      ubicacion: row.ubicacion ?? undefined,
    },
  };
}

export async function listarItems(): Promise<ItemReposicion[]> {
  const { data, error } = await supabase
    .from("items_reposicion")
    .select("*")
    .order("agregado_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapItem(row as ItemReposicionRow));
}

/**
 * Agrega cantidad a un item existente de la misma variante (en cualquier
 * estado, no solo pendiente: reescanear algo ya repuesto/sin_stock lo
 * reabre en vez de crear una fila duplicada), o crea uno nuevo si no existe.
 */
export async function agregarItem(
  varianteId: string,
  cantidad: number
): Promise<ItemReposicion> {
  const { data: existentes, error: buscarError } = await supabase
    .from("items_reposicion")
    .select("*")
    .eq("variante_id", varianteId)
    .order("agregado_at", { ascending: false })
    .limit(1);
  if (buscarError) throw buscarError;
  const existente = existentes?.[0];

  if (existente) {
    const { data, error } = await supabase
      .from("items_reposicion")
      .update({ cantidad: existente.cantidad + cantidad, estado: "pendiente" })
      .eq("id", existente.id)
      .select()
      .single();
    if (error) throw error;
    return mapItem(data as ItemReposicionRow);
  }

  const { data, error } = await supabase
    .from("items_reposicion")
    .insert({ variante_id: varianteId, cantidad, estado: "pendiente" })
    .select()
    .single();
  if (error) throw error;
  return mapItem(data as ItemReposicionRow);
}

/**
 * Actualiza la cantidad de un item. Si la cantidad llega a 0, borra el item
 * (el llamador es responsable de mostrar undo antes de invocar esto).
 */
export async function actualizarCantidad(
  id: string,
  cantidad: number
): Promise<ItemReposicion | null> {
  if (cantidad <= 0) {
    await eliminarItem(id);
    return null;
  }
  const { data, error } = await supabase
    .from("items_reposicion")
    .update({ cantidad })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapItem(data as ItemReposicionRow);
}

export async function cambiarEstado(
  id: string,
  estado: EstadoReposicion
): Promise<ItemReposicion> {
  const { data, error } = await supabase
    .from("items_reposicion")
    .update({ estado })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapItem(data as ItemReposicionRow);
}

export async function eliminarItem(id: string): Promise<void> {
  const { error } = await supabase.from("items_reposicion").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Cierra la lista actual: guarda un snapshot en el historial y borra
 * todos los items activos de reposición ("cerrar turno"). RPC atómica
 * (`guardar_lista_reposicion`): antes eran ~6 round-trips secuenciales sin
 * transacción (leer items, leer variantes, leer bases, insertar lista,
 * insertar items de historial, borrar activos), con riesgo real de quedar
 * a mitad de camino si algún paso fallaba.
 */
export async function guardarListaActual(): Promise<void> {
  const { error } = await supabase.rpc("guardar_lista_reposicion");
  if (error) throw error;
}

export async function obtenerHistorial(filtros?: {
  desde?: Date;
  hasta?: Date;
  limite?: number;
}): Promise<ListaReposicionHistorial[]> {
  let query = supabase
    .from("listas_reposicion_historial")
    .select("*")
    .order("fecha_guardado", { ascending: false });

  if (filtros?.desde) query = query.gte("fecha_guardado", filtros.desde.toISOString());
  if (filtros?.hasta) query = query.lte("fecha_guardado", filtros.hasta.toISOString());
  if (filtros?.limite) query = query.limit(filtros.limite);

  const { data: listas, error } = await query;
  if (error) throw error;
  if (!listas || listas.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("items_reposicion_historial")
    .select("*")
    .in(
      "lista_id",
      listas.map((l) => l.id)
    );
  if (itemsError) throw itemsError;

  const itemsPorLista = new Map<string, ItemHistorialRow[]>();
  for (const item of (items ?? []) as ItemHistorialRow[]) {
    const arr = itemsPorLista.get(item.lista_id) ?? [];
    arr.push(item);
    itemsPorLista.set(item.lista_id, arr);
  }

  return listas.map((lista) =>
    mapLista(lista as ListaHistorialRow, itemsPorLista.get(lista.id) ?? [])
  );
}

export async function eliminarListaHistorial(id: string): Promise<void> {
  const { error } = await supabase
    .from("listas_reposicion_historial")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function obtenerEstadisticas(
  periodo: "semana" | "mes" | "año"
): Promise<EstadisticasReposicion> {
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

  const listas = await obtenerHistorial({ desde: fechaInicio, hasta: ahora });

  if (listas.length === 0) {
    return {
      periodo,
      totalListas: 0,
      promedioProductosPorLista: 0,
      totalProductosRepuestos: 0,
      totalProductosSinStock: 0,
      productosMasRepuestos: [],
    };
  }

  const totalRepuestos = listas.reduce((sum, l) => sum + l.resumen.totalRepuestos, 0);
  const totalSinStock = listas.reduce((sum, l) => sum + l.resumen.totalSinStock, 0);
  const totalProductos = listas.reduce((sum, l) => sum + l.resumen.totalProductos, 0);

  const productosCount = new Map<string, number>();
  listas.forEach((lista) => {
    lista.items
      .filter((item) => item.estado === "repuesto")
      .forEach((item) => {
        const count = productosCount.get(item.productoNombre) || 0;
        productosCount.set(item.productoNombre, count + item.cantidad);
      });
  });

  const productosMasRepuestos = Array.from(productosCount.entries())
    .map(([productoNombre, cantidad]) => ({ productoNombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  return {
    periodo,
    totalListas: listas.length,
    promedioProductosPorLista: totalProductos / listas.length,
    totalProductosRepuestos: totalRepuestos,
    totalProductosSinStock: totalSinStock,
    productosMasRepuestos,
  };
}
