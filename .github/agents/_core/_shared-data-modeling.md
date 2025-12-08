# 📊 Patrones de Modelado de Datos - MongoDB y Mongoose

> **Este documento define los patrones de modelado de datos para MongoDB con Mongoose.**
> Los agentes `data-engineer` y `backend-architect` deben seguir estas guías.

---

## 📚 Fundamentos de MongoDB

### Diferencias con SQL

| Concepto SQL | Concepto MongoDB | Notas |
|--------------|------------------|-------|
| Database | Database | Similar |
| Table | Collection | Sin esquema fijo |
| Row | Document | JSON/BSON |
| Column | Field | Dinámico |
| JOIN | Embedding / Reference | Diseño diferente |
| Primary Key | `_id` | Generado automáticamente |

### Cuándo Embedder vs Referenciar

| Embedder (Desnormalizar) | Referenciar (Normalizar) |
|--------------------------|--------------------------|
| Datos accedidos juntos | Datos accedidos independientemente |
| Relación 1:1 o 1:pocos | Relación 1:muchos o muchos:muchos |
| Datos que no cambian frecuentemente | Datos que cambian frecuentemente |
| Tamaño total < 16MB | Documentos grandes |

---

## 🏗️ Estructura de Modelos Mongoose

### Modelo Base

```typescript
// src/lib/db/models/base.model.ts
import mongoose, { Document, Model, Schema } from "mongoose";

// Interfaz base para todos los documentos
export interface BaseDocument extends Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Opciones base para todos los schemas
export const baseSchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
  },
};

// Función helper para crear schemas
export function createSchema<T>(
  definition: mongoose.SchemaDefinition<T>,
  options?: mongoose.SchemaOptions
): Schema<T> {
  return new Schema<T>(definition, {
    ...baseSchemaOptions,
    ...options,
  });
}
```

### Modelo de Usuario (Ejemplo Completo)

```typescript
// src/lib/db/models/user.model.ts
import mongoose, { Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { createSchema, BaseDocument } from "./base.model";

// Interfaz del documento
export interface IUser {
  email: string;
  password: string;
  name: string;
  role: "user" | "admin" | "moderator";
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  preferences: {
    theme: "light" | "dark" | "system";
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
}

// Interfaz del documento con métodos de Mongoose
export interface IUserDocument extends IUser, BaseDocument {
  fullName: string; // Virtual
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Interfaz del modelo con métodos estáticos
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findActiveUsers(): Promise<IUserDocument[]>;
}

// Definición del schema
const userSchema = createSchema<IUser>({
  email: {
    type: String,
    required: [true, "El email es requerido"],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v: string) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
      message: "Formato de email inválido",
    },
    index: true,
  },
  password: {
    type: String,
    required: [true, "La contraseña es requerida"],
    minlength: [8, "La contraseña debe tener al menos 8 caracteres"],
    select: false, // No incluir por defecto en queries
  },
  name: {
    type: String,
    required: [true, "El nombre es requerido"],
    trim: true,
    minlength: [2, "El nombre debe tener al menos 2 caracteres"],
    maxlength: [100, "El nombre no puede exceder 100 caracteres"],
  },
  role: {
    type: String,
    enum: {
      values: ["user", "admin", "moderator"],
      message: "Rol inválido: {VALUE}",
    },
    default: "user",
    index: true,
  },
  avatar: {
    type: String,
    validate: {
      validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
      message: "URL de avatar inválida",
    },
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastLoginAt: Date,
  preferences: {
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    language: {
      type: String,
      default: "es",
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
  },
});

// Índices compuestos
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, createdAt: -1 });

// Virtual: fullName
userSchema.virtual("fullName").get(function (this: IUserDocument) {
  return this.name;
});

// Pre-save hook: hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Método de instancia: comparar contraseña
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método estático: buscar por email
userSchema.statics.findByEmail = function (
  email: string
): Promise<IUserDocument | null> {
  return this.findOne({ email: email.toLowerCase() });
};

// Método estático: usuarios activos
userSchema.statics.findActiveUsers = function (): Promise<IUserDocument[]> {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

// Exportar modelo
export const UserModel =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUserDocument, IUserModel>("User", userSchema);
```

---

## 🔗 Patrones de Relaciones

### 1. Embedding (One-to-Few)

```typescript
// Ideal para: direcciones de usuario, comentarios en blog post
// Los datos siempre se acceden juntos

interface IOrder {
  _id: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  total: number;
  status: "pending" | "paid" | "shipped" | "delivered";
}

const orderSchema = new Schema<IOrder>({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  }],
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "paid", "shipped", "delivered"],
    default: "pending",
    index: true,
  },
}, { timestamps: true });
```

