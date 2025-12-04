# Shared Data Modeling Patterns

> Universal data modeling patterns for MERN + Next.js + TypeScript projects.
> Data engineers and backend architects should reference this document.

## Database Options

### When to Use Each Database

| Database | Best For | Avoid When |
|----------|----------|------------|
| **MongoDB** | Flexible schemas, documents, rapid prototyping | Complex relations, ACID transactions |
| **PostgreSQL** | Complex relations, transactions, reporting | Simple documents, rapid schema changes |
| **Redis** | Caching, sessions, rate limiting, queues | Primary data storage |
| **IndexedDB** | Offline-first PWA, client-side cache | Server-side, large datasets |

### Hybrid Approach (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              IndexedDB (Dexie.js)                    │    │
│  │  • Offline storage                                   │    │
│  │  • Cache for frequently accessed data                │    │
│  │  • Pending sync queue                                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │ Sync via API
┌─────────────────────────▼───────────────────────────────────┐
│                     SERVER (API)                             │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │     MongoDB     │  │   PostgreSQL │  │    Redis     │    │
│  │  • Documents    │  │  • Relations │  │  • Cache     │    │
│  │  • Flexible     │  │  • Reports   │  │  • Sessions  │    │
│  └─────────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Schema Design Patterns

### 1. Document Design (MongoDB)

#### Embedding vs Referencing

| Pattern | When to Use | Example |
|---------|-------------|---------|
| **Embed** | Data always accessed together, 1:few relation | Order with line items |
| **Reference** | Data accessed independently, 1:many/many:many | Users and products |
| **Hybrid** | Some data embedded, some referenced | Product with embedded variants, referenced categories |

```typescript
// Embedded Pattern - Order with Items
interface Order {
  _id: ObjectId;
  customerId: ObjectId;      // Reference to customer
  items: OrderItem[];        // Embedded items
  shippingAddress: Address;  // Embedded address
  createdAt: Date;
}

// Referenced Pattern - Product with Category
interface Product {
  _id: ObjectId;
  name: string;
  categoryId: ObjectId;  // Reference
  brandId: ObjectId;     // Reference
  variants: Variant[];   // Embedded
}
```

#### Denormalization Strategies

```typescript
// Normalized (Many queries, always consistent)
interface Product {
  _id: ObjectId;
  name: string;
  categoryId: ObjectId;
}
// Requires JOIN to get category name

// Denormalized (Fewer queries, may become stale)
interface Product {
  _id: ObjectId;
  name: string;
  categoryId: ObjectId;
  categoryName: string;  // Denormalized copy
}
// No JOIN needed, but categoryName may be outdated
```

### 2. Offline-First Pattern (IndexedDB)

#### Schema Definition with Dexie.js

```typescript
import Dexie, { Table } from 'dexie';

interface Product {
  id: string;
  name: string;
  categoryId: string;
  createdAt: Date;
  syncedAt?: Date;  // For sync tracking
}

interface SyncQueue {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  data: unknown;
  timestamp: Date;
  retries: number;
}

class AppDatabase extends Dexie {
  products!: Table<Product, string>;
  syncQueue!: Table<SyncQueue, string>;

  constructor() {
    super('AppDatabase');
    
    this.version(1).stores({
      products: 'id, name, categoryId, createdAt, syncedAt',
      syncQueue: 'id, operation, table, timestamp'
    });
  }
}

export const db = new AppDatabase();
```

#### Versioned Migrations

```typescript
class AppDatabase extends Dexie {
  constructor() {
    super('AppDatabase');
    
    // Version 1: Initial schema
    this.version(1).stores({
      products: 'id, name, categoryId'
    });
    
    // Version 2: Add syncedAt field
    this.version(2).stores({
      products: 'id, name, categoryId, syncedAt'
    }).upgrade(tx => {
      return tx.table('products').toCollection().modify(product => {
        product.syncedAt = null;
      });
    });
    
    // Version 3: Add compound index
    this.version(3).stores({
      products: 'id, name, categoryId, syncedAt, [categoryId+createdAt]'
    });
  }
}
```

### 3. TypeScript Schema Definition

#### Zod for Runtime Validation

```typescript
import { z } from 'zod';

// Define schema with Zod
const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
  tags: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date().optional()
});

// Infer TypeScript type from schema
type Product = z.infer<typeof ProductSchema>;

// Use for validation
function validateProduct(data: unknown): Product {
  return ProductSchema.parse(data);
}

// Partial for updates
const ProductUpdateSchema = ProductSchema.partial().omit({ id: true, createdAt: true });
type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
```

## Index Design

### MongoDB Indexes

