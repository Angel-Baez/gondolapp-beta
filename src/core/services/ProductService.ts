/**
 * Facade Pattern - API simplificada para la capa de aplicación
 * Single Responsibility Principle (SRP) - Coordina servicios pero no implementa lógica
 * Dependency Inversion Principle (DIP) - Depende de abstracciones
 * 
 * Servicio de alto nivel que orquesta las operaciones de productos
 */

import { ProductoCompleto } from "@/services/productos";
import { ProductoBase, ProductoVariante } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { generarIdBase } from "@/services/normalizador";
import { IProductRepository } from "../interfaces/IProductRepository";
import { IDataSourceManager } from "../interfaces/IDataSource";
import { INormalizerChain } from "../interfaces/INormalizer";
import {
  getProductRepository,
  getDataSourceManager,
  getNormalizerChain,
} from "../container/serviceConfig";

/**
 * Servicio de productos que implementa principios SOLID
 */
export class ProductService {
  private repository: IProductRepository;
  private dataSourceManager: IDataSourceManager;
  private normalizerChain: INormalizerChain;

  constructor(
    repository?: IProductRepository,
    dataSourceManager?: IDataSourceManager,
    normalizerChain?: INormalizerChain
  ) {
    // Dependency Injection con valores por defecto desde el contenedor
    this.repository = repository || getProductRepository();
    this.dataSourceManager = dataSourceManager || getDataSourceManager();
    this.normalizerChain = normalizerChain || getNormalizerChain();
  }

  /**
   * Obtiene o crea un producto por código de barras
   * Sigue el patrón: Cache → MongoDB → Manual
   */
  async getOrCreateProduct(barcode: string): Promise<ProductoCompleto | null> {
    try {
      console.log("🔍 ProductService: Buscando producto:", barcode);

      // Usar el gestor de fuentes de datos (Strategy Pattern)
      const product = await this.dataSourceManager.fetchProduct(barcode);

      if (product) {
        return product;
      }

      console.log("❌ Producto no encontrado en ninguna fuente");
      return null;
    } catch (error) {
      console.error("❌ ProductService: Error al buscar producto:", error);
      return null;
    }
  }

  /**
   * Obtiene un producto completo por ID de variante
   */
  async getProductById(variantId: string): Promise<ProductoCompleto | null> {
    try {
      const variante = await this.repository.findById(variantId);
      if (!variante) return null;

      const base = await this.repository.findBaseById(variante.productoBaseId);
      if (!base) return null;

      return { base, variante };
    } catch (error) {
      console.error("❌ ProductService: Error al obtener producto:", error);
      return null;
    }
  }

  /**
   * Busca productos base por término
   */
  async searchProducts(term: string): Promise<ProductoBase[]> {
    try {
      return await this.repository.searchBase(term);
    } catch (error) {
      console.error("❌ ProductService: Error al buscar productos:", error);
      return [];
    }
  }

  /**
   * Obtiene variantes de un producto base
   */
  async getVariants(baseId: string): Promise<ProductoVariante[]> {
    try {
      return await this.repository.findVariantsByBaseId(baseId);
    } catch (error) {
      console.error("❌ ProductService: Error al obtener variantes:", error);
      return [];
    }
  }

  /**
   * Crea un producto manualmente (sin datos externos)
   */
  async createManualProduct(
    barcode: string,
    data: {
      nombreBase: string;
      marca?: string;
      nombreVariante?: string;
      tipo?: string;
      tamano?: string;
      sabor?: string;
    }
  ): Promise<ProductoCompleto> {
    const { nombreBase, marca, nombreVariante, tipo, tamano, sabor } = data;

    console.log("🔍 ProductService: Creando producto manual:", {
      nombreBase,
      marca,
    });

    // ========== PASO 1: Buscar o Crear Producto Base ==========
    const idBase = generarIdBase(marca || "", nombreBase);
    const allBases = await this.repository.searchBase("");
    
    let productBase = allBases.find((p) => {
      const idExistente = generarIdBase(p.marca || "", p.nombre);
      return idExistente === idBase;
    });

    if (!productBase) {
      productBase = {
        id: uuidv4(),
        nombre: nombreBase.trim(),
        marca: marca?.trim() || undefined,
        categoria: undefined,
        imagen: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.repository.saveBase(productBase);
      console.log("✨ Nuevo producto base creado:", productBase.nombre);
    } else {
      console.log("✅ Producto base existente:", productBase.nombre);
    }

    // ========== PASO 2: Crear Variante ==========
    const nombreCompletoVariante =
      nombreVariante?.trim() ||
      [nombreBase, marca, tipo, tamano, sabor].filter(Boolean).join(" ");

    const variant: ProductoVariante = {
      id: uuidv4(),
      productoBaseId: productBase.id,
      codigoBarras: barcode,
      nombreCompleto: nombreCompletoVariante,
      tipo: tipo?.trim() || undefined,
      tamano: tamano?.trim() || undefined,
      sabor: sabor?.trim() || undefined,
      unidadMedida: undefined,
      imagen: undefined,
      createdAt: new Date(),
    };

    await this.repository.saveVariant(variant);

    console.log("✅ ProductService: Producto manual creado:", {
      base: productBase.nombre,
      variant: variant.nombreCompleto,
    });

    return { base: productBase, variante: variant };
  }

  /**
   * Normaliza datos crudos usando la cadena de normalizadores
   */
  async normalizeProductData(rawData: any) {
    return await this.normalizerChain.normalize(rawData);
  }
}
