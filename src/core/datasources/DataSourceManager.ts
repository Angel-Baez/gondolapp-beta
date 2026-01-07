/**
 * Strategy Pattern Manager
 * Open/Closed Principle (OCP) - Nuevas fuentes sin modificar manager
 * Single Responsibility Principle (SRP) - Solo gestiona fuentes de datos
 */

import { IDataSource, IDataSourceManager } from "../interfaces/IDataSource";
import { ProductoCompleto } from "@/types";

export class DataSourceManager implements IDataSourceManager {
  private sources: IDataSource[] = [];

  registerSource(source: IDataSource): void {
    this.sources.push(source);
    // Ordenar por prioridad (mayor a menor)
    this.sources.sort((a, b) => b.priority - a.priority);
    console.log(`✓ Fuente de datos registrada: ${source.name} (prioridad: ${source.priority})`);
  }

  async fetchProduct(barcode: string): Promise<ProductoCompleto | null> {
    console.log(`🔍 Buscando producto ${barcode} en ${this.sources.length} fuentes`);

    for (const source of this.sources) {
      const available = await source.isAvailable();
      
      if (!available) {
        console.log(`⚠️ ${source.name} no disponible, saltando...`);
        continue;
      }

      try {
        const product = await source.fetchProduct(barcode);
        
        if (product) {
          console.log(`✅ Producto encontrado en ${source.name}`);
          return product;
        }
      } catch (error) {
        console.error(`❌ Error en ${source.name}:`, error);
        // Continuar con siguiente fuente
      }
    }

    console.log("❌ Producto no encontrado en ninguna fuente");
    return null;
  }

  async getAvailableSources(): Promise<IDataSource[]> {
    const available: IDataSource[] = [];
    
    for (const source of this.sources) {
      if (await source.isAvailable()) {
        available.push(source);
      }
    }
    
    return available;
  }

  /**
   * Obtiene todas las fuentes registradas (disponibles o no)
   */
  getAllSources(): ReadonlyArray<IDataSource> {
    return [...this.sources];
  }
}
