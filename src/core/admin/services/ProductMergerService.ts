/**
 * Single Responsibility Principle (SRP) - Solo fusión de productos duplicados
 * Dependency Inversion Principle (DIP) - Depende de interfaces
 */

import { Db, ObjectId } from "mongodb";
import {
  IProductMerger,
  MergeResult,
  MergePreview,
} from "../interfaces/IProductMerger";
import { ProductoBase, ProductoBaseMongo, ProductoVarianteMongo } from "@/types";
import { AdminValidator } from "../validators/AdminValidator";
import { VariantReassignerService } from "./VariantReassignerService";
import { IndexedDBProductRepository } from "@/core/repositories/IndexedDBProductRepository";

/**
 * Servicio para fusionar productos duplicados
 */
export class ProductMergerService implements IProductMerger {
  private reassigner: VariantReassignerService;

  constructor(
    private db: Db,
    private localRepo: IndexedDBProductRepository
  ) {
    this.reassigner = new VariantReassignerService(db, localRepo);
  }

  /**
   * Previsualiza el resultado de fusionar productos
   */
  async previewMerge(
    targetId: string,
    sourceIds: string[]
  ): Promise<MergePreview> {
    // Validar parámetros
    const validation = AdminValidator.validateMerge(targetId, sourceIds);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    const productosCollection = this.db.collection<ProductoBaseMongo>("productos_base");
    const variantesCollection = this.db.collection<ProductoVarianteMongo>("productos_variantes");

    // Obtener producto destino
    const targetProduct = await productosCollection.findOne({
      _id: new ObjectId(targetId) as any,
    });

    if (!targetProduct) {
      throw new Error("Producto destino no encontrado");
    }

    // Obtener productos origen
    const sourceProducts: ProductoBase[] = [];
    for (const sourceId of sourceIds) {
      const product = await productosCollection.findOne({
        _id: new ObjectId(sourceId) as any,
      });
      if (product) {
        sourceProducts.push({
          id: product._id?.toString() || "",
          nombre: product.nombre,
          marca: product.marca,
          categoria: product.categoria,
          imagen: product.imagen,
          createdAt: product.createdAt,
          updatedAt: new Date(), // MongoDB no tiene updatedAt, usar fecha actual
        });
      }
    }

    // Contar variantes totales
    const allIds = [targetId, ...sourceIds];
    const totalVariantes = await variantesCollection.countDocuments({
      productoBaseId: { $in: allIds },
    });

    // Detectar conflictos (EANs duplicados)
    const conflicts: string[] = [];
    const variantes = await variantesCollection
      .find({ productoBaseId: { $in: allIds } })
      .toArray();

    const eanMap = new Map<string, number>();
    variantes.forEach((v) => {
      const count = eanMap.get(v.ean) || 0;
      eanMap.set(v.ean, count + 1);
    });

    eanMap.forEach((count, ean) => {
      if (count > 1) {
        conflicts.push(`EAN duplicado encontrado: ${ean} (${count} veces)`);
      }
    });

    return {
      targetProduct: {
        id: targetProduct._id?.toString() || "",
        nombre: targetProduct.nombre,
        marca: targetProduct.marca,
        categoria: targetProduct.categoria,
        imagen: targetProduct.imagen,
        createdAt: targetProduct.createdAt,
        updatedAt: new Date(), // MongoDB no tiene updatedAt, usar fecha actual
      },
      sourceProducts,
      totalVariantes,
      conflicts,
    };
  }

  /**
   * Fusiona varios productos base en uno
   */
  async mergeProducts(
    targetId: string,
    sourceIds: string[]
  ): Promise<MergeResult> {
    try {
      // Validar parámetros
      const validation = AdminValidator.validateMerge(targetId, sourceIds);
      if (!validation.valid) {
        return {
          success: false,
          variantesReasignadas: 0,
          productosEliminados: 0,
          errors: validation.errors,
        };
      }

      // Previsualizar para detectar conflictos
      const preview = await this.previewMerge(targetId, sourceIds);

      if (preview.conflicts.length > 0) {
        return {
          success: false,
          variantesReasignadas: 0,
          productosEliminados: 0,
          errors: [
            "No se puede fusionar debido a conflictos:",
            ...preview.conflicts,
          ],
        };
      }

      const variantesCollection = this.db.collection<ProductoVarianteMongo>("productos_variantes");
      const productosCollection = this.db.collection<ProductoBaseMongo>("productos_base");

      const errors: string[] = [];
      let variantesReasignadas = 0;

      // Reasignar todas las variantes de los productos origen al destino
      for (const sourceId of sourceIds) {
        const variantes = await variantesCollection
          .find({ productoBaseId: sourceId })
          .toArray();

        for (const variante of variantes) {
          const result = await this.reassigner.reassignVariant(
            variante._id?.toString() || "",
            targetId
          );

          if (result.success) {
            variantesReasignadas++;
          } else {
            errors.push(`Error al reasignar variante ${variante.ean}: ${result.message}`);
          }
        }
      }

      // Eliminar productos origen que ya no tienen variantes
      let productosEliminados = 0;
      for (const sourceId of sourceIds) {
        const countVariantes = await variantesCollection.countDocuments({
          productoBaseId: sourceId,
        });

        if (countVariantes === 0) {
          const deleteResult = await productosCollection.deleteOne({
            _id: new ObjectId(sourceId) as any,
          });

          if (deleteResult.deletedCount > 0) {
            productosEliminados++;

            // Intentar eliminar de IndexedDB también
            try {
              const base = await this.localRepo.findBaseById(sourceId);
              if (base) {
                // Verificar que no tenga variantes en local
                const localVariantes = await this.localRepo.findVariantsByBaseId(sourceId);
                if (localVariantes.length === 0) {
                  await this.localRepo.deleteBase(sourceId);
                }
              }
            } catch (error) {
              console.warn("⚠️ No se pudo eliminar producto de IndexedDB:", error);
            }
          }
        } else {
          errors.push(
            `No se pudo eliminar producto ${sourceId}: aún tiene ${countVariantes} variante(s)`
          );
        }
      }

      return {
        success: errors.length === 0,
        variantesReasignadas,
        productosEliminados,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error("❌ Error al fusionar productos:", error);
      return {
        success: false,
        variantesReasignadas: 0,
        productosEliminados: 0,
        errors: [error instanceof Error ? error.message : "Error desconocido"],
      };
    }
  }
}