### 2. Referencing (One-to-Many)

```typescript
// Ideal para: posts de un blog, productos de una categoría
// Los datos se acceden independientemente

// Category model
interface ICategory {
  name: string;
  slug: string;
  description?: string;
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
});

// Product model con referencia a Category
interface IProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  categoryId: mongoose.Types.ObjectId;
  images: string[];
  stock: number;
  isActive: boolean;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: true,
    index: true,
  },
  images: [String],
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

// Populate en queries
async function getProductWithCategory(productId: string) {
  return ProductModel.findById(productId)
    .populate("categoryId", "name slug")
    .lean();
}
```

### 3. Two-Way Referencing (Many-to-Many)

```typescript
// Ideal para: usuarios y roles, productos y tags

// Tag model
interface ITag {
  name: string;
  slug: string;
}

// Product con array de referencias a Tags
interface IProduct {
  name: string;
  tags: mongoose.Types.ObjectId[];
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  tags: [{
    type: Schema.Types.ObjectId,
    ref: "Tag",
  }],
});

// Virtual populate inverso en Tag
const tagSchema = new Schema<ITag>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
});

tagSchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "tags",
});
```

---

## 📈 Índices y Performance

### Tipos de Índices

```typescript
// 1. Índice simple
userSchema.index({ email: 1 });

// 2. Índice compuesto (orden importa)
userSchema.index({ status: 1, createdAt: -1 });

// 3. Índice único
userSchema.index({ email: 1 }, { unique: true });

// 4. Índice sparse (ignora documentos sin el campo)
userSchema.index({ referralCode: 1 }, { sparse: true });

// 5. Índice parcial (solo documentos que cumplen condición)
userSchema.index(
  { email: 1 },
  { 
    partialFilterExpression: { isActive: true } 
  }
);

// 6. Índice de texto para búsqueda full-text
productSchema.index(
  { name: "text", description: "text" },
  { 
    weights: { name: 10, description: 5 },
    default_language: "spanish"
  }
);

// 7. Índice geoespacial
storeSchema.index({ location: "2dsphere" });

// 8. TTL Index (auto-eliminación)
sessionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 86400 } // 24 horas
);
```

### Estrategias de Indexación

```typescript
// Analizar queries frecuentes
// Regla ESR: Equality, Sort, Range

// Query: { status: "active", createdAt: { $gte: lastWeek } } sorted by createdAt desc
// Índice óptimo:
orderSchema.index({ status: 1, createdAt: -1 });

// Covered query (todos los campos en el índice)
userSchema.index({ email: 1, name: 1, role: 1 });
// Esta query no toca el documento:
await UserModel.find({ email: "test@test.com" })
  .select("name role -_id")
  .lean();
```

---

## 🔄 Aggregation Pipelines

### Pipeline Básico

```typescript
// Ventas por categoría del último mes
async function getSalesByCategory() {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  return OrderModel.aggregate([
    // Stage 1: Filtrar por fecha
    {
      $match: {
        createdAt: { $gte: lastMonth },
        status: "delivered",
      },
    },
    // Stage 2: Desagregar items
    { $unwind: "$items" },
    // Stage 3: Lookup categoría del producto
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    // Stage 4: Agrupar por categoría
    {
      $group: {
        _id: "$product.categoryId",
        totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        itemsSold: { $sum: "$items.quantity" },
        orderCount: { $addToSet: "$_id" },
      },
    },
    // Stage 5: Calcular métricas
    {
      $project: {
        categoryId: "$_id",
        totalSales: 1,
        itemsSold: 1,
        orderCount: { $size: "$orderCount" },
        avgOrderValue: { $divide: ["$totalSales", { $size: "$orderCount" }] },
      },
    },
    // Stage 6: Lookup nombre de categoría
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    // Stage 7: Formatear resultado
    {
      $project: {
        _id: 0,
        category: "$category.name",
        totalSales: { $round: ["$totalSales", 2] },
        itemsSold: 1,
        orderCount: 1,
        avgOrderValue: { $round: ["$avgOrderValue", 2] },
      },
    },
    // Stage 8: Ordenar por ventas
    { $sort: { totalSales: -1 } },
  ]);
}
```

### Pipeline con Facets (Múltiples Resultados)

