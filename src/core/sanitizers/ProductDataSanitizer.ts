/**
 * Single Responsibility Principle (SRP) - Solo sanitiza datos
 * Interface Segregation Principle (ISP) - Implementa ISanitizer específica
 * 
 * Sanitizador de datos de productos
 */

import { ISanitizer } from "../interfaces/ISanitizer";
import { DatosNormalizados } from "../types";

export class ProductDataSanitizer implements ISanitizer {
  sanitize(data: DatosNormalizados): DatosNormalizados {
    return {
      // Sanitizar strings
      marca: this.sanitizeText(data.marca),
      nombreBase: this.sanitizeText(data.nombreBase),
      nombreVariante: this.sanitizeText(data.nombreVariante),
      categoria: data.categoria ? this.sanitizeText(data.categoria) : undefined,

      // Validar imagen URL
      imagen: this.sanitizeURL(data.imagen),

      // Sanitizar variante
      variante: {
        volumen: this.sanitizeNumber(data.variante.volumen),
        unidad: this.sanitizeUnit(data.variante.unidad),
        tipo: data.variante.tipo
          ? this.sanitizeText(data.variante.tipo)
          : undefined,
        sabor: data.variante.sabor
          ? this.sanitizeText(data.variante.sabor)
          : undefined,
      },

      raw: data.raw,
    };
  }

  /**
   * Limpia texto: remueve espacios dobles, trim, capitaliza
   */
  private sanitizeText(texto: string): string {
    if (!texto) return "";

    return (
      texto
        .trim()
        .replace(/\s+/g, " ") // Espacios dobles → simple
        .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ.\-]/g, "") // Caracteres raros
        // Capitalizar primera letra de cada palabra
        .split(" ")
        .map((palabra) => {
          if (palabra.length <= 2) return palabra.toLowerCase(); // "de", "la"
          return (
            palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
          );
        })
        .join(" ")
    );
  }

  /**
   * Valida que sea una URL válida
   */
  private sanitizeURL(url?: string): string | undefined {
    if (!url) return undefined;

    try {
      new URL(url);
      return url;
    } catch {
      return undefined;
    }
  }

  /**
   * Sanitiza número (volumen)
   */
  private sanitizeNumber(value: any): number | undefined {
    if (value === null || value === undefined) return undefined;

    if (typeof value === "number") {
      return Math.abs(value);
    }

    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? undefined : Math.abs(parsed);
  }

  /**
   * Sanitiza unidad de medida (mayúsculas)
   */
  private sanitizeUnit(unit: any): string | undefined {
    if (!unit) return undefined;
    return String(unit).toUpperCase().trim();
  }
}
