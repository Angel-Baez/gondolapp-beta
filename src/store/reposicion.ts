import { db } from "@/lib/db";
import { generarUUID } from "@/lib/utils";
import {
  EstadisticasReposicion,
  ItemHistorial,
  ItemReposicion,
  ListaReposicionHistorial,
  ProductoVariante,
} from "@/types";
import { create } from "zustand";

interface ReposicionStore {
  items: ItemReposicion[];
  loading: boolean;
  error: string | null;

  // Acciones
  cargarItems: () => Promise<void>;
  agregarItem: (varianteId: string, cantidad: number) => Promise<void>;
  actualizarCantidad: (id: string, cantidad: number) => Promise<void>;
  marcarRepuesto: (id: string, repuesto: boolean) => Promise<void>;
  marcarSinStock: (id: string, sinStock: boolean) => Promise<void>;
  eliminarItem: (id: string) => Promise<void>;
  obtenerItemConVariante: (
    id: string
  ) => Promise<{ item: ItemReposicion; variante: ProductoVariante } | null>;

  // Nuevas funciones para historial
  guardarListaActual: () => Promise<void>;
  limpiarListaActual: () => Promise<void>;
  obtenerHistorial: (filtros?: {
    desde?: Date;
    hasta?: Date;
    limite?: number;
  }) => Promise<ListaReposicionHistorial[]>;
  eliminarListaHistorial: (id: string) => Promise<void>;
  obtenerEstadisticas: (
    periodo: "semana" | "mes" | "año"
  ) => Promise<EstadisticasReposicion>;
}

