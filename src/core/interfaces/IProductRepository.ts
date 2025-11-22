/**
 * Interface Segregation Principle (ISP) - Interfaces específicas por capacidad
 * Dependency Inversion Principle (DIP) - Abstracciones en lugar de implementaciones concretas
 */

import { ProductoBase, ProductoVariante } from "@/types";

/**
 * Interface para lectura de productos
 */
export interface IProductReader {
  findByBarcode(barcode: string): Promise<ProductoVariante | null>;
  findById(id: string): Promise<ProductoVariante | null>;
  findBaseById(id: string): Promise<ProductoBase | null>;
  findVariantsByBaseId(baseId: string): Promise<ProductoVariante[]>;
  searchBase(term: string): Promise<ProductoBase[]>;
}

/**
 * Interface para escritura de productos
 */
export interface IProductWriter {
  saveBase(product: ProductoBase): Promise<ProductoBase>;
  saveVariant(variant: ProductoVariante): Promise<ProductoVariante>;
  updateBase(id: string, data: Partial<ProductoBase>): Promise<void>;
  deleteVariant(id: string): Promise<void>;
}

/**
 * Interface para cache de productos
 */
export interface IProductCache {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  clear(key?: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * Interface completa del repositorio (combina reader y writer)
 */
export interface IProductRepository extends IProductReader, IProductWriter {
  initialize(): Promise<void>;
}
