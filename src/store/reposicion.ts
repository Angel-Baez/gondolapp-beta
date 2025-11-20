import { db } from "@/lib/db";
import { generarUUID } from "@/lib/utils";
import { ItemReposicion, ProductoVariante } from "@/types";
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
}));