export const useReposicionStore = create<ReposicionStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  cargarItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await db.itemsReposicion
        .orderBy("agregadoAt")
        .reverse()
        .toArray();
      set({ items, loading: false });
    } catch (error) {
      set({ error: "Error al cargar items de reposición", loading: false });
    }
  },

  agregarItem: async (varianteId: string, cantidad: number) => {
    try {
      // Verificar si ya existe un item pendiente para esta variante
      const existente = await db.itemsReposicion
        .where("varianteId")
        .equals(varianteId)
        .and((item) => !item.repuesto && !item.sinStock)
        .first();

      if (existente) {
        const updatedItem = {
          ...existente,
          cantidad: existente.cantidad + cantidad,
          actualizadoAt: new Date(),
        };

        // Actualización optimista
        set((state) => ({
          items: state.items.map((item) =>
            item.id === existente.id ? updatedItem : item
          ),
        }));

        await db.itemsReposicion.update(existente.id, {
          cantidad: existente.cantidad + cantidad,
          actualizadoAt: new Date(),
        });
      } else {
        // Crear nuevo item
        const nuevoItem: ItemReposicion = {
          id: generarUUID(),
          varianteId,
          cantidad,
          repuesto: false,
          sinStock: false,
          agregadoAt: new Date(),
          actualizadoAt: new Date(),
        };

        // Actualización optimista
        set((state) => ({
          items: [nuevoItem, ...state.items],
        }));

        await db.itemsReposicion.add(nuevoItem);
      }
    } catch (error) {
      set({ error: "Error al agregar item" });
      // Recargar en caso de error
      await get().cargarItems();
    }
  },

  actualizarCantidad: async (id: string, cantidad: number) => {
    const cantidadFinal = Math.max(1, cantidad);

    // Actualización optimista
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, cantidad: cantidadFinal, actualizadoAt: new Date() }
          : item
      ),
    }));

    try {
      await db.itemsReposicion.update(id, {
        cantidad: cantidadFinal,
        actualizadoAt: new Date(),
      });
    } catch (error) {
      set({ error: "Error al actualizar cantidad" });
      await get().cargarItems();
    }
  },

  marcarRepuesto: async (id: string, repuesto: boolean) => {
    // Actualización optimista
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, repuesto, actualizadoAt: new Date() } : item
      ),
    }));

    try {
      await db.itemsReposicion.update(id, {
        repuesto,
        actualizadoAt: new Date(),
      });
    } catch (error) {
      set({ error: "Error al marcar como repuesto" });
      await get().cargarItems();
    }
  },

  marcarSinStock: async (id: string, sinStock: boolean) => {
    // Actualización optimista
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, sinStock, actualizadoAt: new Date() } : item
      ),
    }));

    try {
      await db.itemsReposicion.update(id, {
        sinStock,
        actualizadoAt: new Date(),
      });
    } catch (error) {
      set({ error: "Error al marcar sin stock" });
      await get().cargarItems();
    }
  },

  eliminarItem: async (id: string) => {
    // Actualización optimista
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));

    try {
      await db.itemsReposicion.delete(id);
    } catch (error) {
      set({ error: "Error al eliminar item" });
      await get().cargarItems();
    }
  },

  obtenerItemConVariante: async (id: string) => {
    try {
      const item = await db.itemsReposicion.get(id);
      if (!item) return null;

      const variante = await db.productosVariantes.get(item.varianteId);
      if (!variante) return null;

      return { item, variante };
    } catch (error) {
      return null;
    }
  },

  guardarListaActual: async () => {
    try {
      const items = await db.itemsReposicion.toArray();
      if (items.length === 0) {
        throw new Error("No hay items para guardar");
      }

      // Obtener datos completos de cada item
      const itemsHistorial: ItemHistorial[] = await Promise.all(
        items.map(async (item) => {
          const variante = await db.productosVariantes.get(item.varianteId);
          const base = variante
            ? await db.productosBase.get(variante.productoBaseId)
            : null;

          let estado: "repuesto" | "sinStock" | "pendiente" = "pendiente";
          if (item.repuesto) estado = "repuesto";
          else if (item.sinStock) estado = "sinStock";

          return {
            varianteId: item.varianteId,
            productoNombre: base?.nombre || "Producto sin nombre",
            productoMarca: base?.marca,
            varianteNombre: variante?.nombreCompleto || "Variante sin nombre",
            cantidad: item.cantidad,
            estado,
          };
        })
      );

      // Calcular resumen
      const totalRepuestos = items.filter((i) => i.repuesto).length;
      const totalSinStock = items.filter((i) => i.sinStock).length;
      const totalPendientes = items.filter(
        (i) => !i.repuesto && !i.sinStock
      ).length;

      // Crear lista historial
      const listaHistorial: ListaReposicionHistorial = {
        id: generarUUID(),
        fechaCreacion: new Date(), // Timestamp when list was created (could be tracked from first item)
        fechaGuardado: new Date(), // Timestamp when list was saved to history
        resumen: {
          totalProductos: items.length,
          totalRepuestos,
          totalSinStock,
          totalPendientes,
        },
        items: itemsHistorial,
        metadata: {},
      };

      // Guardar en IndexedDB
      await db.listasHistorial.add(listaHistorial);

      // Limpiar lista actual
      await get().limpiarListaActual();
    } catch (error) {
      console.error("Error al guardar lista:", error);
      throw error;
    }
  },

  limpiarListaActual: async () => {
    try {
      // Eliminar todos los items de reposición
      await db.itemsReposicion.clear();
      set({ items: [] });
    } catch (error) {
      console.error("Error al limpiar lista:", error);
      throw error;
    }
  },

  obtenerHistorial: async (filtros?: {
    desde?: Date;
    hasta?: Date;
    limite?: number;
  }) => {
    try {
      let query = db.listasHistorial.orderBy("fechaGuardado").reverse();

      if (filtros?.limite) {
        query = query.limit(filtros.limite);
      }

      let listas = await query.toArray();

      // Filtrar por rango de fechas si se especifica
      if (filtros?.desde || filtros?.hasta) {
        listas = listas.filter((lista) => {
          const fecha = new Date(lista.fechaGuardado);
          if (filtros.desde && fecha < filtros.desde) return false;
          if (filtros.hasta && fecha > filtros.hasta) return false;
          return true;
        });
      }

      return listas;
    } catch (error) {
      console.error("Error al obtener historial:", error);
      return [];
    }
  },

  eliminarListaHistorial: async (id: string) => {
    try {
      await db.listasHistorial.delete(id);
    } catch (error) {
      console.error("Error al eliminar lista del historial:", error);
      throw error;
    }
  },

  obtenerEstadisticas: async (periodo: "semana" | "mes" | "año") => {
    try {
      // Calcular fecha de inicio según el periodo
      const ahora = new Date();
      const fechaInicio = new Date();

      switch (periodo) {
        case "semana":
          fechaInicio.setDate(ahora.getDate() - 7);
          break;
        case "mes":
          fechaInicio.setMonth(ahora.getMonth() - 1);
          break;
        case "año": // Note: Using UTF-8 character for año (year in Spanish)
          fechaInicio.setFullYear(ahora.getFullYear() - 1);
          break;
      }

      // Obtener listas del periodo
      const listas = await db.listasHistorial
        .where("fechaGuardado")
        .between(fechaInicio, ahora)
        .toArray();

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

      // Calcular estadísticas
      const totalRepuestos = listas.reduce(
        (sum, lista) => sum + lista.resumen.totalRepuestos,
        0
      );
      const totalSinStock = listas.reduce(
        (sum, lista) => sum + lista.resumen.totalSinStock,
        0
      );
      const totalProductos = listas.reduce(
        (sum, lista) => sum + lista.resumen.totalProductos,
        0
      );

      // Contar productos más repuestos
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
        .slice(0, 10); // Top 10

      return {
        periodo,
        totalListas: listas.length,
        promedioProductosPorLista: totalProductos / listas.length,
        totalProductosRepuestos: totalRepuestos,
        totalProductosSinStock: totalSinStock,
        productosMasRepuestos,
      };
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      return {
        periodo,
        totalListas: 0,
        promedioProductosPorLista: 0,
        totalProductosRepuestos: 0,
        totalProductosSinStock: 0,
        productosMasRepuestos: [],
      };
    }
  },
}));
