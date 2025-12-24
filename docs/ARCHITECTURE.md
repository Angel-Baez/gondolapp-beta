# Arquitectura de Acceso a Datos - gondolapp-beta

## 🎯 Resumen

Esta aplicación usa **arquitectura en capas** para el acceso a datos:

```
┌─────────────────────────────────────────┐
│  UI Layer (Components/Hooks)            │
│  ↓ usa                                   │
│  Business Logic (Services/Stores)       │
│  ↓ usa                                   │
│  Data Access Layer (dbService)          │ ← ⭐ Punto de entrada único
│  ↓ llama a                               │
│  Persistence Layer (Dexie/IndexedDB)    │
└─────────────────────────────────────────┘

Exception: Repository Pattern (Clean Architecture)
┌─────────────────────────────────────────┐
│  Domain Layer (Use Cases)                │
│  ↓ usa                                   │
│  Repository Interface (IProductRepo)     │
│  ↓ implementado por                      │
│  IndexedDBProductRepository              │
│  ↓ accede a                              │
│  _internalDb (directo a Dexie)          │ ← ⚠️ Uso justificado
└─────────────────────────────────────────┘
```

## ✅ Uso Correcto

### Para TODA la aplicación (99% casos):

```typescript
import { dbService } from '@/lib/db';

// ✅ Correcto
const productos = await dbService.getProductosBase();
const variante = await dbService.getVarianteByBarcode('123');
await dbService.addItemReposicion(item);
```

### Para Repository Pattern SOLAMENTE:

```typescript
// SOLO en src/core/repositories/*
import { _internalDb as db } from '@/lib/db';

// ✅ Correcto - Repository necesita acceso completo
export class IndexedDBProductRepository implements IProductRepository {
  async findByBarcode(barcode: string) {
    return await db.productosVariantes
      .where("codigoBarras")
      .equals(barcode)
      .first();
  }
}
```

## ❌ Uso Incorrecto (Deprecated)

```typescript
// ❌ NO HACER - Lanza advertencias
import { __unsafeDirectDbAccess as db } from '@/lib/db';

// ❌ NO HACER - Acceso directo
const items = await db.itemsReposicion.toArray();
```

## 🏗️ Principios de Arquitectura

### 1. Single Responsibility Principle (SRP)
- **dbService**: Solo maneja acceso a datos
- **Stores (Zustand)**: Solo maneja estado de UI y lógica de negocio
- **Components**: Solo maneja presentación

### 2. Dependency Inversion Principle (DIP)
- Los componentes dependen de `dbService` (abstracción), no de Dexie (implementación)
- Los repositories implementan interfaces abstractas (`IProductRepository`)

### 3. Open/Closed Principle (OCP)
- Agregar nuevos métodos a `dbService` no rompe código existente
- Los repositories pueden ser intercambiados sin cambiar dependientes

### 4. Interface Segregation Principle (ISP)
- `dbService` expone solo los métodos necesarios
- No expone toda la API de Dexie (evita uso indebido)

### 5. Liskov Substitution Principle (LSP)
- Cualquier implementación de `IProductRepository` puede ser usada
- `IndexedDBProductRepository` puede ser reemplazado por `MongoProductRepository`

## 🔄 Flujo de Datos

### Lectura (Query):
```
Component → Hook → Store/Service → dbService → Dexie → IndexedDB
```

### Escritura (Mutation):
```
Component → Hook → Store/Service → dbService → Dexie → IndexedDB
                                      ↓
                                  Validation
                                  Logging
                                  Error Handling
```

### Repository Pattern:
```
Domain Use Case → Repository Interface → IndexedDBProductRepository → _internalDb → Dexie
```

## 📊 Estado Actual

| Capa | Migración | Estado |
|------|-----------|--------|
| Components | 100% | ✅ |
| Hooks | 100% | ✅ |
| Services | 100% | ✅ |
| Stores | 100% | ✅ |
| Repositories | N/A (usa _internalDb) | ✅ |

**Última actualización:** 2025-12-24 (PR #9)

## 🚀 Migración

Ver: [docs/MIGRATION-DB-SERVICE.md](./MIGRATION-DB-SERVICE.md)

## 🔒 Validación Automática

Para verificar que no existan usos ilegítimos:

```bash
npm run validate-db-access
```

Este comando falla si encuentra usos de `__unsafeDirectDbAccess` fuera de:
- `src/lib/db.ts` (export declaration)
- `src/core/repositories/*` (Repository Pattern)
- Archivos de documentación

## 📈 Beneficios de Esta Arquitectura

### 1. Testabilidad
```typescript
// Mock fácil en tests
vi.mock('@/lib/db', () => ({
  dbService: {
    getProductosBase: vi.fn().mockResolvedValue([...]),
  }
}));
```

### 2. Mantenibilidad
- Un solo punto de cambio para operaciones de DB
- Refactorización segura sin romper componentes

### 3. Escalabilidad
- Agregar caching transparente
- Migrar a backend SQL sin tocar componentes
- Agregar logging/metrics centralizado

### 4. Seguridad
- Validación centralizada de datos
- Rate limiting en dbService
- Auditoría de operaciones críticas

## 🛣️ Roadmap

### v1.1 (actual) ✅
- dbService implementado
- 100% migración completada
- Deprecation warnings activos
- Documentación completa

### v2.0 (planeado)
- Eliminar `__unsafeDirectDbAccess` completamente
- Mantener `_internalDb` solo para repositories
- Agregar logging/analytics a dbService
- Implementar caching transparente
- Considerar migración a backend SQL

## 📚 Referencias

- [MIGRATION-DB-SERVICE.md](./MIGRATION-DB-SERVICE.md) - Guía de migración
- [REFACTOR-LOG.md](./REFACTOR-LOG.md) - Historial de cambios
- [SOLID-PRINCIPLES.md](./SOLID-PRINCIPLES.md) - Principios aplicados
- [Dexie.js Documentation](https://dexie.org/) - API de Dexie

## 🤝 Contribuir

Al agregar nuevas funcionalidades:

1. ✅ **SIEMPRE** usa `dbService` en componentes/hooks/stores
2. ✅ Agrega métodos a `dbService` si no existen
3. ✅ Usa `_internalDb` SOLO en repositories
4. ✅ Ejecuta `npm run validate-db-access` antes de commit
5. ✅ Actualiza esta documentación si cambias la arquitectura

## ⚠️ Advertencias Comunes

### "Property 'X' does not exist on type 'dbService'"
**Solución:** Agrega el método a `dbService` en `src/lib/db.ts`

### "Deprecation warning for __unsafeDirectDbAccess"
**Solución:** Migra a `dbService` (ver MIGRATION-DB-SERVICE.md)

### "validate-db-access failed"
**Solución:** No uses `__unsafeDirectDbAccess` fuera de archivos permitidos

## 📞 Soporte

- GitHub Issues: [gondolapp-beta/issues](https://github.com/Angel-Baez/gondolapp-beta/issues)
- Label: `architecture` o `migration`
