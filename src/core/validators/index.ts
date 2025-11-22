/**
 * Interface Segregation Principle (ISP) - Validadores específicos
 * Single Responsibility Principle (SRP) - Cada validador una responsabilidad
 * 
 * Validadores para diferentes tipos de datos
 */

import { IValidator } from "../interfaces/ISanitizer";

/**
 * Validador de código de barras EAN
 */
export class BarcodeValidator implements IValidator<string> {
  validate(value: string): boolean {
    // Verificar que sea numérico y tenga longitud válida (8, 12, 13, 14 dígitos)
    const cleanValue = value.trim();
    const validLengths = [8, 12, 13, 14];

    if (!validLengths.includes(cleanValue.length)) {
      return false;
    }

    return /^\d+$/.test(cleanValue);
  }

  sanitize(value: string): string {
    // Remover espacios y caracteres no numéricos
    return value.replace(/\D/g, "");
  }
}

/**
 * Validador de URLs
 */
export class URLValidator implements IValidator<string> {
  validate(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  sanitize(value: string): string {
    return value.trim();
  }
}

/**
 * Validador de nombres de productos
 */
export class ProductNameValidator implements IValidator<string> {
  private readonly MIN_LENGTH = 2;
  private readonly MAX_LENGTH = 200;

  validate(value: string): boolean {
    const trimmed = value.trim();
    return (
      trimmed.length >= this.MIN_LENGTH && trimmed.length <= this.MAX_LENGTH
    );
  }

  sanitize(value: string): string {
    return value
      .trim()
      .replace(/\s+/g, " ") // Espacios múltiples → uno solo
      .slice(0, this.MAX_LENGTH);
  }
}

/**
 * Validador de números positivos
 */
export class PositiveNumberValidator implements IValidator<number> {
  validate(value: number): boolean {
    return typeof value === "number" && value > 0 && !isNaN(value);
  }

  sanitize(value: number): number {
    return Math.abs(value);
  }
}

/**
 * Validador de unidades de medida
 */
export class UnitValidator implements IValidator<string> {
  private readonly VALID_UNITS = ["L", "ML", "G", "KG", "OZ", "LB"];

  validate(value: string): boolean {
    return this.VALID_UNITS.includes(value.toUpperCase());
  }

  sanitize(value: string): string {
    return value.toUpperCase().trim();
  }
}

/**
 * Validador de fechas
 */
export class DateValidator implements IValidator<Date> {
  validate(value: Date): boolean {
    return value instanceof Date && !isNaN(value.getTime());
  }

  sanitize(value: Date): Date {
    if (this.validate(value)) {
      return value;
    }
    return new Date();
  }
}
