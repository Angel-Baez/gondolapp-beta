import { dbService } from "@/lib/db";
import { ProductoCompleto } from "@/types";

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
   * @param producto - Producto completo con base y variante tipado
   * @returns Promise<void>
   */
  static async syncProductToIndexedDB(producto: ProductoCompleto): Promise<void> {
    try {
      // Verificar existencia de ambos registros en paralelo
      const [baseExistente, varianteExistente] = await Promise.all([
        dbService.getProductoBaseById(producto.base.id),
        dbService.getVarianteById(producto.variante.id),
      ]);

      // Preparar operaciones de inserción
      const insertOperations: Promise<unknown>[] = [];

      // Sincronizar ProductoBase con IndexedDB si no existe
      if (!baseExistente) {
        insertOperations.push(
          dbService.addProductoBase({
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
          dbService.addVariante({
            id: producto.variante.id,
            productoBaseId: producto.base.id,
            codigoBarras: producto.variante.codigoBarras,
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
      const variante = await dbService.getVarianteByBarcode(ean);
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
   * @returns Promise<ProductoCompleto | null>
   */
  static async getProductById(varianteId: string): Promise<ProductoCompleto | null> {
    try {
      const variante = await dbService.getVarianteById(varianteId);
      if (!variante) return null;

      const base = await dbService.getProductoBaseById(variante.productoBaseId);
      if (!base) return null;

      return { base, variante };
    } catch (error) {
      console.error("❌ Error obteniendo producto:", error);
      return null;
    }
  }
}
