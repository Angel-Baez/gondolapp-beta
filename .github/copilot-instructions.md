# GondolApp AI Coding Instructions

## Architecture Overview

**PWA de Gestión de Inventario** - Offline-first app for supermarket inventory management and expiration control.

### Core Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Dexie.js** for IndexedDB (offline storage)
- **Zustand** for UI state (scanner visibility, active view)
- **React Query** + `dexie-react-hooks` for reactive data
- **html5-qrcode** for barcode scanning
- **Open Food Facts API** for product info lookup

### Data Flow Architecture

```
User Scan → BarcodeScanner → obtenerOCrearProducto() → {
  1. Check local DB (productosVariantes by codigoBarras)
  2. If not found → fetch from Open Food Facts API
  3. Create ProductoBase + ProductoVariante
  4. Save to IndexedDB
} → Add to ItemReposicion OR ItemVencimiento
```

## Database Schema (IndexedDB via Dexie)

**4 Tables** defined in `lib/db.ts`:

```typescript
// ProductoBase: Generic product (e.g., "Coca-Cola")
productosBase: "id, nombre, categoria, marca, createdAt";

// ProductoVariante: Specific SKU with barcode (e.g., "Coca-Cola 1L")
productosVariantes: "id, productoBaseId, codigoBarras, nombreCompleto";

// ItemReposicion: Restock list items
itemsReposicion: "id, varianteId, repuesto, sinStock, agregadoAt";

// ItemVencimiento: Expiry tracking items
itemsVencimiento: "id, varianteId, fechaVencimiento, alertaNivel, agregadoAt";
```

**Key Pattern**: One ProductoBase has many ProductoVariantes (one-to-many). Each item references a variante ID.

## Critical Patterns & Conventions

### 1. Reactive Data with `useLiveQuery`

**Pattern**: All DB queries use Dexie's `useLiveQuery` for auto-updates when IndexedDB changes.

```typescript
// From lib/hooks/useReposicion.ts
const items = useLiveQuery(async () => {
  const itemsReposicion = await db.itemsReposicion
    .orderBy("agregadoAt")
    .reverse()
    .toArray();

  // IMPORTANT: Always join with product data
  return await Promise.all(
    itemsReposicion.map(async (item) => {
      const producto = await obtenerProductoCompleto(item.varianteId);
      return { ...item, variante: producto?.variante, base: producto?.base };
    })
  );
});
```

**Why**: UI auto-updates when data changes. Always fetch related product data for display.

### 2. Product Lookup Chain (Cache-First)

**Location**: `lib/services/productos.ts` → `obtenerOCrearProducto(ean)`

```typescript
// STEP 1: Check local cache first
const varianteExistente = await db.productosVariantes
  .where("codigoBarras")
  .equals(ean)
  .first();

if (varianteExistente) return { base, variante };

// STEP 2: API fallback (Open Food Facts)
const dataOFF = await buscarProductoPorEAN(ean);

// STEP 3: Create and save to local DB
await db.productosBase.add(productoBase);
await db.productosVariantes.add(variante);
```

**Convention**: Never call API if product exists locally. Always create both base + variante together.

### 3. Alert Level Auto-Calculation

**Location**: `lib/db.ts` → `calcularNivelAlerta(fechaVencimiento)`

```typescript
// Auto-called on insert/update of ItemVencimiento
const diasRestantes = Math.floor((fechaVenc - hoy) / (1000 * 60 * 60 * 24));

if (diasRestantes <= 15) return "critico"; // Red
if (diasRestantes <= 30) return "advertencia"; // Yellow
if (diasRestantes <= 60) return "precaucion"; // Orange
return "normal"; // Gray
```

**Pattern**: `alertaNivel` is denormalized and stored. Recalculate on date changes.

### 4. Zustand for UI State ONLY

**Location**: `lib/store/app.ts`

```typescript
// DO: Use for scanner visibility, active tab
const { mostrarScanner, activeView, abrirScanner } = useAppStore();

// DON'T: Store data that belongs in IndexedDB
// DON'T: Duplicate data from Dexie queries
```

**Persisted State**: `activeView` and `modoEscaneo` persist to localStorage via Zustand middleware.

### 5. React Query Mutations for Side Effects

**Pattern**: Wrap DB writes in `useMutation` for loading states and cache invalidation.

```typescript
const agregarItem = useMutation({
  mutationFn: async ({ varianteId, cantidad }) => {
    // Check if exists, update quantity OR create new
    const existente = await db.itemsReposicion
      .where("varianteId")
      .equals(varianteId)
      .and((item) => item.repuesto === false)
      .first();

    if (existente) {
      await db.itemsReposicion.update(existente.id, {
        cantidad: existente.cantidad + cantidad,
        actualizadoAt: new Date(),
      });
    } else {
      await db.itemsReposicion.add(nuevoItem);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["reposicion"] });
  },
});
```

**Why**: Prevents duplicate items. Always check existence before inserting.

## Component Patterns

### Grouping & Collapsible Cards

**Location**: `app/page.tsx` → `groupedReposicion`

