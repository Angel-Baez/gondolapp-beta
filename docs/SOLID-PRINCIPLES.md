# Implementación de Principios SOLID en GondolApp

Este documento explica cómo se han implementado los principios SOLID en GondolApp-Beta.

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Principios SOLID Implementados](#principios-solid-implementados)
3. [Arquitectura de Capas](#arquitectura-de-capas)
4. [Patrones de Diseño Utilizados](#patrones-de-diseño-utilizados)
5. [Guía de Uso](#guía-de-uso)
6. [Comparación Antes/Después](#comparación-antesdespués)

## 🎯 Introducción

La arquitectura de GondolApp ha sido refactorizada para seguir los principios SOLID, mejorando la mantenibilidad, testabilidad y escalabilidad del código.

### ¿Por qué SOLID?

- ✅ **Mantenibilidad**: Código más fácil de entender y modificar
- ✅ **Testabilidad**: Componentes desacoplados y testeables
- ✅ **Escalabilidad**: Fácil agregar nuevas funcionalidades
- ✅ **Reusabilidad**: Código más modular y reutilizable
- ✅ **Calidad**: Menos bugs y mejor arquitectura

## 🏛️ Principios SOLID Implementados

### 1. Single Responsibility Principle (SRP)

**"Una clase debe tener una sola razón para cambiar"**

#### Antes:
```typescript
// productos.ts mezclaba múltiples responsabilidades:
// - Acceso a datos (IndexedDB)
// - Lógica de negocio (búsqueda, creación)
// - Comunicación con API externa (MongoDB)
// - Normalización de datos
```

#### Después:
```typescript
// Responsabilidades separadas:
// - IndexedDBProductRepository: Solo persistencia de datos
// - ProductService: Solo lógica de negocio
// - DataSourceManager: Solo gestión de fuentes de datos
// - NormalizerChain: Solo normalización
```

**Ejemplo:**
```typescript
// src/core/repositories/IndexedDBProductRepository.ts
export class IndexedDBProductRepository implements IProductRepository {
  // SOLO se encarga de persistencia en IndexedDB
  async findByBarcode(barcode: string): Promise<ProductoVariante | null> {
    return await db.productosVariantes
      .where("codigoBarras")
      .equals(barcode)
      .first();
  }
}
```

### 2. Open/Closed Principle (OCP)

**"Abierto para extensión, cerrado para modificación"**

#### Sistema de Normalizadores Extensible:

```typescript
// Agregar nuevo normalizador sin modificar código existente
export class OpenFoodFactsNormalizer implements INormalizer {
  priority = 50;

  canHandle(rawData: any): boolean {
    return rawData.product?.product_name !== undefined;
  }

  async normalize(rawData: any): Promise<DatosNormalizados | null> {
    // Implementación específica
  }
}

// Registrar en serviceConfig.ts
chain.addNormalizer(new OpenFoodFactsNormalizer());
```

#### Sistema de Fuentes de Datos Extensible:

```typescript
// Agregar nueva fuente sin modificar DataSourceManager
export class OpenFoodFactsDataSource implements IDataSource {
  name = "Open Food Facts API";
  priority = 30;

  async fetchProduct(barcode: string): Promise<ProductoCompleto | null> {
    // Implementación específica
  }
}
```

### 3. Liskov Substitution Principle (LSP)

**"Los subtipos deben ser sustituibles por sus tipos base"**

Todas las implementaciones de interfaces son intercambiables:

```typescript
// Cualquier IProductRepository es sustituible
const repo1: IProductRepository = new IndexedDBProductRepository();
const repo2: IProductRepository = new InMemoryProductRepository(); // Futura implementación

// Cualquier INormalizer es sustituible
const normalizer1: INormalizer = new GeminiAINormalizer();
const normalizer2: INormalizer = new ManualNormalizer();

// Ambos cumplen el contrato y son intercambiables
```

### 4. Interface Segregation Principle (ISP)

**"Los clientes no deben depender de interfaces que no usan"**

Interfaces específicas en lugar de una interfaz monolítica:

```typescript
// Interfaces segregadas por capacidad
export interface IProductReader {
  findByBarcode(barcode: string): Promise<ProductoVariante | null>;
  findById(id: string): Promise<ProductoVariante | null>;
  searchBase(term: string): Promise<ProductoBase[]>;
}

export interface IProductWriter {
  saveBase(product: ProductoBase): Promise<ProductoBase>;
  saveVariant(variant: ProductoVariante): Promise<ProductoVariante>;
  deleteVariant(id: string): Promise<void>;
}

// Solo implementa lo que necesita
export class ReadOnlyRepository implements IProductReader {
  // No necesita implementar IProductWriter
}
```

### 5. Dependency Inversion Principle (DIP)

**"Depende de abstracciones, no de implementaciones concretas"**

#### Inyección de Dependencias:

```typescript
// ProductService depende de interfaces, no implementaciones
export class ProductService {
  constructor(
    private repository: IProductRepository,        // Abstracción
    private dataSourceManager: IDataSourceManager, // Abstracción
    private normalizerChain: INormalizerChain     // Abstracción
  ) {}
}

// Configuración en serviceConfig.ts
container.registerSingleton<IProductRepository>(
  ServiceKeys.ProductRepository,
  () => new IndexedDBProductRepository()
);
```

## 🏗️ Arquitectura de Capas

```
┌─────────────────────────────────────────┐
│   Presentación (Components/Pages)      │
│   - BarcodeScanner.tsx                 │
│   - page.tsx                           │
└───────────────┬─────────────────────────┘
                │ usa
┌───────────────▼─────────────────────────┐
│   Servicios Legados (Compatibilidad)   │
│   - src/services/productos.ts          │
│   (Delegado a ProductService)          │
└───────────────┬─────────────────────────┘
                │ delega
┌───────────────▼─────────────────────────┐
│   Core/Servicios (Lógica de Negocio)  │
│   - ProductService (Facade)            │
└───────────┬──────────────┬──────────────┘
            │              │
┌───────────▼─────┐   ┌───▼──────────────┐
│  Repositorios   │   │  Fuentes Datos   │
│  (Persistencia) │   │  (Strategy)      │
│  - IndexedDB    │   │  - LocalSource   │
│                 │   │  - MongoDB       │
└─────────────────┘   └──────────────────┘
```

## 🎨 Patrones de Diseño Utilizados

### 1. Repository Pattern
Abstrae el acceso a datos:
```typescript
// Interfaz
interface IProductRepository { ... }

// Implementación
class IndexedDBProductRepository implements IProductRepository { ... }
```

### 2. Strategy Pattern
Diferentes estrategias intercambiables:
```typescript
// Estrategias de normalización
interface INormalizer { normalize(): ... }
class GeminiAINormalizer implements INormalizer { ... }
class ManualNormalizer implements INormalizer { ... }

// Estrategias de fuentes de datos
interface IDataSource { fetchProduct(): ... }
class LocalDataSource implements IDataSource { ... }
class MongoDBDataSource implements IDataSource { ... }
```

### 3. Chain of Responsibility
Cadena de procesamiento:
```typescript
class NormalizerChain {
  async normalize(data: any): Promise<DatosNormalizados | null> {
    for (const normalizer of this.normalizers) {
      if (normalizer.canHandle(data)) {
        const result = await normalizer.normalize(data);
        if (result) return result;
      }
    }
    return null;
  }
}
```

### 4. Facade Pattern
API simplificada:
```typescript
export class ProductService {
  // Simplifica la interacción con múltiples subsistemas
  async getOrCreateProduct(barcode: string): Promise<ProductoCompleto | null> {
    return await this.dataSourceManager.fetchProduct(barcode);
  }
}
```

### 5. Dependency Injection / IoC Container
Gestión centralizada de dependencias:
```typescript
export class ServiceContainer {
  registerSingleton<T>(key: string, implementation: Constructor<T>): void
  resolve<T>(key: string): T
}
```

### 6. Singleton Pattern
Instancia única del servicio:
```typescript
let productServiceInstance: ProductService | null = null;

function getProductService(): ProductService {
  if (!productServiceInstance) {
    productServiceInstance = new ProductService();
  }
  return productServiceInstance;
}
```

## 📚 Guía de Uso

### Uso Básico (Código Existente)

El código existente sigue funcionando sin cambios:

```typescript
import { obtenerOCrearProducto } from "@/services/productos";

// Funciona exactamente igual que antes
const producto = await obtenerOCrearProducto(barcode);
```

### Uso Avanzado (Nueva API SOLID)

Para código nuevo, usa la API SOLID directamente:

```typescript
import { ProductService } from "@/core/services/ProductService";

const service = new ProductService();
const producto = await service.getOrCreateProduct(barcode);
```

### Agregar Nueva Fuente de Datos

```typescript
// 1. Crear nueva implementación
export class NewDataSource implements IDataSource {
  name = "Nueva Fuente";
  priority = 40;

  async fetchProduct(barcode: string): Promise<ProductoCompleto | null> {
    // Tu implementación
  }
  
  async isAvailable(): Promise<boolean> {
    return true;
  }
}

// 2. Registrar en serviceConfig.ts
manager.registerSource(new NewDataSource(repository));
```

### Agregar Nuevo Normalizador

```typescript
// 1. Crear nueva implementación
export class NewNormalizer implements INormalizer {
  priority = 60;

  canHandle(rawData: any): boolean {
    return rawData.someCondition;
  }

  async normalize(rawData: any): Promise<DatosNormalizados | null> {
    // Tu implementación
  }
}

// 2. Registrar en serviceConfig.ts
chain.addNormalizer(new NewNormalizer());
```

## 📊 Comparación Antes/Después

### Antes (Sin SOLID)

**Problemas:**
- ❌ Código fuertemente acoplado
- ❌ Difícil de testear (dependencias directas)
- ❌ Lógica mezclada en un solo archivo
- ❌ Imposible cambiar implementaciones sin modificar código
- ❌ Duplicación de lógica

**Ejemplo:**
```typescript
// Todo en un archivo
export async function obtenerOCrearProducto(ean: string) {
  // Acceso directo a IndexedDB
  const variante = await db.productosVariantes.where(...).first();
  
  // Acceso directo a API
  const response = await fetch(`/api/productos/buscar?ean=${ean}`);
  
  // Lógica de negocio mezclada
  if (variante) { ... }
  if (response.ok) { ... }
  
  // Sin abstracciones, sin interfaces
}
```

### Después (Con SOLID)

**Beneficios:**
- ✅ Código desacoplado y modular
- ✅ Fácil de testear (inyección de dependencias)
- ✅ Separación clara de responsabilidades
- ✅ Extensible sin modificar código existente
- ✅ Reutilización de componentes

**Ejemplo:**
```typescript
// Interfaces claras
interface IProductRepository { ... }
interface IDataSource { ... }
interface INormalizer { ... }

// Implementaciones separadas
class IndexedDBProductRepository implements IProductRepository { ... }
class LocalDataSource implements IDataSource { ... }
class GeminiAINormalizer implements INormalizer { ... }

// Servicio orquestador
export class ProductService {
  constructor(
    private repository: IProductRepository,
    private dataSourceManager: IDataSourceManager,
    private normalizerChain: INormalizerChain
  ) {}
  
  async getOrCreateProduct(barcode: string) {
    return this.dataSourceManager.fetchProduct(barcode);
  }
}
```

## 🧪 Testing

La arquitectura SOLID facilita el testing:

```typescript
// Mock de repositorio para testing
class MockProductRepository implements IProductRepository {
  async findByBarcode(barcode: string) {
    return { /* mock data */ };
  }
  // ... otros métodos
}

// Test
describe('ProductService', () => {
  it('should fetch product', async () => {
    const mockRepo = new MockProductRepository();
    const service = new ProductService(mockRepo, ...);
    
    const result = await service.getOrCreateProduct('123');
    expect(result).toBeDefined();
  });
});
```

## 📂 Estructura de Archivos

```
src/
├── core/                           # ← Nueva arquitectura SOLID
│   ├── interfaces/                 # Abstracciones (DIP)
│   │   ├── IProductRepository.ts
│   │   ├── INormalizer.ts
│   │   ├── IDataSource.ts
│   │   └── ISanitizer.ts
│   ├── repositories/               # Persistencia (SRP)
│   │   └── IndexedDBProductRepository.ts
│   ├── normalizers/                # Normalización (OCP, LSP)
│   │   ├── GeminiAINormalizer.ts
│   │   ├── ManualNormalizer.ts
│   │   └── NormalizerChain.ts
│   ├── datasources/                # Fuentes de datos (Strategy)
│   │   ├── LocalDataSource.ts
│   │   ├── MongoDBDataSource.ts
│   │   └── DataSourceManager.ts
│   ├── services/                   # Lógica de negocio (Facade)
│   │   └── ProductService.ts
│   ├── container/                  # IoC Container (DIP)
│   │   ├── ServiceContainer.ts
│   │   └── serviceConfig.ts
│   └── index.ts
├── services/                       # ← Compatibilidad con código existente
│   ├── productos.ts               # Ahora delega a ProductService
│   ├── normalizador.ts
│   └── normalizadorIA.ts
└── ...
```

## 🚀 Próximos Pasos

### Mejoras Futuras

1. **Testing**: Agregar tests unitarios y de integración
2. **Caché**: Implementar estrategia de caché más sofisticada
3. **Observabilidad**: Agregar logging y métricas
4. **Validación**: Implementar validadores específicos (ISP)
5. **Retry Logic**: Agregar reintentos automáticos en fuentes de datos

### Extensibilidad

La arquitectura SOLID permite:
- ✅ Agregar nuevas fuentes de datos (Open Food Facts, otra API)
- ✅ Agregar nuevos normalizadores (regex, ML, etc.)
- ✅ Cambiar la implementación del repositorio (SQL, Firebase, etc.)
- ✅ Agregar middlewares de validación, logging, etc.

## 📖 Referencias

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)

---

**Nota**: Esta implementación mantiene 100% de compatibilidad con el código existente mientras proporciona una arquitectura moderna y escalable.
