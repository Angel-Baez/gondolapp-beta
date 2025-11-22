/**
 * Factory Pattern - Configuración centralizada de dependencias
 * Dependency Inversion Principle (DIP) - Inicializa todas las dependencias
 * 
 * Configura el contenedor de servicios con todas las implementaciones SOLID
 */

import { container } from "./ServiceContainer";
import { IndexedDBProductRepository } from "../repositories/IndexedDBProductRepository";
import { GeminiAINormalizer } from "../normalizers/GeminiAINormalizer";
import { ManualNormalizer } from "../normalizers/ManualNormalizer";
import { NormalizerChain } from "../normalizers/NormalizerChain";
import { LocalDataSource } from "../datasources/LocalDataSource";
import { MongoDBDataSource } from "../datasources/MongoDBDataSource";
import { DataSourceManager } from "../datasources/DataSourceManager";
import { IProductRepository } from "../interfaces/IProductRepository";
import { INormalizerChain } from "../interfaces/INormalizer";
import { IDataSourceManager } from "../interfaces/IDataSource";

// Claves para el contenedor (como enums para type-safety)
export const ServiceKeys = {
  ProductRepository: "IProductRepository",
  NormalizerChain: "INormalizerChain",
  DataSourceManager: "IDataSourceManager",
} as const;

/**
 * Inicializa el contenedor de servicios
 * Debe llamarse una vez al inicio de la aplicación
 */
export function initializeServices(): void {
  console.log("🚀 Inicializando servicios SOLID...");

  // ==================== Repositorio ====================
  container.registerSingleton<IProductRepository>(
    ServiceKeys.ProductRepository,
    () => {
      const repo = new IndexedDBProductRepository();
      // Inicializar de forma asíncrona
      // El repositorio es funcional inmediatamente ya que Dexie se inicializa automáticamente
      repo.initialize().catch((error) => {
        console.error("⚠️ Error al inicializar repositorio:", error);
      });
      return repo;
    }
  );

  // ==================== Cadena de Normalizadores ====================
  container.registerSingleton<INormalizerChain>(
    ServiceKeys.NormalizerChain,
    () => {
      const chain = new NormalizerChain();
      
      // Agregar normalizadores en orden de prioridad
      chain.addNormalizer(new GeminiAINormalizer());
      chain.addNormalizer(new ManualNormalizer());
      
      console.log("✓ Cadena de normalizadores configurada");
      return chain;
    }
  );

  // ==================== Gestor de Fuentes de Datos ====================
  container.registerSingleton<IDataSourceManager>(
    ServiceKeys.DataSourceManager,
    () => {
      const manager = new DataSourceManager();
      const repository = container.resolve<IProductRepository>(
        ServiceKeys.ProductRepository
      );

      // Registrar fuentes en orden de prioridad
      manager.registerSource(new LocalDataSource(repository));
      manager.registerSource(new MongoDBDataSource(repository));

      console.log("✓ Gestor de fuentes de datos configurado");
      return manager;
    }
  );

  console.log("✅ Servicios SOLID inicializados correctamente");
}

/**
 * Obtiene el repositorio de productos
 */
export function getProductRepository(): IProductRepository {
  return container.resolve<IProductRepository>(ServiceKeys.ProductRepository);
}

/**
 * Obtiene la cadena de normalizadores
 */
export function getNormalizerChain(): INormalizerChain {
  return container.resolve<INormalizerChain>(ServiceKeys.NormalizerChain);
}

/**
 * Obtiene el gestor de fuentes de datos
 */
export function getDataSourceManager(): IDataSourceManager {
  return container.resolve<IDataSourceManager>(ServiceKeys.DataSourceManager);
}
