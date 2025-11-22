import { db } from "@/lib/db";

/**
 * Servicio centralizado para sincronización con IndexedDB
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de la sincronización con IndexedDB
 * - OCP: Extensible para nuevos tipos de sincronización
 * - DIP: Abstrae las operaciones de IndexedDB
 */
export class ProductSyncService {
  /**
   * Sincroniza un producto (base + variante) con IndexedDB
   * 
   * @param producto - Producto completo con base y variante
   * @returns Promise<void>
   */
  static async syncProductToIndexedDB(producto: any): Promise<void> {
    try {
      // Verificar existencia de ambos registros en paralelo
      const [baseExistente, varianteExistente] = await Promise.all([
        db.productosBase.get(producto.base.id),
        db.productosVariantes.get(producto.variante.id),
      ]);

      // Preparar operaciones de inserción
      const insertOperations: Promise<any>[] = [];

      // Sincronizar ProductoBase con IndexedDB si no existe
      if (!baseExistente) {
        insertOperations.push(
          db.productosBase.add({
            id: producto.base.id,
            nombre: producto.base.nombre,
            marca: producto.base.marca,
            categoria: producto.base.categoria,
            imagen: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
        console.log("✅ ProductoBase preparado para sincronizar");
      }

      // Sincronizar ProductoVariante con IndexedDB si no existe
      if (!varianteExistente) {
        insertOperations.push(
          db.productosVariantes.add({
            id: producto.variante.id,
            productoBaseId: producto.base.id,
            codigoBarras: producto.variante.ean,
            nombreCompleto: producto.variante.nombreCompleto,
            tipo: producto.variante.tipo,
            tamano: producto.variante.tamano,
            sabor: undefined,
            unidadMedida: undefined,
            imagen: undefined,
            createdAt: new Date(),
          })
        );
        console.log("✅ ProductoVariante preparado para sincronizar");
      }

      // Ejecutar todas las inserciones en paralelo
      if (insertOperations.length > 0) {
        await Promise.all(insertOperations);
        console.log("✅ Sincronización con IndexedDB completada");
      }
    } catch (error) {
      console.error("❌ Error en sincronización con IndexedDB:", error);
      throw error;
    }
  }

  /**
   * Verifica si un producto existe en IndexedDB por EAN
   * 
   * @param ean - Código de barras
   * @returns Promise<boolean>
   */
  static async productExists(ean: string): Promise<boolean> {
    try {
      const variante = await db.productosVariantes
        .where("codigoBarras")
        .equals(ean)
        .first();
      return !!variante;
    } catch (error) {
      console.error("❌ Error verificando existencia de producto:", error);
      return false;
    }
  }

  /**
   * Obtiene un producto completo por ID de variante
   * 
   * @param varianteId - ID de la variante
   * @returns Promise<{base, variante} | null>
   */
  static async getProductById(varianteId: string) {
    try {
      const variante = await db.productosVariantes.get(varianteId);
      if (!variante) return null;

      const base = await db.productosBase.get(variante.productoBaseId);
      if (!base) return null;

      return { base, variante };
    } catch (error) {
      console.error("❌ Error obteniendo producto:", error);
      return null;
    }
  }
}
