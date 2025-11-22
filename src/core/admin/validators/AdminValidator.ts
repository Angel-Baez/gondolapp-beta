/**
 * Single Responsibility Principle (SRP) - Solo validaciones de integridad
 * Open/Closed Principle (OCP) - Extensible con nuevas validaciones
 */

import { ObjectId } from "mongodb";

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validador de operaciones administrativas
 * Asegura la integridad referencial de los datos
 */
export class AdminValidator {
  /**
   * Valida que un ObjectId sea válido
   */
  static validateObjectId(id: string): ValidationResult {
    const errors: string[] = [];

    if (!id) {
      errors.push("ID no puede estar vacío");
      return { valid: false, errors };
    }

    if (!ObjectId.isValid(id)) {
      errors.push("ID no es un ObjectId válido de MongoDB");
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Valida que un producto base tenga los datos mínimos
   */
  static validateProductoBase(data: {
    nombre?: string;
    marca?: string;
    categoria?: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (data.nombre !== undefined) {
      if (!data.nombre || data.nombre.trim().length === 0) {
        errors.push("El nombre del producto no puede estar vacío");
      }
      if (data.nombre && data.nombre.length > 200) {
        errors.push("El nombre del producto no puede tener más de 200 caracteres");
      }
    }

    if (data.marca !== undefined) {
      if (data.marca && data.marca.length > 100) {
        errors.push("La marca no puede tener más de 100 caracteres");
      }
    }

    if (data.categoria !== undefined) {
      if (data.categoria && data.categoria.length > 100) {
        errors.push("La categoría no puede tener más de 100 caracteres");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida que una variante tenga los datos mínimos
   */
  static validateVariante(data: {
    nombreCompleto?: string;
    ean?: string;
    tipo?: string;
    tamano?: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (data.nombreCompleto !== undefined) {
      if (!data.nombreCompleto || data.nombreCompleto.trim().length === 0) {
        errors.push("El nombre completo de la variante no puede estar vacío");
      }
      if (data.nombreCompleto && data.nombreCompleto.length > 300) {
        errors.push(
          "El nombre completo no puede tener más de 300 caracteres"
        );
      }
    }

    if (data.ean !== undefined) {
      if (!data.ean || data.ean.trim().length === 0) {
        errors.push("El código EAN no puede estar vacío");
      }
      // Validar formato EAN (puede ser EAN-8, EAN-13, UPC, etc.)
      if (data.ean && !/^\d{8,14}$/.test(data.ean)) {
        errors.push("El código EAN debe contener entre 8 y 14 dígitos");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida que se puedan fusionar productos
   */
  static validateMerge(
    targetId: string,
    sourceIds: string[]
  ): ValidationResult {
    const errors: string[] = [];

    // Validar target ID
    const targetValidation = this.validateObjectId(targetId);
    if (!targetValidation.valid) {
      errors.push(...targetValidation.errors.map((e) => `Target: ${e}`));
    }

    // Validar que haya al menos un source
    if (!sourceIds || sourceIds.length === 0) {
      errors.push("Debe haber al menos un producto origen para fusionar");
    }

    // Validar source IDs
    if (sourceIds) {
      sourceIds.forEach((id, index) => {
        const validation = this.validateObjectId(id);
        if (!validation.valid) {
          errors.push(
            ...validation.errors.map((e) => `Source ${index + 1}: ${e}`)
          );
        }
      });
    }

    // Validar que target no esté en sources
    if (sourceIds && sourceIds.includes(targetId)) {
      errors.push(
        "El producto destino no puede estar en la lista de productos origen"
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida parámetros de búsqueda
   */
  static validateSearchParams(params: {
    page?: number;
    limit?: number;
  }): ValidationResult {
    const errors: string[] = [];

    if (params.page !== undefined) {
      if (params.page < 1) {
        errors.push("La página debe ser mayor o igual a 1");
      }
      if (!Number.isInteger(params.page)) {
        errors.push("La página debe ser un número entero");
      }
    }

    if (params.limit !== undefined) {
      if (params.limit < 1) {
        errors.push("El límite debe ser mayor o igual a 1");
      }
      if (params.limit > 100) {
        errors.push("El límite no puede ser mayor a 100");
      }
      if (!Number.isInteger(params.limit)) {
        errors.push("El límite debe ser un número entero");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
