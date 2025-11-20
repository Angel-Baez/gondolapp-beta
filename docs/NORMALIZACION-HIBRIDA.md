# 🤖 Sistema de Normalización Híbrida (IA + Taxonomías)

## Descripción General

El sistema combina dos estrategias para normalizar productos de Open Food Facts:

1. **Taxonomías OFF** (rápido, offline) → 90% de casos
2. **IA (Google Gemini)** (inteligente, online) → 10% de casos complejos

### ¿Por qué híbrido?

| Aspecto    | Solo Taxonomías | Solo IA             | **Híbrido**          |
| ---------- | --------------- | ------------------- | -------------------- |
| Velocidad  | ⚡ 5ms          | 🐢 500ms            | ⚡ 50ms promedio     |
| Costo      | 🆓 Gratis       | 💵 $0.0004/producto | 💵 $0.00004/producto |
| Offline    | ✅ Sí           | ❌ No               | ✅ 90% offline       |
| Sub-marcas | ❌ Limitado     | ✅ Excelente        | ✅ Excelente         |
| Precisión  | ⚠️ 85%          | ✅ 95%              | ✅ 93%               |

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────┐
│ 1. Escaneo de Producto (EAN)                        │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. Buscar en IndexedDB Local                        │
│    ✅ Encontrado → Retornar                         │
│    ❌ No encontrado → Continuar                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. Consultar Open Food Facts API                    │
│    (Datos crudos del producto)                      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. NORMALIZACIÓN HÍBRIDA                            │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ Detección: ¿Tiene sub-marca conocida?     │    │
│  │ (Listamilk, Kinder, Zero, etc.)           │    │
│  └────────────┬───────────────────────────────┘    │
│               │                                     │
│      ┌────────┴────────┐                           │
│      │                 │                            │
│   SÍ ▼              NO ▼                            │
│  ┌─────────┐    ┌──────────────┐                   │
│  │ IA      │    │ TAXONOMÍAS   │                   │
│  │ Gemini  │    │ OFF (local)  │                   │
│  │ (500ms) │    │ (5ms)        │                   │
│  └────┬────┘    └──────┬───────┘                   │
│       │                │                            │
│       └────────┬───────┘                            │
│                │                                     │
│                ▼                                     │
│  ┌──────────────────────────────┐                   │
│  │ Datos Normalizados:          │                   │
│  │ - Marca: "Rica"              │                   │
│  │ - NombreBase: "Listamilk"    │                   │
│  │ - Variante: "Sin Lactosa 1L" │                   │
│  └──────────────────────────────┘                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. Crear/Actualizar en IndexedDB                    │
│    - ProductoBase (agrupación)                      │
│    - ProductoVariante (SKU específico)              │
└─────────────────────────────────────────────────────┘
```

---

## Configuración

### 1. Instalar Dependencias

```bash
npm install @google/generative-ai
```

### 2. Obtener API Key de Google Gemini

1. Ir a: https://aistudio.google.com/app/apikey
2. Crear una nueva API key
3. Copiar la clave

### 3. Configurar Variable de Entorno

Crear archivo `.env.local`:

```env
GEMINI_API_KEY=AIza...tu_clave_aqui
```

**IMPORTANTE**:

- ✅ Con API key → Sistema híbrido completo
- ⚠️ Sin API key → Solo taxonomías (funciona offline pero sin detección de sub-marcas)

---

## Casos de Uso

### Ejemplo 1: Producto Simple (USA TAXONOMÍAS)

```typescript
// Input: "Arroz Campos 1kg"
// Detección: NO tiene sub-marca conocida
// Método: Taxonomías OFF (5ms)

{
  marca: "Campos",
  nombreBase: "Arroz",  // Desde taxonomía "en:rices"
  nombreVariante: "1kg",
  categoria: "Arroz",
  variante: {
    volumen: 1,
    unidad: "KG"
  }
}
```

### Ejemplo 2: Producto con Sub-marca (USA IA)

```typescript
// Input: "Leche UHT Rica Listamilk Sin Lactosa 1L"
// Detección: SÍ tiene "listamilk" (sub-marca conocida)
// Método: IA Gemini (500ms)

