/**
 * Mock repository for server-side API routes
 * IndexedDB only works client-side, so this provides no-op implementations
 */

import { ProductoBase, ProductoVariante } from "@/types";
import { IProductRepository } from "../interfaces/IProductRepository";

/**
 * Server-side mock repository that doesn't perform actual IndexedDB operations
 * Used in API routes where IndexedDB is not available
 */
export class ServerSideProductRepository implements IProductRepository {
  async initialize(): Promise<void> {
    // No-op on server side
  }

  async findByBarcode(barcode: string): Promise<ProductoVariante | null> {
    return null;
  }

  async findById(id: string): Promise<ProductoVariante | null> {
    return null;
  }

  async findBaseById(id: string): Promise<ProductoBase | null> {
    return null;
  }

  async findVariantsByBaseId(baseId: string): Promise<ProductoVariante[]> {
    return [];
  }

  async searchBase(term: string): Promise<ProductoBase[]> {
    return [];
  }

  async saveBase(product: ProductoBase): Promise<ProductoBase> {
    return product;
  }

  async saveVariant(variant: ProductoVariante): Promise<ProductoVariante> {
    return variant;
  }

  async updateBase(id: string, data: Partial<ProductoBase>): Promise<void> {
    // No-op on server side
  }

  async deleteVariant(id: string): Promise<void> {
    // No-op on server side
  }

  async deleteBase(id: string): Promise<void> {
    // No-op on server side
  }
}