```typescript
// Dashboard de productos con métricas y paginación
async function getProductsDashboard(page: number, limit: number) {
  const skip = (page - 1) * limit;

  return ProductModel.aggregate([
    // Facets para múltiples resultados en una query
    {
      $facet: {
        // Resultado 1: Lista paginada
        products: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "categories",
              localField: "categoryId",
              foreignField: "_id",
              as: "category",
            },
          },
          { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              name: 1,
              price: 1,
              stock: 1,
              category: "$category.name",
              createdAt: 1,
            },
          },
        ],
        // Resultado 2: Conteo total
        totalCount: [{ $count: "count" }],
        // Resultado 3: Estadísticas
        stats: [
          {
            $group: {
              _id: null,
              avgPrice: { $avg: "$price" },
              totalStock: { $sum: "$stock" },
              outOfStock: {
                $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] },
              },
            },
          },
        ],
        // Resultado 4: Por categoría
        byCategory: [
          { $group: { _id: "$categoryId", count: { $sum: 1 } } },
          {
            $lookup: {
              from: "categories",
              localField: "_id",
              foreignField: "_id",
              as: "category",
            },
          },
          { $unwind: "$category" },
          { $project: { name: "$category.name", count: 1, _id: 0 } },
          { $sort: { count: -1 } },
        ],
      },
    },
    // Formatear respuesta final
    {
      $project: {
        products: 1,
        pagination: {
          total: { $arrayElemAt: ["$totalCount.count", 0] },
          page: { $literal: page },
          limit: { $literal: limit },
          pages: {
            $ceil: {
              $divide: [
                { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
                limit,
              ],
            },
          },
        },
        stats: { $arrayElemAt: ["$stats", 0] },
        byCategory: 1,
      },
    },
  ]);
}
```

---

## 🔒 Validaciones y Middleware

### Validadores Personalizados

```typescript
// Validador asíncrono para unicidad
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    validate: {
      validator: async function (email: string) {
        // Solo validar si el email fue modificado
        if (!this.isModified("email")) return true;
        
        const count = await mongoose.models.User.countDocuments({ email });
        return count === 0;
      },
      message: "El email ya está registrado",
    },
  },
});

// Validador con dependencia de otros campos
const productSchema = new Schema({
  price: { type: Number, required: true },
  salePrice: {
    type: Number,
    validate: {
      validator: function (this: IProduct, salePrice: number) {
        return !salePrice || salePrice < this.price;
      },
      message: "El precio de oferta debe ser menor al precio regular",
    },
  },
});
```

### Middleware (Hooks)

```typescript
// Pre-save: Generar slug automáticamente
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Pre-remove: Limpiar referencias
categorySchema.pre("deleteOne", { document: true }, async function (next) {
  // Verificar si hay productos en la categoría
  const count = await mongoose.models.Product.countDocuments({
    categoryId: this._id,
  });
  
  if (count > 0) {
    throw new Error("No se puede eliminar una categoría con productos");
  }
  next();
});

// Post-save: Trigger eventos
orderSchema.post("save", async function (doc) {
  if (doc.status === "paid") {
    // Emitir evento para procesamiento
    await eventBus.emit("order.paid", { orderId: doc._id });
  }
});

// Pre-find: Filtrar eliminados lógicamente
userSchema.pre(/^find/, function (next) {
  // Solo aplicar si no se especifica explícitamente
  if (!this.getQuery().hasOwnProperty("isDeleted")) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});
```

---

## 📋 Checklist de Modelado

### Al crear un nuevo modelo:

- [ ] ¿Definí interfaces TypeScript para el documento?
- [ ] ¿Los campos requeridos tienen validación?
- [ ] ¿Los campos string tienen trim y límites de longitud?
- [ ] ¿Los campos numéricos tienen min/max?
- [ ] ¿Los enums tienen valores y mensaje de error?
- [ ] ¿Creé índices para campos de búsqueda frecuente?
- [ ] ¿El índice compuesto sigue la regla ESR?
- [ ] ¿Configuré timestamps automáticos?
- [ ] ¿El campo password tiene `select: false`?
- [ ] ¿Transformé `_id` a `id` en `toJSON`?

### Al crear relaciones:

- [ ] ¿Embedding o referencing es la mejor opción?
- [ ] ¿Agregué índices en los campos de referencia?
- [ ] ¿Configuré populate con select para evitar over-fetching?
- [ ] ¿Implementé cascade delete si es necesario?

### Performance:

- [ ] ¿Las queries frecuentes tienen índices?
- [ ] ¿Usé `.lean()` para queries de solo lectura?
- [ ] ¿Limité los campos con `.select()`?
- [ ] ¿Implementé paginación?
- [ ] ¿Las aggregations usan $match al inicio?

---

> **Referencia:** Consulta la [documentación oficial de Mongoose](https://mongoosejs.com/docs/) para más detalles.
