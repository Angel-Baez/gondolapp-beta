/**
 * Interface Segregation Principle (ISP) - Interface específica para administración
 * Single Responsibility Principle (SRP) - Solo operaciones de admin de productos
 */

import { ProductoBase, ProductoVariante } from "@/types";

/**
 * Resultado de búsqueda paginada de productos
 */
export interface SearchProductsResult {
  productos: ProductoBase[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Producto completo con sus variantes
 */
export interface ProductoCompleto {
  base: ProductoBase;
  variantes: ProductoVariante[];
}

/**
 * Filtros de búsqueda de productos
 */
export interface ProductSearchFilters {
  query?: string;
  marca?: string;
  categoria?: string;
  page?: number;
  limit?: number;
}

/**
 * Filtros de búsqueda de variantes
 */
export interface VariantSearchFilters {
  query?: string;
  productoBaseId?: string;
  ean?: string;
}

/**
 * Interface para operaciones administrativas de productos
 * Extiende las capacidades del IProductRepository básico
 */
export interface IAdminProductRepository {
  /**
   * Búsqueda avanzada de productos con filtros y paginación
   */
  searchProducts(filters: ProductSearchFilters): Promise<SearchProductsResult>;

  /**
   * Búsqueda de variantes con filtros
   */
  searchVariants(filters: VariantSearchFilters): Promise<ProductoVariante[]>;

  /**
   * Obtiene un producto base por ID
   */
  getProductoBaseById(id: string): Promise<ProductoBase | null>;

  /**
   * Obtiene una variante por ID
   */
  getVarianteById(id: string): Promise<ProductoVariante | null>;

  /**
   * Obtiene un producto base con todas sus variantes
   */
  getProductoBaseConVariantes(id: string): Promise<ProductoCompleto | null>;

  /**
   * Actualiza un producto base
   */
  updateProductoBase(id: string, data: Partial<ProductoBase>): Promise<void>;

  /**
   * Actualiza una variante
   */
  updateVariante(id: string, data: Partial<ProductoVariante>): Promise<void>;

  /**
   * Elimina un producto base (solo si no tiene variantes)
   */
  deleteProductoBase(id: string): Promise<void>;

  /**
   * Elimina una variante
   */
  deleteVariante(id: string): Promise<void>;

  /**
   * Cuenta las variantes de un producto base
   */
  countVariantesByBaseId(baseId: string): Promise<number>;

  /**
   * Obtiene todas las variantes de un producto base
   */
  getVariantesByBaseId(baseId: string): Promise<ProductoVariante[]>;
}
