/**
 * Servicio de SANITIZACIÓN de datos (NO normalización)
 * Solo limpia y valida tipos, NO decide nombres de productos
 * La normalización es responsabilidad de normalizadorIA.ts
 */

export interface DatosNormalizados {
  marca: string;
  nombreBase: string;
  nombreVariante: string;
  categoria?: string;
  imagen?: string;
  variante: {
    volumen?: number;
    unidad?: string;
    tipo?: string;
    sabor?: string;
  };
  raw: any; // Datos crudos para debugging
}

/**
 * SANITIZA datos ya normalizados por IA o fallback
 * NO toma decisiones de nombres, solo limpia tipos y formatos
 */
export function sanitizarDatos(datos: DatosNormalizados): DatosNormalizados {
  return {
    // Limpiar strings
    marca: limpiarTexto(datos.marca),
    nombreBase: limpiarTexto(datos.nombreBase),
    nombreVariante: limpiarTexto(datos.nombreVariante),
    categoria: datos.categoria ? limpiarTexto(datos.categoria) : undefined,

    // Validar imagen URL
    imagen: validarURL(datos.imagen),

    // Sanitizar variante
    variante: {
      volumen:
        typeof datos.variante.volumen === "number"
          ? Math.abs(datos.variante.volumen)
          : parseFloat(String(datos.variante.volumen || 0)) || undefined,

      unidad: datos.variante.unidad
        ? datos.variante.unidad.toUpperCase().trim()
        : undefined,

      tipo: datos.variante.tipo ? limpiarTexto(datos.variante.tipo) : undefined,

      sabor: datos.variante.sabor
        ? limpiarTexto(datos.variante.sabor)
        : undefined,
    },

    raw: datos.raw,
  };
}

/**
 * Limpia texto: remueve espacios dobles, trim, capitaliza
 */
function limpiarTexto(texto: string): string {
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
        return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
      })
      .join(" ")
  );
}

/**
 * Valida que sea una URL válida
 */
function validarURL(url?: string): string | undefined {
  if (!url) return undefined;

  try {
    new URL(url);
    return url;
  } catch {
    return undefined;
  }
}

/**
 * FALLBACK MANUAL: Normalización básica desde datos crudos de OFF
 * Solo se usa si la IA falla completamente
 */
export function normalizarManualmente(datosOFF: any): DatosNormalizados {
  const product = datosOFF.product || datosOFF;

  // Extraer marca (primera palabra o brands)
  const marca =
    product.brands?.split(",")[0]?.trim() ||
    product.product_name?.split(" ")[0] ||
    "Genérico";

  // Nombre base simple (generic_name o primera parte del nombre)
  const nombreBase =
    product.generic_name?.split(" ").slice(0, 2).join(" ") ||
    product.product_name?.split(" ").slice(0, 2).join(" ") ||
    "Producto";

  // Nombre variante = nombre completo
  const nombreVariante =
    product.product_name || product.generic_name || "Sin nombre";

  // Intentar extraer volumen básico
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
 * Genera ID único para producto base
 */
export function generarIdBase(marca: string, nombreBase: string): string {
  return `${marca}-${nombreBase}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}
