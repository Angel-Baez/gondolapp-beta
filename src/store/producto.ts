import { db } from "@/lib/db";
import { generarUUID } from "@/lib/utils";
import { ProductoBase, ProductoVariante } from "@/types";
import { create } from "zustand";

interface ProductoStore {
  productosBase: ProductoBase[];
  variantes: ProductoVariante[];
  loading: boolean;
  error: string | null;

  // Acciones
  cargarProductos: () => Promise<void>;
  buscarPorCodigoBarras: (
    codigoBarras: string
  ) => Promise<ProductoVariante | null>;
  agregarProducto: (
    producto: Omit<ProductoBase, "id" | "createdAt" | "updatedAt">,
    variante: Omit<ProductoVariante, "id" | "productoBaseId" | "createdAt">
  ) => Promise<ProductoVariante>;
  obtenerVariantesDeBase: (
    productoBaseId: string
  ) => Promise<ProductoVariante[]>;
}

export const useProductoStore = create<ProductoStore>((set, get) => ({
  productosBase: [],
  variantes: [],
  loading: false,
  error: null,

  cargarProductos: async () => {
    set({ loading: true, error: null });
    try {
      const productosBase = await db.productosBase.toArray();
      const variantes = await db.productosVariantes.toArray();
      set({ productosBase, variantes, loading: false });
    } catch (error) {
      set({ error: "Error al cargar productos", loading: false });
    }
  },

  buscarPorCodigoBarras: async (codigoBarras: string) => {
    try {
      const variante = await db.productosVariantes
        .where("codigoBarras")
        .equals(codigoBarras)
        .first();
      return variante || null;
    } catch (error) {
      set({ error: "Error al buscar por código de barras" });
      return null;
    }
  },

  agregarProducto: async (producto, varianteData) => {
    try {
      // Buscar si ya existe un producto base con el mismo nombre
      let productoBase = await db.productosBase
        .where("nombre")
        .equalsIgnoreCase(producto.nombre)
        .first();

      if (!productoBase) {
        // Crear nuevo producto base
        const nuevoProductoBase: ProductoBase = {
          ...producto,
          id: generarUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.productosBase.add(nuevoProductoBase);
        productoBase = nuevoProductoBase;
      }

      // Crear variante
      const nuevaVariante: ProductoVariante = {
        ...varianteData,
        id: generarUUID(),
        productoBaseId: productoBase.id,
        createdAt: new Date(),
      };
      await db.productosVariantes.add(nuevaVariante);

      await get().cargarProductos();
      return nuevaVariante;
    } catch (error) {
      set({ error: "Error al agregar producto" });
      throw error;
    }
  },

  obtenerVariantesDeBase: async (productoBaseId: string) => {
    try {
      const variantes = await db.productosVariantes
        .where("productoBaseId")
        .equals(productoBaseId)
        .toArray();
      return variantes;
    } catch (error) {
      return [];
    }
  },
}));
