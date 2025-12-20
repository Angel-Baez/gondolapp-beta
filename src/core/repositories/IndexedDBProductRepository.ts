/**
 * Single Responsibility Principle (SRP) - Repositorio enfocado solo en persistencia
 * Dependency Inversion Principle (DIP) - Implementa interfaces abstractas
 * 
 * Repositorio de productos usando IndexedDB (Dexie)
 */

import { _internalDb as db } from "@/lib/db";
import { ProductoBase, ProductoVariante } from "@/types";
import { IProductRepository } from "../interfaces/IProductRepository";

export class IndexedDBProductRepository implements IProductRepository {
  async initialize(): Promise<void> {
    // IndexedDB se inicializa automáticamente con Dexie
    await db.open();
  }

  // ==================== Operaciones de Lectura ====================

  async findByBarcode(barcode: string): Promise<ProductoVariante | null> {
    try {
      const variante = await db.productosVariantes
        .where("codigoBarras")
        .equals(barcode)
        .first();
      return variante || null;
    } catch (error) {
      console.error("Error al buscar por código de barras:", error);
      return null;
    }
  }

  async findById(id: string): Promise<ProductoVariante | null> {
    try {
      const variante = await db.productosVariantes.get(id);
      return variante || null;
    } catch (error) {
      console.error("Error al buscar variante por ID:", error);
      return null;
    }
  }

  async findBaseById(id: string): Promise<ProductoBase | null> {
    try {
      const base = await db.productosBase.get(id);
      return base || null;
    } catch (error) {
      console.error("Error al buscar producto base por ID:", error);
      return null;
    }
  }

  async findVariantsByBaseId(baseId: string): Promise<ProductoVariante[]> {
    try {
      return await db.productosVariantes
        .where("productoBaseId")
        .equals(baseId)
        .toArray();
    } catch (error) {
      console.error("Error al obtener variantes:", error);
      return [];
    }
  }

  async searchBase(term: string): Promise<ProductoBase[]> {
    try {
      const productos = await db.productosBase
        .filter((p) => {
          const nombre = p.nombre.toLowerCase();
          const marca = p.marca?.toLowerCase() || "";
          const busqueda = term.toLowerCase();
          return nombre.includes(busqueda) || marca.includes(busqueda);
        })
        .toArray();

      return productos;
    } catch (error) {
      console.error("Error al buscar productos:", error);
      return [];
    }
  }

  // ==================== Operaciones de Escritura ====================

  async saveBase(product: ProductoBase): Promise<ProductoBase> {
    try {
      await db.productosBase.put(product);
      const saved = await db.productosBase.get(product.id);
      if (!saved) {
        throw new Error("No se pudo guardar el producto base");
      }
      return saved;
    } catch (error) {
      console.error("Error al guardar producto base:", error);
      throw error;
    }
  }

  async saveVariant(variant: ProductoVariante): Promise<ProductoVariante> {
    try {
      await db.productosVariantes.put(variant);
      const saved = await db.productosVariantes.get(variant.id);
      if (!saved) {
        throw new Error("No se pudo guardar la variante");
      }
      return saved;
    } catch (error) {
      console.error("Error al guardar variante:", error);
      throw error;
    }
  }

  async updateBase(id: string, data: Partial<ProductoBase>): Promise<void> {
    try {
      await db.productosBase.update(id, {
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error al actualizar producto base:", error);
      throw error;
    }
  }

  async deleteVariant(id: string): Promise<void> {
    try {
      await db.productosVariantes.delete(id);
    } catch (error) {
      console.error("Error al eliminar variante:", error);
      throw error;
    }
  }

  async deleteBase(id: string): Promise<void> {
    try {
      await db.productosBase.delete(id);
    } catch (error) {
      console.error("Error al eliminar producto base:", error);
      throw error;
    }
  }
}
