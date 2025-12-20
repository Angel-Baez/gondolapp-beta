# Migración: db → dbService

## ⚠️ BREAKING CHANGE (planificado para v2.0)

El acceso directo a `db` será eliminado. Usar `dbService` en su lugar.

## Antes (❌ Deprecated)

```typescript
import { db } from "@/lib/db";

const productos = await db.productosBase.toArray();
const count = await db.productosVariantes.count();
```

## Después (✅ Recomendado)

```typescript
import { dbService } from "@/lib/db";

const productos = await dbService.getProductosBase();
const count = await dbService.countVariantes();
```

## Para Código Legacy (temporal)

Si necesitas acceso directo durante la migración:

```typescript
import { __unsafeDirectDbAccess as db } from "@/lib/db";

// ⚠️ Solo usar en código que aún no migraste
const productos = await db.productosBase.toArray();
```

## Ventajas de dbService

1. ✅ **Logging centralizado** - futuras operaciones serán auditadas
2. ✅ **Validación** - datos sanitizados antes de escribir
3. ✅ **Testing** - mock fácil sin depender de IndexedDB
4. ✅ **Migración** - cambiar backend sin tocar componentes
5. ✅ **Performance** - caching transparente en el futuro

## Cronograma

- **v1.1 (actual)**: dbService disponible, db deprecated
- **v1.5**: Warnings en console para uso de db directo
- **v2.0**: db eliminado completamente

## Soporte

Preguntas: GitHub Issues con label `migration`
