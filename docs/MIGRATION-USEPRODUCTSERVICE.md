# Migración: obtenerOCrearProducto → useProductService

## ⚠️ BREAKING CHANGE (planificado para v2.0)

Las funciones legacy de `src/services/productos.ts` serán eliminadas. Usar `useProductService()` hook en su lugar.

---

## 🔄 Tabla de Equivalencias

| Legacy (❌ Deprecated) | Nuevo (✅ Recomendado) |
|------------------------|------------------------|
| `obtenerOCrearProducto(ean)` | `useProductService().scanProduct(barcode)` |
| `obtenerProductoCompleto(id)` | `useProductService().getProductById(id)` |
| `buscarProductosBase(term)` | `useProductService().searchProducts(term)` |
| `obtenerVariantesDeBase(id)` | `useProductService().getVariants(id)` |
| `crearProductoManual(...)` | `useProductService().createManualProduct(...)` |

---

## 📖 Ejemplos de Migración

### Antes (❌ Legacy)

```typescript
import { obtenerOCrearProducto } from "@/services/productos";

function MyComponent() {
  const [loading, setLoading] = useState(false);
  
  const handleScan = async (barcode: string) => {
    setLoading(true);
    const producto = await obtenerOCrearProducto(barcode);
    setLoading(false);
    
    if (producto) {
      console.log('Producto:', producto);
    }
  };
  
  return <button onClick={() => handleScan('123')}>Scan</button>;
}
```

### Después (✅ Nuevo)

```typescript
import { useProductService } from "@/hooks/useProductService";

function MyComponent() {
  const { scanProduct, loading, error } = useProductService();
  
  const handleScan = async (barcode: string) => {
    const result = await scanProduct(barcode);
    
    if (result.success) {
      console.log('Producto:', result.producto);
    } else {
      console.error('Error:', result.error);
    }
  };
  
  return (
    <>
      <button onClick={() => handleScan('123')} disabled={loading}>
        {loading ? 'Loading...' : 'Scan'}
      </button>
      {error && <p>{error}</p>}
    </>
  );
}
```

---

## ✅ Ventajas del Nuevo Hook

1. **Estado de carga integrado** - No más `useState(loading)` manual
2. **Manejo de errores unificado** - Estado `error` incluido
3. **Tipado fuerte** - TypeScript con inferencia completa
4. **Testeable** - Fácil de mockear en tests unitarios
5. **Consistente** - Un solo patrón para toda la app
6. **Optimizado** - Service memoizado, evita re-creaciones

---

## 🧪 Testing con useProductService

```typescript
import { renderHook, act } from '@testing-library/react';
import { useProductService } from '@/hooks/useProductService';

test('debe escanear producto', async () => {
  const { result } = renderHook(() => useProductService());
  
  let response: any;
  await act(async () => {
    response = await result.current.scanProduct('123');
  });
  
  expect(response.success).toBe(true);
  expect(response.producto).toBeDefined();
});
```

---

## 📅 Cronograma de Migración

- **v1.2 (actual)**: Hook disponible, warnings en funciones legacy
- **v1.5**: Migración de componentes core completada
- **v1.8**: Migración de todos los componentes
- **v2.0**: Funciones legacy eliminadas

---

## 🆘 Soporte

- **Issues**: GitHub con label `migration`
- **Docs**: [SOLID Principles Guide](./SOLID-PRINCIPLES.md)
- **Tests**: Ver `src/hooks/__tests__/useProductService.test.ts`
