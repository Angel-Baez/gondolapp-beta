// Tipos para la respuesta de Open Food Facts API
export interface OFFProduct {
  product?: {
    product_name?: string;
    product_name_es?: string;
    product_name_xx?: string;
    brands?: string;
    categories?: string;
    categories_tags?: string[];
    image_url?: string;
    image_front_url?: string;
    image_small_url?: string;
    quantity?: string;
    serving_size?: string;
    nutriscore_grade?: string;
    ecoscore_grade?: string;
    generic_name?: string;
    generic_name_es?: string;
  };
  status: number;
  status_verbose?: string;
}

export interface ProductoInfo {
  nombre: string;
  marca?: string;
  categoria?: string;
  imagen?: string;
  tamano?: string;
}

/**
 * Busca un producto por código de barras en Open Food Facts API
 * Ahora devuelve los datos crudos para que el normalizador los procese
 */
export async function buscarProductoPorEAN(
  ean: string
): Promise<OFFProduct | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${ean}.json`,
      {
        headers: {
          "User-Agent": "GondolApp/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error("Error en respuesta de API:", response.status);
      return null;
    }

    const data: OFFProduct = await response.json();

    if (data.status !== 1 || !data.product) {
      console.warn("Producto no encontrado en OFF:", ean);
      return null;
    }

    console.log("📦 Datos crudos de OFF:", data);
    return data;
  } catch (error) {
    console.error("Error al buscar producto en Open Food Facts:", error);
    return null;
  }
}

/**
 * Busca productos por nombre (búsqueda manual)
 */
export async function buscarProductosPorNombre(
  nombre: string,
  limite: number = 10
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        nombre
      )}&page_size=${limite}&json=true`,
      {
        headers: {
          "User-Agent": "GondolApp/1.0",
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error("Error al buscar productos por nombre:", error);
    return [];
  }
}
