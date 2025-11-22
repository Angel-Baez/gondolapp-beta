# Core SOLID Architecture

Este directorio contiene la arquitectura SOLID del proyecto GondolApp.

## 📁 Estructura

```
core/
├── interfaces/          # Abstracciones (Dependency Inversion)
│   ├── IProductRepository.ts    # Interfaces de repositorio
│   ├── INormalizer.ts           # Interfaces de normalización
│   ├── IDataSource.ts           # Interfaces de fuentes de datos
│   └── ISanitizer.ts            # Interfaces de sanitización
│
├── repositories/        # Implementaciones de persistencia
│   └── IndexedDBProductRepository.ts
│
├── normalizers/         # Sistema de normalización (Strategy + Chain)
│   ├── GeminiAINormalizer.ts    # Normalización con IA
│   ├── ManualNormalizer.ts      # Normalización manual (fallback)
│   └── NormalizerChain.ts       # Chain of Responsibility
│
├── datasources/         # Fuentes de datos (Strategy Pattern)
│   ├── LocalDataSource.ts       # Cache local (IndexedDB)
│   ├── MongoDBDataSource.ts     # API MongoDB
│   └── DataSourceManager.ts     # Gestor de fuentes
│
├── services/            # Lógica de negocio (Facade)
│   └── ProductService.ts
│
├── container/           # IoC Container (Dependency Injection)
│   ├── ServiceContainer.ts
│   └── serviceConfig.ts
│
└── index.ts             # Exportaciones principales
```

## 🎯 Principios SOLID Aplicados

### 1. Single Responsibility (SRP)
Cada clase tiene una única razón para cambiar:

- **IndexedDBProductRepository**: Solo maneja persistencia en IndexedDB
- **ProductService**: Solo orquesta lógica de negocio
- **DataSourceManager**: Solo gestiona fuentes de datos
- **NormalizerChain**: Solo gestiona la cadena de normalización

### 2. Open/Closed (OCP)
Abierto para extensión, cerrado para modificación:

```typescript
// Agregar nueva fuente sin modificar DataSourceManager
export class NewDataSource implements IDataSource {
  // Implementación
}

// Registrar en serviceConfig.ts
manager.registerSource(new NewDataSource(repository));
```

### 3. Liskov Substitution (LSP)
Los subtipos son sustituibles por sus tipos base:

```typescript
// Cualquier IProductRepository es intercambiable
const repo: IProductRepository = new IndexedDBProductRepository();
const repo2: IProductRepository = new SQLProductRepository(); // Futuro
```

### 4. Interface Segregation (ISP)
Interfaces específicas en lugar de una grande:

```typescript
// Separado por capacidad
interface IProductReader { /* solo lectura */ }
interface IProductWriter { /* solo escritura */ }
interface IProductCache { /* solo caché */ }
```

### 5. Dependency Inversion (DIP)
Depende de abstracciones, no de implementaciones:

```typescript
export class ProductService {
  constructor(
    private repository: IProductRepository,        // Abstracción
    private dataSourceManager: IDataSourceManager, // Abstracción
    private normalizerChain: INormalizerChain     // Abstracción
  ) {}
}
```

## 🚀 Uso Rápido

### Configuración Inicial

El sistema se inicializa automáticamente en `PWAProvider.tsx`:

```typescript
import { initializeServices } from "@/core/container/serviceConfig";

useEffect(() => {
  initializeServices();
}, []);
```

### Uso Básico

```typescript
import { ProductService } from "@/core/services/ProductService";

const service = new ProductService();
const producto = await service.getOrCreateProduct(barcode);
```

### Obtener Servicios del Contenedor

```typescript
import {
  getProductRepository,
  getDataSourceManager,
  getNormalizerChain
} from "@/core/container/serviceConfig";

const repository = getProductRepository();
const dataSourceManager = getDataSourceManager();
const normalizerChain = getNormalizerChain();
```

## 🔧 Extensibilidad

### Agregar Nueva Fuente de Datos

```typescript
// 1. Implementar interfaz
export class OpenFoodFactsDataSource implements IDataSource {
  name = "Open Food Facts";
  priority = 30;

  async fetchProduct(barcode: string): Promise<ProductoCompleto | null> {
    // Tu implementación
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

// 2. Registrar en serviceConfig.ts
manager.registerSource(new OpenFoodFactsDataSource(repository));
```

