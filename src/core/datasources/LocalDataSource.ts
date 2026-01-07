/**
 * Strategy Pattern - Fuente de datos local (IndexedDB)
 * Single Responsibility Principle (SRP) - Solo maneja cache local
 */

import { IDataSource } from "../interfaces/IDataSource";
import { ProductoCompleto } from "@/types";
import { IProductRepository } from "../interfaces/IProductRepository";

export class LocalDataSource implements IDataSource {
  public readonly name = "Local Cache (IndexedDB)";
  public readonly priority = 100; // Máxima prioridad (offline-first)

  constructor(private repository: IProductRepository) {}

  async isAvailable(): Promise<boolean> {
    // IndexedDB siempre está disponible en navegadores
    return true;
  }

  async fetchProduct(barcode: string): Promise<ProductoCompleto | null> {
    try {
      console.log(`📦 ${this.name}: Buscando producto ${barcode}`);
      
      const variante = await this.repository.findByBarcode(barcode);
      if (!variante) {
        return null;
      }

      const base = await this.repository.findBaseById(variante.productoBaseId);
      if (!base) {
        console.warn("⚠️ Variante sin producto base asociado");
        return null;
      }

      console.log(`✅ ${this.name}: Producto encontrado en cache`);
      return { base, variante };
    } catch (error) {
      console.error(`❌ ${this.name}: Error al buscar producto`, error);
      return null;
    }
  }
}
