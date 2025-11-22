import { ProductoBase, ProductoVariante } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { generarIdBase } from "./normalizador";
import { ProductService } from "@/core/services/ProductService";

export interface ProductoCompleto {
  base: ProductoBase;
  variante: ProductoVariante;
}

// Instancia singleton del servicio SOLID
let productServiceInstance: ProductService | null = null;

/**
 * Obtiene la instancia del servicio de productos
 * Patrón Singleton para mantener compatibilidad con código existente
 */
function getProductService(): ProductService {
  if (!productServiceInstance) {
    productServiceInstance = new ProductService();
  }
  return productServiceInstance;
}

/**
 * FLUJO PRINCIPAL: Escaneo → Cache Local (IndexedDB) → MongoDB → Manual
 * 
 * ✅ REFACTORIZADO CON PRINCIPIOS SOLID:
 * - Usa ProductService (Facade Pattern)
 * - Delega a DataSourceManager (Strategy Pattern)
 * - Inversión de dependencias (DIP)
 * 
 * Ya NO consulta Open Food Facts ni IA directamente
 * Mantiene compatibilidad con código existente
 */
export async function obtenerOCrearProducto(
  ean: string
): Promise<ProductoCompleto | null> {
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
 * ✅ REFACTORIZADO CON PRINCIPIOS SOLID
 */
export async function obtenerProductoCompleto(
  varianteId: string
): Promise<ProductoCompleto | null> {
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
 * ✅ REFACTORIZADO CON PRINCIPIOS SOLID
 */
export async function buscarProductosBase(
  termino: string
): Promise<ProductoBase[]> {
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
 * ✅ REFACTORIZADO CON PRINCIPIOS SOLID
 */
export async function obtenerVariantesDeBase(
  productoBaseId: string
): Promise<ProductoVariante[]> {
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
  try {
    const service = getProductService();
    return await service.createManualProduct(ean, datosProducto);
  } catch (error) {
    console.error("Error al crear producto manual:", error);
    throw error;
  }
}