```javascript
// Single field index
db.products.createIndex({ "name": 1 });

// Compound index (query both fields together)
db.products.createIndex({ "categoryId": 1, "createdAt": -1 });

// Text index (full-text search)
db.products.createIndex({ "name": "text", "description": "text" });

// Unique index
db.products.createIndex({ "sku": 1 }, { unique: true });

// Sparse index (excludes null values)
db.products.createIndex({ "externalId": 1 }, { sparse: true });

// TTL index (auto-delete after time)
db.sessions.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 86400 });
```

### IndexedDB Indexes (Dexie)

```typescript
// Dexie index syntax
this.version(1).stores({
  // Single field indexes
  products: 'id, name, categoryId, createdAt',
  
  // Compound index
  products: 'id, name, [categoryId+createdAt]',
  
  // Multi-entry index (for arrays)
  products: 'id, name, *tags',
  
  // Unique index (primary key is always unique)
  products: '&id, name, categoryId'
});
```

### Index Selection Guide

| Query Pattern | Index Type |
|---------------|------------|
| Exact match on one field | Single field index |
| Range query on one field | Single field index |
| Query two fields together | Compound index |
| Full-text search | Text index |
| Array field queries | Multi-entry index |
| Enforce uniqueness | Unique index |
| Auto-cleanup old data | TTL index |

## Common Data Models

### User Model

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  roles: string[];
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
  };
  language: string;
}
```

### Product Model (E-commerce)

```typescript
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brandId?: string;
  variants: ProductVariant[];
  images: ProductImage[];
  seo: SEOMetadata;
  status: 'draft' | 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

interface ProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  attributes: Record<string, string>;
}
```

### Order Model

```typescript
interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
```

### Inventory Model (PWA/Retail)

```typescript
interface InventoryItem {
  id: string;
  productId: string;
  variantId: string;
  locationId: string;
  quantity: number;
  minQuantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastCountAt?: Date;
  expiryDate?: Date;
  batchNumber?: string;
  updatedAt: Date;
}

interface ExpiryTracking {
  id: string;
  productId: string;
  variantId: string;
  expiryDate: Date;
  quantity: number;
  alertLevel: 'normal' | 'warning' | 'critical';
  locationId: string;
  createdAt: Date;
}
```

## Data Sync Patterns

### Offline Sync Queue

```typescript
interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  recordId: string;
  data: unknown;
  timestamp: Date;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retries: number;
  lastError?: string;
}

class SyncService {
  async queueOperation(op: Omit<SyncOperation, 'id' | 'status' | 'retries'>) {
    await db.syncQueue.add({
      ...op,
      id: crypto.randomUUID(),
      status: 'pending',
      retries: 0
    });
    
    if (navigator.onLine) {
      this.processQueue();
    }
  }
  
  async processQueue() {
    const pending = await db.syncQueue
      .where('status').equals('pending')
      .toArray();
    
    for (const op of pending) {
      try {
        await this.syncOperation(op);
        await db.syncQueue.update(op.id, { status: 'completed' });
      } catch (error) {
        await db.syncQueue.update(op.id, {
          status: 'failed',
          retries: op.retries + 1,
          lastError: error.message
        });
      }
    }
  }
}
```

### Conflict Resolution Strategies

| Strategy | Description | Use When |
|----------|-------------|----------|
| **Last Write Wins** | Most recent timestamp wins | Non-critical data |
| **First Write Wins** | First write preserved | Immutable records |
| **Merge** | Combine changes field by field | Collaborative editing |
| **Manual** | Present conflict to user | Critical data |

## Schema Documentation Template

```markdown
## Collection: products

### Purpose
Store product information for the catalog.

### Schema
| Field | Type | Required | Index | Description |
|-------|------|----------|-------|-------------|
| id | UUID | Yes | PK | Unique identifier |
| name | String(200) | Yes | text | Product name |
| categoryId | UUID | Yes | Yes | Category reference |
| price | Decimal | Yes | No | Current price |
| createdAt | DateTime | Yes | Yes | Creation timestamp |

### Indexes
| Name | Fields | Type | Purpose |
|------|--------|------|---------|
| pk | id | unique | Primary key |
| idx_category | categoryId, createdAt | compound | Category listing |
| idx_search | name, description | text | Full-text search |

### Relations
- **categoryId** → categories.id (many-to-one)
- products → orderItems.productId (one-to-many)

### Access Patterns
1. Get product by ID: `findById(id)`
2. List by category: `findByCategory(categoryId, page, limit)`
3. Search by name: `search(query, limit)`
```

---

> **Note**: Adapt these patterns to your specific project needs. The right model depends on access patterns, scale, and consistency requirements.
