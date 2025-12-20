import { ProductoBase, ProductoVariante } from "@/types";
import { ProductService } from "@/core/services/ProductService";
import {
  getProductRepository,
  getDataSourceManager,
  getNormalizerChain,
} from "@/core/container/serviceConfig";
import { deprecationWarning } from "@/lib/deprecation-warnings";

export interface ProductoCompleto {
  base: ProductoBase;
  variante: ProductoVariante;
}

/**
 * Obtiene instancia de ProductService desde el contenedor IoC
 * ✅ Usa el contenedor para gestión del ciclo de vida
 */
function getProductService(): ProductService {
  return new ProductService(
    getProductRepository(),
    getDataSourceManager(),
    getNormalizerChain()
  );
}

/**
 * FLUJO PRINCIPAL: Escaneo → Cache Local (IndexedDB) → MongoDB → Manual
 * 
 * ✅ REFACTORIZADO CON PRINCIPIOS SOLID:
 * - Usa ProductService (Facade Pattern)
 * - Delega a DataSourceManager (Strategy Pattern)
 * - Inversión de dependencias (DIP)
 * 
 * @deprecated Usar useProductService().scanProduct() en su lugar
 * Esta función será eliminada en v2.0
 * 
 * Ya NO consulta Open Food Facts ni IA directamente
 * Mantiene compatibilidad con código existente
 */
export async function obtenerOCrearProducto(
  ean: string
): Promise<ProductoCompleto | null> {
  deprecationWarning(
    "obtenerOCrearProducto",
    "useProductService().scanProduct()",
    "v2.0"
  );

  try {
    const service = getProductService();
    return await service.getOrCreateProduct(ean);
  } catch (error) {
    console.error("❌ Error en obtenerOCrearProducto:", error);
    return null;
  }
}

/**
 * Obtiene un producto completo por ID de variante
 * 
 * @deprecated Usar useProductService().getProductById() en su lugar
 * Esta función será eliminada en v2.0
 * 
 * ✅ REFACTORIZADO CON PRINCIPIOS SOLID
 */
export async function obtenerProductoCompleto(
  varianteId: string
): Promise<ProductoCompleto | null> {
  deprecationWarning(
    "obtenerProductoCompleto",
    "useProductService().getProductById()",
    "v2.0"
  );

  try {
    const service = getProductService();
    return await service.getProductById(varianteId);
  } catch (error) {
    console.error("Error al obtener producto completo:", error);
    return null;
  }
}

/**
 * Busca productos base por nombre
 * 
 * @deprecated Usar useProductService().searchProducts() en su lugar
 * Esta función será eliminada en v2.0
 * 
 * ✅ REFACTORIZADO CON PRINCIPIOS SOLID
 */
export async function buscarProductosBase(
  termino: string
): Promise<ProductoBase[]> {
  deprecationWarning(
    "buscarProductosBase",
    "useProductService().searchProducts()",
    "v2.0"
  );

  try {
    const service = getProductService();
    return await service.searchProducts(termino);
  } catch (error) {
    console.error("Error al buscar productos:", error);
    return [];
  }
}

/**
 * Obtiene todas las variantes de un producto base
 * 
 * @deprecated Usar useProductService().getVariants() en su lugar
 * Esta función será eliminada en v2.0
 * 
 * ✅ REFACTORIZADO CON PRINCIPIOS SOLID
 */
export async function obtenerVariantesDeBase(
  productoBaseId: string
): Promise<ProductoVariante[]> {
  deprecationWarning(
    "obtenerVariantesDeBase",
    "useProductService().getVariants()",
    "v2.0"
  );

  try {
    const service = getProductService();
    return await service.getVariants(productoBaseId);
  } catch (error) {
    console.error("Error al obtener variantes:", error);
    return [];
  }
}

/**
 * Crea un producto nuevo sin datos de Open Food Facts
 * (usado cuando el código no existe en la API externa)
 * 
 * @deprecated Usar useProductService().createManualProduct() en su lugar
 * Esta función será eliminada en v2.0
 * 
 * ✅ REFACTORIZADO CON PRINCIPIOS SOLID
 */
export async function crearProductoManual(
  ean: string,
  datosProducto: {
    nombreBase: string;
    marca?: string;
    nombreVariante?: string;
    tipo?: string;
    tamano?: string;
    sabor?: string;
  }
): Promise<ProductoCompleto> {
  deprecationWarning(
    "crearProductoManual",
    "useProductService().createManualProduct()",
    "v2.0"
  );

  try {
    const service = getProductService();
    return await service.createManualProduct(ean, datosProducto);
  } catch (error) {
    console.error("Error al crear producto manual:", error);
    throw error;
  }
}
