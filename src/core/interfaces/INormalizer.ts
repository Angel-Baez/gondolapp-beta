/**
 * Open/Closed Principle (OCP) - Sistema extensible de normalizadores
 * Liskov Substitution Principle (LSP) - Todos los normalizadores son intercambiables
 */

import { DatosNormalizados } from "../types";

/**
 * Interface base para normalizadores de productos
 */
export interface INormalizer {
  /**
   * Normaliza datos crudos de producto
   * @param rawData Datos crudos del producto (API, manual, etc)
   * @returns Datos normalizados o null si falla
   */
  normalize(rawData: any): Promise<DatosNormalizados | null>;

  /**
   * Indica si este normalizador puede procesar estos datos
   */
  canHandle(rawData: any): boolean;

  /**
   * Prioridad del normalizador (mayor = más prioritario)
   */
  priority: number;
}

/**
 * Interface para cadena de normalizadores (Chain of Responsibility)
 */
export interface INormalizerChain {
  addNormalizer(normalizer: INormalizer): void;
  normalize(rawData: any): Promise<DatosNormalizados | null>;
}
