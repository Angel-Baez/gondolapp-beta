/**
 * Strategy Pattern para fuentes de datos
 * Open/Closed Principle - Nuevas fuentes sin modificar código existente
 */

import { ProductoCompleto } from "@/types";

/**
 * Interface para fuentes de datos de productos
 */
export interface IDataSource {
  /**
   * Nombre identificador de la fuente
   */
  readonly name: string;

  /**
   * Busca un producto por código de barras
   */
  fetchProduct(barcode: string): Promise<ProductoCompleto | null>;

  /**
   * Indica si esta fuente está disponible
   */
  isAvailable(): Promise<boolean>;

  /**
   * Prioridad de la fuente (mayor = más prioritario)
   */
  priority: number;
}

/**
 * Interface para gestión de múltiples fuentes de datos
 */
export interface IDataSourceManager {
  registerSource(source: IDataSource): void;
  fetchProduct(barcode: string): Promise<ProductoCompleto | null>;
  getAvailableSources(): Promise<IDataSource[]>;
}
