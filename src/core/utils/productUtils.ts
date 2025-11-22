/**
 * Product utility functions
 * SOLID: Single Responsibility Principle - Only product-related utilities
 */
import { DatosNormalizados } from '../types';

/**
 * Generates unique ID for product base
 */
export function generarIdBase(marca: string, nombreBase: string): string {
  return `${marca}-${nombreBase}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

/**
 * FALLBACK MANUAL: Basic normalization from raw data
 * Only used if AI fails completely
 */
export function normalizarManualmente(datosOFF: any): DatosNormalizados {
  const product = datosOFF.product || datosOFF;

  // Extract brand (first word or brands)
  const marca =
    product.brands?.split(",")[0]?.trim() ||
    product.product_name?.split(" ")[0] ||
    "Genérico";

  // Simple base name (generic_name or first part of name)
  const nombreBase =
    product.generic_name?.split(" ").slice(0, 2).join(" ") ||
    product.product_name?.split(" ").slice(0, 2).join(" ") ||
    "Producto";

  // Variant name = full name
  const nombreVariante =
    product.product_name || product.generic_name || "Sin nombre";

  // Try to extract basic volume
  const volumenMatch = nombreVariante.match(
    /(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg|oz)/i
  );
  const volumen = volumenMatch
    ? parseFloat(volumenMatch[1].replace(",", "."))
    : undefined;
  const unidad = volumenMatch ? volumenMatch[2].toUpperCase() : undefined;

  return {
    marca,
    nombreBase,
    nombreVariante,
    categoria: product.categories?.split(",")[0] || "Sin categoría",
    imagen: product.image_front_url || product.image_url,
    variante: {
      volumen,
      unidad,
    },
    raw: datosOFF,
  };
}

/**
 * Clean text: remove double spaces, trim, capitalize
 */
export function limpiarTexto(texto: string): string {
  if (!texto) return "";

  return (
    texto
      .trim()
      .replace(/\s+/g, " ") // Double spaces → single
      .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ.\-]/g, "") // Remove weird characters
      // Capitalize first letter of each word
      .split(" ")
      .map((palabra) => {
        if (palabra.length <= 2) return palabra.toLowerCase(); // "de", "la"
        return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
      })
      .join(" ")
  );
}

/**
 * Validate URL
 */
export function validarURL(url?: string): string | undefined {
  if (!url) return undefined;

  try {
    new URL(url);
    return url;
  } catch {
    return undefined;
  }
}