### Agregar Nuevo Normalizador

```typescript
// 1. Implementar interfaz
export class RegexNormalizer implements INormalizer {
  priority = 70;

  canHandle(rawData: any): boolean {
    return rawData.rawText !== undefined;
  }

  async normalize(rawData: any): Promise<DatosNormalizados | null> {
    // Tu implementación
  }
}

// 2. Registrar en serviceConfig.ts
chain.addNormalizer(new RegexNormalizer());
```

### Cambiar Implementación del Repositorio

```typescript
// Crear nueva implementación
export class FirebaseProductRepository implements IProductRepository {
  // Implementación de Firebase
}

// Cambiar en serviceConfig.ts
container.registerSingleton<IProductRepository>(
  ServiceKeys.ProductRepository,
  () => new FirebaseProductRepository()
);
```

## 🧪 Testing

La arquitectura SOLID facilita el testing:

```typescript
import { ProductService } from "@/core/services/ProductService";

// Mock del repositorio
class MockProductRepository implements IProductRepository {
  async findByBarcode(barcode: string) {
    return { id: "1", codigoBarras: barcode, /* ... */ };
  }
  // ... otros métodos
}

// Test
describe('ProductService', () => {
  it('should find product', async () => {
    const mockRepo = new MockProductRepository();
    const service = new ProductService(mockRepo);
    
    const result = await service.getOrCreateProduct('123');
    expect(result).toBeDefined();
  });
});
```

## 📊 Flujo de Datos

```
Usuario escanea código
        ↓
  ProductService.getOrCreateProduct()
        ↓
  DataSourceManager.fetchProduct()
        ↓
  ┌─────────────────────────────────┐
  │ 1. LocalDataSource (Cache)      │ → IndexedDB
  │ 2. MongoDBDataSource (API)      │ → API + Sync to Cache
  │ 3. Return null (no encontrado)  │
  └─────────────────────────────────┘
        ↓
  Retornar ProductoCompleto
```

## 🎨 Patrones de Diseño

### Repository Pattern
```typescript
interface IProductRepository {
  findByBarcode(barcode: string): Promise<ProductoVariante | null>;
  saveBase(product: ProductoBase): Promise<ProductoBase>;
}
```

### Strategy Pattern
```typescript
interface IDataSource {
  fetchProduct(barcode: string): Promise<ProductoCompleto | null>;
}

class LocalDataSource implements IDataSource { /* ... */ }
class MongoDBDataSource implements IDataSource { /* ... */ }
```

### Chain of Responsibility
```typescript
class NormalizerChain {
  addNormalizer(normalizer: INormalizer): void;
  async normalize(rawData: any): Promise<DatosNormalizados | null>;
}
```

### Facade Pattern
```typescript
class ProductService {
  async getOrCreateProduct(barcode: string): Promise<ProductoCompleto | null> {
    // Simplifica la interacción con múltiples subsistemas
  }
}
```

### Dependency Injection
```typescript
class ServiceContainer {
  registerSingleton<T>(key: string, factory: () => T): void;
  resolve<T>(key: string): T;
}
```

## 📖 Documentación Adicional

- [SOLID Principles (Completo)](../../docs/SOLID-PRINCIPLES.md)
- [README Principal](../../README.md)

## 💡 Tips

1. **Siempre usa interfaces**: Depende de abstracciones, no de implementaciones
2. **Inyecta dependencias**: No uses `new` directamente, usa el contenedor
3. **Una responsabilidad por clase**: Si una clase hace mucho, divídela
4. **Extiende sin modificar**: Usa interfaces para agregar funcionalidad
5. **Prueba con mocks**: La arquitectura SOLID facilita el testing

## 🤝 Contribuir

Al agregar nueva funcionalidad:

1. ✅ Crea interfaces primero
2. ✅ Implementa siguiendo principios SOLID
3. ✅ Registra en el contenedor si es necesario
4. ✅ Agrega tests con mocks
5. ✅ Documenta la nueva funcionalidad

---

**Arquitectura diseñada para escalar y mantenerse en el tiempo** 🚀
