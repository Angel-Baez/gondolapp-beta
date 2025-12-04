# Shared SOLID Principles

> Universal SOLID principles implementation guide for MERN + Next.js + TypeScript projects.
> All architecture and implementation agents should reference this document.

## Overview

SOLID principles form the foundation of maintainable, scalable, and testable code. The level of abstraction should match project complexity:

| Project Size | Recommended Approach |
|--------------|---------------------|
| Small (MVP) | Basic separation of concerns, minimal interfaces |
| Medium | Full SOLID with key abstractions |
| Large/Enterprise | Full SOLID with IoC container, extensive interfaces |

## Single Responsibility Principle (SRP)

> "A class should have only one reason to change."

### Pattern

Each module/class should handle ONE concern:

```typescript
// ✅ CORRECT - Single responsibility per class
class ProductRepository {
  // ONLY data persistence
  async findById(id: string): Promise<Product | null>;
  async save(product: Product): Promise<Product>;
  async delete(id: string): Promise<void>;
}

class ProductValidator {
  // ONLY validation
  validate(product: ProductInput): ValidationResult;
}

class ProductService {
  // ONLY business logic orchestration
  constructor(
    private repository: IProductRepository,
    private validator: IProductValidator
  ) {}
  
  async createProduct(input: ProductInput): Promise<Product> {
    const validation = this.validator.validate(input);
    if (!validation.success) throw new ValidationError(validation.errors);
    return this.repository.save(input);
  }
}

// ❌ INCORRECT - Multiple responsibilities
class ProductManager {
  async findProduct() { /* data access */ }
  async validateProduct() { /* validation */ }
  async sendEmail() { /* notification */ }
  async renderProduct() { /* UI */ }
  async exportToCSV() { /* reporting */ }
}
```

### Application by Layer

| Layer | Single Responsibility |
|-------|----------------------|
| Component | Render UI for one feature |
| Hook | Manage one piece of state/logic |
| Service | Orchestrate one business process |
| Repository | Persist one entity type |
| Validator | Validate one type of input |

## Open/Closed Principle (OCP)

> "Software entities should be open for extension, but closed for modification."

### Pattern

Use interfaces and inheritance to extend behavior without modifying existing code:

```typescript
// ✅ CORRECT - Extend without modification
interface INormalizer {
  priority: number;
  canHandle(data: unknown): boolean;
  normalize(data: unknown): Promise<NormalizedData | null>;
}

// Add new normalizer without changing existing code
class AIBasedNormalizer implements INormalizer {
  priority = 100;
  canHandle(data: unknown) { return typeof data === 'object'; }
  async normalize(data: unknown) { /* AI logic */ }
}

class RegexNormalizer implements INormalizer {
  priority = 50;
  canHandle(data: unknown) { return typeof data === 'string'; }
  async normalize(data: unknown) { /* Regex logic */ }
}

// NormalizerChain uses any normalizer without modification
class NormalizerChain {
  private normalizers: INormalizer[] = [];
  
  addNormalizer(normalizer: INormalizer) {
    this.normalizers.push(normalizer);
    this.normalizers.sort((a, b) => b.priority - a.priority);
  }
  
  async normalize(data: unknown): Promise<NormalizedData | null> {
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

### Common Extensions

| Scenario | OCP Solution |
|----------|--------------|
| New data source | Add new `IDataSource` implementation |
| New validation rule | Add new `IValidator` implementation |
| New export format | Add new `IExporter` implementation |
| New notification channel | Add new `INotifier` implementation |

## Liskov Substitution Principle (LSP)

> "Subtypes must be substitutable for their base types."

### Pattern

All implementations of an interface must be interchangeable:

```typescript
// ✅ CORRECT - All implementations are substitutable
interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findByCode(code: string): Promise<Product | null>;
  save(product: Product): Promise<Product>;
}

// Can substitute any implementation
class MongoDBProductRepository implements IProductRepository {
  async findById(id: string) { /* MongoDB logic */ }
  async findByCode(code: string) { /* MongoDB logic */ }
  async save(product: Product) { /* MongoDB logic */ }
}

class InMemoryProductRepository implements IProductRepository {
  async findById(id: string) { /* In-memory logic */ }
  async findByCode(code: string) { /* In-memory logic */ }
  async save(product: Product) { /* In-memory logic */ }
}

class IndexedDBProductRepository implements IProductRepository {
  async findById(id: string) { /* IndexedDB logic */ }
  async findByCode(code: string) { /* IndexedDB logic */ }
  async save(product: Product) { /* IndexedDB logic */ }
}

// Service works with ANY repository
async function getProduct(repo: IProductRepository, id: string) {
  return repo.findById(id); // Works with any implementation
}
```

### LSP Violations to Avoid

```typescript
// ❌ INCORRECT - Throws on valid base type operation
class ReadOnlyRepository implements IProductRepository {
  async save(product: Product): Promise<Product> {
    throw new Error('Not supported'); // Violates LSP!
  }
}

// ✅ CORRECT - Use separate interfaces
interface IProductReader {
  findById(id: string): Promise<Product | null>;
}

interface IProductWriter {
  save(product: Product): Promise<Product>;
}

