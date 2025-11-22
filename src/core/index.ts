/**
 * Punto de entrada principal del core SOLID
 * Exporta todas las interfaces, servicios y configuración
 */

// ==================== Interfaces ====================
export * from "./interfaces/IProductRepository";
export * from "./interfaces/INormalizer";
export * from "./interfaces/IDataSource";
export * from "./interfaces/ISanitizer";

// ==================== Repositorios ====================
export * from "./repositories/IndexedDBProductRepository";

// ==================== Normalizadores ====================
export * from "./normalizers/GeminiAINormalizer";
export * from "./normalizers/ManualNormalizer";
export * from "./normalizers/NormalizerChain";

// ==================== Fuentes de Datos ====================
export * from "./datasources/LocalDataSource";
export * from "./datasources/MongoDBDataSource";
export * from "./datasources/DataSourceManager";

// ==================== Container ====================
export * from "./container/ServiceContainer";
export * from "./container/serviceConfig";

// ==================== Servicios ====================
export * from "./services/ProductService";
