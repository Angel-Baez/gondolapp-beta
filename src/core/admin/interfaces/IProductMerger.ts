/**
 * Single Responsibility Principle (SRP) - Solo fusión de productos duplicados
 */

import { ProductoBase } from "@/types";

/**
 * Resultado de operación de fusión
 */
export interface MergeResult {
  success: boolean;
  variantesReasignadas: number;
  productosEliminados: number;
  errors?: string[];
}

/**
 * Preview de fusión de productos
 */
export interface MergePreview {
  targetProduct: ProductoBase;
  sourceProducts: ProductoBase[];
  totalVariantes: number;
  conflicts: string[];
}

/**
 * Interface para fusionar productos duplicados
 */
export interface IProductMerger {
  /**
   * Fusiona varios productos base en uno
   * Mueve todas las variantes de los productos origen al producto destino
   * @param targetId ID del producto destino
   * @param sourceIds IDs de los productos origen a fusionar
   */
  mergeProducts(
    targetId: string,
    sourceIds: string[]
  ): Promise<MergeResult>;

  /**
   * Previsualiza el resultado de fusionar productos
   * @param targetId ID del producto destino
   * @param sourceIds IDs de los productos origen
   */
  previewMerge(
    targetId: string,
    sourceIds: string[]
  ): Promise<MergePreview>;
}
