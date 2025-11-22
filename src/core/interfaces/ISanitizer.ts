/**
 * Single Responsibility Principle - Sanitización separada de normalización
 */

import { DatosNormalizados } from "@/services/normalizador";

/**
 * Interface para sanitizadores de datos
 */
export interface ISanitizer {
  /**
   * Sanitiza datos normalizados
   */
  sanitize(data: DatosNormalizados): DatosNormalizados;
}

/**
 * Interface para validadores específicos
 */
export interface IValidator<T> {
  validate(value: T): boolean;
  sanitize(value: T): T;
}
