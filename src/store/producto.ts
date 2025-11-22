/**
 * Zustand Store refactorizado con principios SOLID
 * 
 * Single Responsibility Principle:
 * - Store solo maneja estado UI
 * - Delega lógica de negocio a ProductService
 * 
 * Dependency Inversion Principle:
 * - Depende de ProductService (abstracción)
 */

import { ProductoBase, ProductoVariante } from "@/types";
import { create } from "zustand";
import { ProductService } from "@/core/services/ProductService";
import {
  getProductRepository,
  getDataSourceManager,
  getNormalizerChain,
} from "@/core/container/serviceConfig";

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

/**
 * Obtiene instancia de ProductService desde el contenedor
 */
function getProductService(): ProductService {
  return new ProductService(
    getProductRepository(),
    getDataSourceManager(),
    getNormalizerChain()
  );
}

export const useProductoStore = create<ProductoStore>((set, get) => ({
  productosBase: [],
  variantes: [],
  loading: false,
  error: null,

  cargarProductos: async () => {
    set({ loading: true, error: null });
    try {
      const service = getProductService();
      // Delegar al servicio SOLID
      const productos = await service.searchProducts("");
      set({ productosBase: productos, loading: false });
    } catch (error) {
      set({ error: "Error al cargar productos", loading: false });
    }
  },

  buscarPorCodigoBarras: async (codigoBarras: string) => {
    try {
      const service = getProductService();
      // Delegar al repositorio a través del servicio
      const producto = await service.getOrCreateProduct(codigoBarras);
      return producto?.variante || null;
    } catch (error) {
      set({ error: "Error al buscar por código de barras" });
      return null;
    }
  },

  agregarProducto: async (producto, varianteData) => {
    try {
      const service = getProductService();
      // Esta funcionalidad usa el servicio SOLID
      const productoCompleto = await service.createManualProduct(
        varianteData.codigoBarras,
        {
          nombreBase: producto.nombre,
          marca: producto.marca,
          nombreVariante: varianteData.nombreCompleto,
          tipo: varianteData.tipo,
          tamano: varianteData.tamano,
          sabor: varianteData.sabor,
        }
      );

      await get().cargarProductos();
      return productoCompleto.variante;
    } catch (error) {
      set({ error: "Error al agregar producto" });
      throw error;
    }
  },

  obtenerVariantesDeBase: async (productoBaseId: string) => {
    try {
      const service = getProductService();
      return await service.getVariants(productoBaseId);
    } catch (error) {
      return [];
    }
  },
}));