```typescript
// Group items by ProductoBase name
const groupedReposicion = useMemo(() => {
  const groups = new Map<string, typeof pendientes>();
  pendientes.forEach((item) => {
    const baseName = item.base?.nombre || "Producto sin nombre";
    if (!groups.has(baseName)) groups.set(baseName, []);
    groups.get(baseName)!.push(item);
  });
  return Array.from(groups.entries());
}, [itemsReposicion, expandedProducts]);
```

**UI Pattern**: Collapsible cards with chevron icons. Expansion state in local useState.

### Modal Pattern

**Convention**: Modals are inline JSX at bottom of page, controlled by boolean state.

```tsx
{
  showQuantityModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Modal content */}
    </div>
  );
}
```

**Trigger Flow**: `handleScan` → set `currentVarianteId` → open modal → user confirms → mutate + close modal.

## Development Workflow

### Commands

```bash
npm run dev     # Next.js dev server on :3000
npm run build   # Production build
npm run start   # Production server
npm run lint    # ESLint check
```

### PWA Configuration

**Location**: `next.config.mjs`

- **Development**: PWA disabled (`disable: process.env.NODE_ENV === "development"`)
- **Production**: Service worker caches API responses (NetworkFirst) and images (CacheFirst)
- **HTTPS Required**: Camera access requires HTTPS in production

### Debugging Barcode Scanner

**Location**: `components/BarcodeScanner.tsx`

**Common Issues**:

1. **Permission Denied** → Check browser camera permissions
2. **Not Found** → Verify device has camera
3. **Not Readable** → Another app is using camera
4. **HTTPS Error** → Must use HTTPS or localhost for camera access

**Pattern**: Scanner has manual input fallback (`showManualInput` toggle).

## Code Style Conventions

### Tailwind Classes

- **Primary Actions**: `bg-cyan-500 hover:bg-cyan-600` (cyan = reposición)
- **Alerts/Expiry**: `bg-red-500 hover:bg-red-600` (red = vencimientos)
- **Destructive**: `bg-red-100 text-red-600` (delete buttons)
- **Shadows**: `shadow-xl` for cards, `shadow-2xl` for main container

### TypeScript

- **UUIDs**: Always use `v4()` from `uuid` package
- **Dates**: Store as `Date` objects in Dexie, not strings
- **Optional Chaining**: Use `?.` for nested data (`item.variante?.nombreCompleto`)

### File Organization

```
lib/
  db.ts                    # Dexie schema + utility functions
  services/
    productos.ts           # Product CRUD + lookup logic
    openfoodfacts.ts       # External API integration
  hooks/
    useReposicion.ts       # Restock list logic
    useVencimientos.ts     # Expiry tracking logic
  store/
    app.ts                 # UI state (Zustand)
```

## API Integration (Open Food Facts)

**Endpoint**: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`

**Response Parsing** (`lib/services/openfoodfacts.ts`):

```typescript
// Priority: Spanish name → Generic name → Fallback
nombre: product.product_name_es ||
  product.product_name ||
  "Producto sin nombre";

// Split multiple brands/categories
marca: product.brands?.split(",")[0]?.trim();
categoria: product.categories?.split(",")[0]?.trim();

// Image URL priority
imagen: product.image_front_url || product.image_url;
```

**User-Agent**: Always send `"GondolApp/1.0"` header.

## Testing Checklist

When adding features:

- [ ] Works offline (check IndexedDB persistence)
- [ ] Scanner handles camera errors gracefully
- [ ] API failures don't crash app (null checks)
- [ ] Dates use `calcularNivelAlerta()` for expiry items
- [ ] Mutations invalidate React Query cache
- [ ] UI updates reactively via `useLiveQuery`
- [ ] Mobile: Touch targets ≥ 44x44px
- [ ] Tailwind: Use existing color patterns (cyan/red)

## Common Tasks

### Add New Product Field

1. Update interfaces in `lib/db.ts`
2. Add to Dexie schema indexes (increment version)
3. Update `buscarProductoPorEAN` parsing in `openfoodfacts.ts`
4. Update `obtenerOCrearProducto` to map field
5. Display in UI component

### Add New List Type

1. Create new interface in `lib/db.ts` (e.g., `ItemPedido`)
2. Add table to Dexie schema
3. Create custom hook in `lib/hooks/` (follow `useReposicion` pattern)
4. Add view toggle in `app/page.tsx`
5. Create UI section with grouping/filtering

### Modify Alert Thresholds

Edit `calcularNivelAlerta()` in `lib/db.ts`. Run migration to recalculate existing items via `useVencimientos().actualizarAlertas`.

## Key Gotchas

❌ **Don't**: Query Dexie outside of `useLiveQuery` or mutations (causes stale data)  
✅ **Do**: Use `useLiveQuery` for all reads, `useMutation` for all writes

❌ **Don't**: Store IndexedDB data in Zustand (duplication)  
✅ **Do**: Use Zustand only for ephemeral UI state

❌ **Don't**: Assume API always succeeds  
✅ **Do**: Handle `null` returns from `obtenerOCrearProducto()`

❌ **Don't**: Use `Date.toISOString()` for display  
✅ **Do**: Use `toLocaleDateString("es-ES")` for Spanish formatting

---

**Quick Reference**: See full technical spec in README.md for UI/UX patterns and color system details.
