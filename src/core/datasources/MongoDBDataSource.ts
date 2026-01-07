/**
 * Strategy Pattern - Fuente de datos MongoDB
 * Single Responsibility Principle (SRP) - Solo maneja API MongoDB
 */

import { IDataSource } from "../interfaces/IDataSource";
import { ProductoCompleto } from "@/types";
import { IProductRepository } from "../interfaces/IProductRepository";

export class MongoDBDataSource implements IDataSource {
  public readonly name = "MongoDB API";
  public readonly priority = 50; // Prioridad media

  constructor(private localRepository: IProductRepository) {}

  async isAvailable(): Promise<boolean> {
    try {
      // Verificar disponibilidad con una petición simple
      // Nota: Idealmente debería existir un endpoint de health check dedicado
      const response = await fetch("/api/productos/buscar", {
        method: "HEAD",
      });
      return response.status !== 503;
    } catch {
      return false;
    }
  }

  async fetchProduct(barcode: string): Promise<ProductoCompleto | null> {
    try {
      console.log(`📡 ${this.name}: Consultando producto ${barcode}`);
      
      const response = await fetch(`/api/productos/buscar?ean=${barcode}`);
      
      if (!response.ok) {
        if (response.status === 503) {
          console.warn(`⚠️ ${this.name}: Servicio no disponible`);
        }
        return null;
      }

      const data = await response.json();
      
      if (!data.success || !data.producto) {
        return null;
      }

      console.log(`✅ ${this.name}: Producto encontrado`);

      // Sincronizar con cache local
      const { base, variante } = data.producto;
      
      await this.localRepository.saveBase({
        id: base.id,
        nombre: base.nombre,
        marca: base.marca,
        categoria: base.categoria,
        imagen: base.imagen,
        createdAt: new Date(base.createdAt),
        updatedAt: new Date(),
      });

      await this.localRepository.saveVariant({
        id: variante.id,
        productoBaseId: base.id,
        codigoBarras: variante.ean,
        nombreCompleto: variante.nombreCompleto,
        tipo: variante.tipo,
        tamano: variante.tamano,
        sabor: variante.sabor,
        unidadMedida: variante.unidad,
        imagen: variante.imagen,
        createdAt: new Date(variante.createdAt),
      });

      console.log(`✅ ${this.name}: Producto sincronizado con cache local`);

      // Retornar desde cache local para consistencia
      return await this.localRepository.findByBarcode(barcode).then(async (v) => {
        if (!v) return null;
        const b = await this.localRepository.findBaseById(v.productoBaseId);
        return b ? { base: b, variante: v } : null;
      });
    } catch (error) {
      console.error(`❌ ${this.name}: Error al consultar`, error);
      return null;
    }
  }
}
