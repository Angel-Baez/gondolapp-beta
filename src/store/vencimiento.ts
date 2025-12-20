import { __unsafeDirectDbAccess as db } from "@/lib/db";
import { calcularNivelAlerta, generarUUID } from "@/lib/utils";
import { ItemVencimiento, ProductoVariante } from "@/types";
import { create } from "zustand";

interface VencimientoStore {
  items: ItemVencimiento[];
  loading: boolean;
  error: string | null;

  // Acciones
  cargarItems: () => Promise<void>;
  agregarItem: (
    varianteId: string,
    fechaVencimiento: Date,
    cantidad?: number,
    lote?: string
  ) => Promise<void>;
  actualizarFecha: (id: string, fechaVencimiento: Date) => Promise<void>;
  actualizarCantidad: (id: string, cantidad: number) => Promise<void>;
  eliminarItem: (id: string) => Promise<void>;
  obtenerItemConVariante: (
    id: string
  ) => Promise<{ item: ItemVencimiento; variante: ProductoVariante } | null>;
  recalcularAlertas: () => Promise<void>;
}

export const useVencimientoStore = create<VencimientoStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  cargarItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await db.itemsVencimiento
        .orderBy("fechaVencimiento")
        .toArray();
      set({ items, loading: false });
    } catch (error) {
      set({ error: "Error al cargar items de vencimiento", loading: false });
    }
  },

  agregarItem: async (
    varianteId: string,
    fechaVencimiento: Date,
    cantidad?: number,
    lote?: string
  ) => {
    try {
      const alertaNivel = calcularNivelAlerta(fechaVencimiento);

      const nuevoItem: ItemVencimiento = {
        id: generarUUID(),
        varianteId,
        fechaVencimiento,
        cantidad,
        lote,
        agregadoAt: new Date(),
        alertaNivel,
      };

      await db.itemsVencimiento.add(nuevoItem);
      await get().cargarItems();
    } catch (error) {
      set({ error: "Error al agregar item de vencimiento" });
    }
  },

  actualizarFecha: async (id: string, fechaVencimiento: Date) => {
    try {
      const alertaNivel = calcularNivelAlerta(fechaVencimiento);
      await db.itemsVencimiento.update(id, {
        fechaVencimiento,
        alertaNivel,
      });
      await get().cargarItems();
    } catch (error) {
      set({ error: "Error al actualizar fecha de vencimiento" });
    }
  },

  actualizarCantidad: async (id: string, cantidad: number) => {
    try {
      await db.itemsVencimiento.update(id, { cantidad });
      await get().cargarItems();
    } catch (error) {
      set({ error: "Error al actualizar cantidad" });
    }
  },

  eliminarItem: async (id: string) => {
    try {
      await db.itemsVencimiento.delete(id);
      await get().cargarItems();
    } catch (error) {
      set({ error: "Error al eliminar item" });
    }
  },

  obtenerItemConVariante: async (id: string) => {
    try {
      const item = await db.itemsVencimiento.get(id);
      if (!item) return null;

      const variante = await db.productosVariantes.get(item.varianteId);
      if (!variante) return null;

      return { item, variante };
    } catch (error) {
      return null;
    }
  },

  recalcularAlertas: async () => {
    try {
      const items = await db.itemsVencimiento.toArray();

      for (const item of items) {
        const nuevoNivel = calcularNivelAlerta(item.fechaVencimiento);
        if (nuevoNivel !== item.alertaNivel) {
          await db.itemsVencimiento.update(item.id, {
            alertaNivel: nuevoNivel,
          });
        }
      }

      await get().cargarItems();
    } catch (error) {
      set({ error: "Error al recalcular alertas" });
    }
  },
}));