class ReadOnlyRepository implements IProductReader {
  async findById(id: string) { /* ... */ }
  // No save method needed
}
```

## Interface Segregation Principle (ISP)

> "Clients should not be forced to depend on interfaces they don't use."

### Pattern

Create small, focused interfaces instead of large, monolithic ones:

```typescript
// ✅ CORRECT - Segregated interfaces
interface IProductReader {
  findById(id: string): Promise<Product | null>;
  findByCode(code: string): Promise<Product | null>;
  search(query: string): Promise<Product[]>;
}

interface IProductWriter {
  save(product: Product): Promise<Product>;
  update(id: string, data: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
}

interface IProductExporter {
  exportToCSV(): Promise<string>;
  exportToJSON(): Promise<string>;
}

// Components only depend on what they need
class ProductListComponent {
  constructor(private reader: IProductReader) {}
  // Only uses read operations
}

class ProductFormComponent {
  constructor(private writer: IProductWriter) {}
  // Only uses write operations
}

// ❌ INCORRECT - Monolithic interface
interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findByCode(code: string): Promise<Product | null>;
  search(query: string): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  update(id: string, data: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
  exportToCSV(): Promise<string>;
  exportToJSON(): Promise<string>;
  importFromCSV(data: string): Promise<void>;
  syncWithRemote(): Promise<void>;
  // Too many methods - forces clients to depend on unused methods
}
```

### ISP by Layer

| Layer | Interface Segregation |
|-------|----------------------|
| Repository | `IReader`, `IWriter`, `ISearcher` |
| Notification | `IEmailSender`, `ISMSSender`, `IPushNotifier` |
| Auth | `IAuthenticator`, `IAuthorizer`, `ISessionManager` |
| Export | `ICSVExporter`, `IJSONExporter`, `IPDFExporter` |

## Dependency Inversion Principle (DIP)

> "High-level modules should not depend on low-level modules. Both should depend on abstractions."

### Pattern

Depend on interfaces, not concrete implementations:

```typescript
// ✅ CORRECT - Depends on abstractions
class ProductService {
  constructor(
    private repository: IProductRepository,  // Interface
    private validator: IProductValidator,    // Interface
    private notifier: INotifier              // Interface
  ) {}
  
  async createProduct(input: ProductInput): Promise<Product> {
    const validation = this.validator.validate(input);
    if (!validation.success) {
      throw new ValidationError(validation.errors);
    }
    
    const product = await this.repository.save(input);
    await this.notifier.notify('product.created', product);
    
    return product;
  }
}

// ❌ INCORRECT - Depends on concrete implementations
class ProductService {
  constructor(
    private repository: MongoDBProductRepository,  // Concrete!
    private validator: ZodProductValidator,        // Concrete!
    private notifier: EmailNotifier                // Concrete!
  ) {}
}
```

### IoC Container Pattern

```typescript
// Service Container for Dependency Injection
class ServiceContainer {
  private static instances = new Map<string, unknown>();
  private static factories = new Map<string, () => unknown>();

  static registerSingleton<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }

  static resolve<T>(key: string): T {
    if (!this.instances.has(key)) {
      const factory = this.factories.get(key);
      if (!factory) throw new Error(`Service not registered: ${key}`);
      this.instances.set(key, factory());
    }
    return this.instances.get(key) as T;
  }
}

// Registration
ServiceContainer.registerSingleton('ProductRepository', 
  () => new MongoDBProductRepository()
);
ServiceContainer.registerSingleton('ProductService',
  () => new ProductService(
    ServiceContainer.resolve('ProductRepository'),
    ServiceContainer.resolve('ProductValidator'),
    ServiceContainer.resolve('Notifier')
  )
);

// Usage
const service = ServiceContainer.resolve<ProductService>('ProductService');
```

## When to Apply SOLID

### Decision Matrix

| Project Characteristic | SOLID Level |
|----------------------|-------------|
| Prototype/MVP | Minimal - focus on speed |
| Single developer | Basic - key abstractions only |
| Team project | Full - all principles |
| Enterprise/Long-term | Full + IoC Container |
| Microservices | Full per service |

### Start Simple, Refactor Later

```typescript
// Phase 1: Simple function (MVP)
async function getProduct(id: string) {
  return await db.products.findOne({ id });
}

// Phase 2: Class with SRP (Growing project)
class ProductRepository {
  async findById(id: string) {
    return await db.products.findOne({ id });
  }
}

// Phase 3: Interface + Implementation (Team project)
interface IProductRepository {
  findById(id: string): Promise<Product | null>;
}

class MongoDBProductRepository implements IProductRepository {
  async findById(id: string) {
    return await db.products.findOne({ id });
  }
}

// Phase 4: Full DI (Enterprise)
// Use IoC Container as shown above
```

## Checklist for Code Review

- [ ] **SRP**: Does each class/function have ONE responsibility?
- [ ] **OCP**: Can behavior be extended without modification?
- [ ] **LSP**: Are all implementations interchangeable?
- [ ] **ISP**: Are interfaces focused and minimal?
- [ ] **DIP**: Do we depend on abstractions, not implementations?
- [ ] **Appropriate Level**: Is the abstraction level right for project size?

---

> **Note**: SOLID principles are guidelines, not strict rules. Apply them pragmatically based on project needs and team experience.