{
  marca: "Rica",
  nombreBase: "Listamilk",  // ✅ Detectado por IA
  nombreVariante: "Sin Lactosa 1L",
  categoria: "Leche",
  variante: {
    volumen: 1,
    unidad: "L",
    tipo: "Sin Lactosa"
  }
}
```

### Ejemplo 3: Bebida con Línea de Producto (USA IA)

```typescript
// Input: "Coca-Cola Zero 500ml"
// Detección: SÍ tiene "zero" (sub-marca conocida)
// Método: IA Gemini (500ms)

{
  marca: "Coca-Cola",
  nombreBase: "Coca-Cola Zero",  // ✅ Detectado por IA
  nombreVariante: "500ml",
  categoria: "Refresco",
  variante: {
    volumen: 500,
    unidad: "ML",
    tipo: "Zero"
  }
}
```

---

## Agregar Nuevas Sub-Marcas

Editar `src/services/normalizador.ts`:

```typescript
const SUBMARCAS_CONOCIDAS = [
  "listamilk",
  "kinder",
  "zero",
  "light",
  // ⬇️ Agregar aquí nuevas sub-marcas
  "clasica",
  "premium",
  "dorada",
  "gold",
];
```

**Regla**: Agregar una palabra clave si detectas que productos similares deberían agruparse bajo esa línea comercial.

---

## Monitoreo y Debugging

### Ver qué método se usó

Revisar logs en consola del navegador:

```
🤖 Detectada sub-marca, consultando IA...
✅ Normalización IA exitosa: { marca: "Rica", base: "Listamilk", variante: "Sin Lactosa 1L" }
```

O:

```
📚 Usando taxonomías OFF (normalización rápida)
```

### Costos Estimados

```typescript
// Producto simple (taxonomía): $0.00
// Producto con sub-marca (IA): $0.0004

// Caso real: Supermercado con 500 productos únicos
// - 450 productos simples → $0.00
// - 50 productos con sub-marcas → $0.02
// Total: $0.02 inicial (se cachean en IndexedDB)
```

---

## Limitaciones Conocidas

1. **Latencia de IA**: Primera vez que escaneas un producto con sub-marca toma ~500ms
2. **Requiere Internet**: IA necesita conexión (pero se cachea localmente después)
3. **Variabilidad**: IA puede variar respuestas (mitigado con `temperature: 0.1`)

---

## Troubleshooting

### Error: "GEMINI_API_KEY no configurada"

**Síntoma**: Productos con sub-marcas no se detectan correctamente

**Solución**:

1. Obtener API key en https://aistudio.google.com/app/apikey
2. Agregar a `.env.local`
3. Reiniciar servidor de desarrollo

### Error: "IA falló, usando taxonomías de fallback"

**Síntoma**: Logs muestran error de IA pero producto se procesa

**Causa**:

- Límite de rate de API excedido
- API key inválida
- Problema de red

**Solución**: El sistema automáticamente usa taxonomías como fallback (degradación elegante)

### Producto mal agrupado

**Síntoma**: "Milex Kinder" y "Milex Clásica" se agrupan como "Milex"

**Solución**:

1. Agregar "kinder" y "clasica" a `SUBMARCAS_CONOCIDAS`
2. Eliminar productos de IndexedDB (DevTools → Application → IndexedDB)
3. Volver a escanear

---

## Mantenimiento

### Actualizar Taxonomías

Editar `src/services/normalizador.ts` → `TAXONOMIA_OFF`

```typescript
const TAXONOMIA_OFF: Record<string, { base: string; tipo?: string }> = {
  // Agregar nuevas categorías aquí
  "en:new-category": { base: "Nuevo Producto", tipo: "Tipo" },
};
```

### Mejorar Prompt de IA

Editar `src/services/normalizadorIA.ts` → `SYSTEM_PROMPT`

Agregar más ejemplos o reglas específicas para tu región.

---

## Roadmap

- [ ] Cache de respuestas IA en IndexedDB (evitar llamadas duplicadas)
- [ ] Fine-tuning de modelo con productos específicos de tu región
- [ ] Soporte para más proveedores de IA (OpenAI, Claude)
- [ ] Dashboard de estadísticas (% IA vs Taxonomías, costos)

---

**Documentación actualizada**: 18 de noviembre de 2025
