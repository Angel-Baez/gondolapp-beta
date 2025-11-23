/**
 * Single Responsibility Principle (SRP) - Solo reasignación de variantes
 * Dependency Inversion Principle (DIP) - Depende de interfaces
 */

import { Db, ObjectId } from "mongodb";
import {
  IVariantReassigner,
  ReassignResult,
  BulkReassignResult,
} from "../interfaces/IVariantReassigner";
import { ProductoVarianteMongo } from "@/types";
import { AdminValidator } from "../validators/AdminValidator";
import { IndexedDBProductRepository } from "@/core/repositories/IndexedDBProductRepository";

/**
 * Servicio para reasignar variantes entre productos base
 */
export class VariantReassignerService implements IVariantReassigner {
  constructor(
    private db: Db,
    private localRepo: IndexedDBProductRepository
  ) {}

  /**
   * Reasigna una variante a otro producto base
   */
  async reassignVariant(
    varianteId: string,
    nuevoProductoBaseId: string
  ): Promise<ReassignResult> {
    try {
      // Validar IDs
      const varianteValidation = AdminValidator.validateObjectId(varianteId);
      if (!varianteValidation.valid) {
        return {
          success: false,
          message: `ID de variante inválido: ${varianteValidation.errors.join(", ")}`,
        };
      }

      const baseValidation = AdminValidator.validateObjectId(nuevoProductoBaseId);
      if (!baseValidation.valid) {
        return {
          success: false,
          message: `ID de producto base inválido: ${baseValidation.errors.join(", ")}`,
        };
      }

      const variantesCollection = this.db.collection<ProductoVarianteMongo>(
        "productos_variantes"
      );
      const productosCollection = this.db.collection("productos_base");

      // Verificar que la variante existe
      const variante = await variantesCollection.findOne({
        _id: new ObjectId(varianteId) as any,
      });

      if (!variante) {
        return {
          success: false,
          message: "Variante no encontrada",
        };
      }

      // Verificar que el nuevo producto base existe
      const nuevoProductoBase = await productosCollection.findOne({
        _id: new ObjectId(nuevoProductoBaseId) as any,
      });

      if (!nuevoProductoBase) {
        return {
          success: false,
          message: "Producto base destino no encontrado",
        };
      }

      // Reasignar en MongoDB
      const result = await variantesCollection.updateOne(
        { _id: new ObjectId(varianteId) as any },
        { $set: { productoBaseId: nuevoProductoBaseId } }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          message: "No se pudo actualizar la variante",
        };
      }

      // Sincronizar con IndexedDB si existe localmente
      try {
        const localVariante = await this.localRepo.findById(varianteId);
        if (localVariante) {
          await this.localRepo.saveVariant({
            ...localVariante,
            productoBaseId: nuevoProductoBaseId,
          });
        }
      } catch (error) {
        console.warn("⚠️ No se pudo sincronizar reasignación con IndexedDB:", error);
      }

      return {
        success: true,
        message: "Variante reasignada correctamente",
      };
    } catch (error) {
      console.error("❌ Error al reasignar variante:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  /**
   * Reasigna múltiples variantes a un producto base
   */
  async bulkReassign(
    varianteIds: string[],
    nuevoProductoBaseId: string
  ): Promise<BulkReassignResult> {
    const errors: string[] = [];
    let successCount = 0;

    for (const varianteId of varianteIds) {
      const result = await this.reassignVariant(varianteId, nuevoProductoBaseId);

      if (result.success) {
        successCount++;
      } else {
        errors.push(`${varianteId}: ${result.message}`);
      }
    }

    return {
      success: successCount,
      errors,
    };
  }
}
