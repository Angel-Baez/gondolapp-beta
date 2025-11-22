/**
 * Single Responsibility Principle (SRP) - Solo reasignación de variantes
 */

/**
 * Resultado de operación de reasignación
 */
export interface ReassignResult {
  success: boolean;
  message: string;
}

/**
 * Resultado de reasignación masiva
 */
export interface BulkReassignResult {
  success: number;
  errors: string[];
}

/**
 * Interface para reasignar variantes entre productos base
 */
export interface IVariantReassigner {
  /**
   * Reasigna una variante a otro producto base
   * @param varianteId ID de la variante a reasignar
   * @param nuevoProductoBaseId ID del nuevo producto base
   */
  reassignVariant(
    varianteId: string,
    nuevoProductoBaseId: string
  ): Promise<ReassignResult>;

  /**
   * Reasigna múltiples variantes a un producto base
   * @param varianteIds IDs de las variantes a reasignar
   * @param nuevoProductoBaseId ID del nuevo producto base
   */
  bulkReassign(
    varianteIds: string[],
    nuevoProductoBaseId: string
  ): Promise<BulkReassignResult>;
}
