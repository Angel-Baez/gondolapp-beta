# Arquitectura de Normalización IA-First

## 🎯 Filosofía del Sistema

**La IA es la normalización principal, el normalizador.ts solo sanitiza.**

Este sistema implementa una arquitectura donde:

- ✅ **IA Gemini** es la fuente de verdad para decisiones inteligentes
- ✅ **normalizador.ts** solo limpia y valida tipos de datos
- ✅ **Fallback manual** actúa como red de seguridad básica
- ✅ **Sanitización** garantiza consistencia de formato

---

## 📊 Flujo de Datos

```
┌─────────────────────────────────────────────────────┐
│ 1. Usuario Escanea EAN                              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. Buscar en IndexedDB Local                        │
│    ✅ Existe → Retornar inmediatamente (5ms)        │
│    ❌ No existe → Continuar al paso 3               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. Consultar Open Food Facts API                    │
│    → Datos crudos del producto (200ms)              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. 🤖 NORMALIZACIÓN IA (Gemini)                     │
│    → Detecta marca, sub-marca, tipo, volumen        │
│    → Genera nombres comerciales inteligentes        │
│    → Tiempo: 300-700ms                              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. ¿IA Exitosa?                                     │
│    ✅ SÍ → Pasar a sanitización                     │
│    ❌ NO → Fallback a normalizador manual           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. 🧼 SANITIZACIÓN (normalizador.ts)                │
│    → Solo limpia tipos (string → number)            │
│    → Remueve espacios extras                        │
│    → Valida estructura de datos                     │
│    → NO cambia nombres ni toma decisiones           │
│    → Tiempo: <5ms                                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 7. 💾 Guardar en IndexedDB                          │
│    → ProductoBase + ProductoVariante                │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 8. 🚀 Retornar al Frontend                          │
│    → Mostrar modal de cantidad o vencimiento        │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Componentes del Sistema

### 1. **normalizadorIA.ts** - Inteligencia Artificial

**Responsabilidad:** Decisiones inteligentes de normalización

```typescript
export async function normalizarConIA(
  rawProductOFF: any
): Promise<DatosNormalizados | null>;
```

**Capacidades:**

- ✅ Detecta marcas corporativas (Rica, Milex, Nestlé)
- ✅ Identifica sub-marcas (Listamilk, Kinder, Zero, Light)
- ✅ Extrae volumen numérico y unidad por separado
- ✅ Genera nombres de variante comerciales sin repetir marca
- ✅ Categorización genérica en español

**Prompt del Sistema:**

```
REGLAS CRÍTICAS:
1. Detecta la MARCA (empresa fabricante)
2. Detecta el NOMBRE BASE (línea de producto o sub-marca)
3. Genera un NOMBRE VARIANTE comercial sin repetir
4. Extrae VOLUMEN como número y UNIDAD por separado
5. Categoría genérica en español
```

**Ejemplos de Normalización:**

| Input                                     | Marca     | NombreBase     | NombreVariante |
| ----------------------------------------- | --------- | -------------- | -------------- |
| "Leche UHT Rica Listamilk Sin Lactosa 1L" | Rica      | Listamilk      | Sin Lactosa 1L |
| "Coca-Cola Zero 500ml"                    | Coca-Cola | Coca-Cola Zero | 500ml          |
| "Milex Kinder Gold 2000g"                 | Milex     | Milex Kinder   | Gold 2000g     |
| "Arroz Campos 1kg"                        | Campos    | Campos         | 1kg            |

---

### 2. **normalizador.ts** - Sanitización

**Responsabilidad:** Limpieza y validación de tipos (NO decisiones)

```typescript
export function sanitizarDatos(datos: DatosNormalizados): DatosNormalizados;
```

**Funciones:**

- ✅ `limpiarTexto()` - Remueve espacios dobles, capitaliza
- ✅ `validarURL()` - Valida formato de URLs de imágenes
- ✅ Convierte strings a números donde corresponde
- ✅ Normaliza unidades a mayúsculas (ML, L, G, KG)

**Ejemplo de Sanitización:**

```typescript
// ANTES (datos de IA)
{
  marca: "  rica  ",
  nombreBase: "listamilk",
  variante: { volumen: "1", unidad: "l" }
}

// DESPUÉS (sanitizado)
{
  marca: "Rica",
  nombreBase: "Listamilk",
  variante: { volumen: 1, unidad: "L" }
}
```

**Fallback Manual:**

```typescript
export function normalizarManualmente(datosOFF: any): DatosNormalizados;
```

Usado solo cuando:

- ❌ La API key de Gemini no está configurada
- ❌ La IA devuelve un error
- ❌ La respuesta de IA está incompleta

**Estrategia Básica:**

1. Extraer marca de `brands` o primera palabra
2. Nombre base = primeras 2 palabras del `product_name`
3. Variante = nombre completo del producto
4. Volumen = regex simple de números + unidad

---

### 3. **productos.ts** - Orquestador

**Responsabilidad:** Coordinar todo el flujo

```typescript
export async function obtenerOCrearProducto(
  ean: string
): Promise<ProductoCompleto | null>;
```

**Pasos del Flujo:**

```typescript
// 1. CACHE LOCAL (instantáneo)
const varianteExistente = await db.productosVariantes
  .where("codigoBarras")
  .equals(ean)
  .first();

// 2. API OPEN FOOD FACTS
const dataOFF = await buscarProductoPorEAN(ean);

// 3. NORMALIZACIÓN IA (inteligente)
let datosNormalizados = await normalizarConIA(dataOFF);

// 4. FALLBACK MANUAL (si IA falla)
if (!datosNormalizados) {
  datosNormalizados = normalizarManualmente(dataOFF);
}

// 5. SANITIZACIÓN (limpieza)
const datosSanitizados = sanitizarDatos(datosNormalizados);

// 6. GUARDAR EN DB
await db.productosBase.add(productoBase);
await db.productosVariantes.add(variante);
```

---

## 🎨 Interfaz de Usuario

### Indicador de IA en Loading

```tsx
const [isUsingIA, setIsUsingIA] = useState(false);

// Si tarda más de 500ms, probablemente está usando IA
const iaTimer = setTimeout(() => {
  setIsUsingIA(true);
}, 500);

const producto = await obtenerOCrearProducto(ean);
clearTimeout(iaTimer);
```

**Visual:**

- 🔄 Spinner normal → "Buscando producto..."
- 🤖 Spinner + ícono Bot → "Analizando con IA..."

---

## 📈 Rendimiento y Costos

### Tiempos de Respuesta

| Escenario         | Tiempo    | Fuente           |
| ----------------- | --------- | ---------------- |
| Cache local       | 5ms       | IndexedDB        |
| IA nueva consulta | 300-700ms | Gemini + OFF API |
| Fallback manual   | 200-250ms | Solo OFF API     |

### Costos de API

**Gemini 1.5 Flash:**

- Input: $0.075 / 1M tokens
- Output: $0.30 / 1M tokens

**Estimación por producto:**

- Input promedio: ~200 tokens ($0.000015)
- Output promedio: ~100 tokens ($0.00003)
- **Total: ~$0.000045 por producto**

Para 1,000 productos nuevos:

- Costo total: **$0.045 USD**
- Sin costo posterior (cache local)

---

## 🔐 Configuración

### Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_GEMINI_API_KEY=tu_api_key_aqui

# Opcional: especificar modelo (por defecto: gemini-pro)
NEXT_PUBLIC_GEMINI_MODEL=gemini-pro
```

**Obtener API Key:**

1. Ir a: https://aistudio.google.com/app/apikey
2. Crear nueva clave
3. Copiar en `.env.local`

**Modelos Compatibles:**

- ✅ `gemini-pro` (recomendado, estable, disponible en todas las cuentas)
- ✅ `gemini-1.5-pro` (si está disponible en tu región/cuenta)
- ❌ `gemini-1.5-flash` (no disponible en API v1beta para todas las cuentas)

**Importante:**

- ✅ Usar prefijo `NEXT_PUBLIC_` para acceso en cliente
- ✅ Nunca commitear `.env.local` (está en `.gitignore`)
- ✅ Si no se configura, el sistema funciona con fallback manual
- ⚡ El modelo `gemini-pro` es compatible y rápido (300-500ms)

---

## 🧪 Testing

### Caso 1: Producto con Sub-marca (usa IA)

```typescript
// En la consola del navegador
import { obtenerOCrearProducto } from "@/services/productos";

const test1 = await obtenerOCrearProducto("7501234567890");

// Logs esperados:
// 🔍 Buscando producto: 7501234567890
// 📡 Consultando Open Food Facts...
// 📦 Datos crudos: Leche Rica Listamilk...
// 🤖 Consultando IA Gemini...
// ✅ IA respondió en 450ms
// 📝 Respuesta: { marca: "Rica", nombreBase: "Listamilk"... }
// 🧼 Datos sanitizados: { marca: "Rica", base: "Listamilk", variante: "Sin Lactosa 1L" }
// ✨ Nuevo producto base: Listamilk
// ✨ Nueva variante: Sin Lactosa 1L
```

### Caso 2: Producto Simple (podría usar fallback)

```typescript
const test2 = await obtenerOCrearProducto("7501098765432");

// Si IA no está configurada:
// ⚠️ GEMINI_API_KEY no configurada
// ⚠️ IA falló, usando normalización manual...
// 🧼 Datos sanitizados: { marca: "Campos", base: "Arroz", variante: "1kg" }
```

---

## 🐛 Logs de Debug

### Interpretar Consola

**✅ Flujo exitoso con IA:**

```
🔍 Buscando producto: [EAN]
📡 Consultando Open Food Facts...
📦 Datos crudos: [nombre]
🤖 Consultando IA Gemini...
✅ IA respondió en [X]ms
📝 Respuesta: {...}
🧼 Datos sanitizados: {...}
✨ Nuevo producto base: [nombre]
✨ Nueva variante: [variante]
```

**⚠️ Flujo con fallback:**

```
🔍 Buscando producto: [EAN]
📡 Consultando Open Food Facts...
⚠️ GEMINI_API_KEY no configurada
⚠️ IA falló, usando normalización manual...
🧼 Datos sanitizados: {...}
✨ Nuevo producto base: [nombre]
```

**❌ Error completo:**

```
❌ Producto no encontrado en OFF: [EAN]
```

---

## 🚀 Ventajas del Sistema

### 1. **Inteligencia Real**

- ✅ Detecta sub-marcas complejas (Listamilk, Kinder)
- ✅ Agrupa variantes correctamente
- ✅ Genera nombres comerciales naturales

### 2. **Offline-First**

- ✅ Cache local instantáneo
- ✅ No requiere internet para productos conocidos
- ✅ PWA funcional sin conexión

### 3. **Robusto**

- ✅ Múltiples capas de fallback
- ✅ Sanitización garantiza consistencia
- ✅ Manejo de errores completo

### 4. **Económico**

- ✅ Solo ~$0.000045 por producto nuevo
- ✅ Sin costo para productos en cache
- ✅ Modelo Flash de Gemini (más barato)

### 5. **UX Mejorada**

- ✅ Indicador visual cuando usa IA
- ✅ Loading states informativos
- ✅ Errores descriptivos con acciones

---

## � Troubleshooting

### Error 404: Model Not Found

**Problema:**

```
POST https://generativelanguage.googleapis.com/.../gemini-1.5-flash:generateContent 404
[GoogleGenerativeAI Error]: models/gemini-1.5-flash is not found for API version v1beta
```

**Solución:**

1. El modelo `gemini-1.5-flash` no está disponible en todas las cuentas/regiones
2. Usar `gemini-pro` (modelo estable y universal):
   ```bash
   # .env.local
   NEXT_PUBLIC_GEMINI_MODEL=gemini-pro
   ```
3. O dejarlo vacío para usar el default (gemini-pro)

### Error: JSON Parse Failed

**Problema:** La IA devuelve texto en lugar de JSON puro

**Solución automática:** El código ya maneja estos casos:

- ✅ Extrae JSON desde bloques markdown (\`\`\`json...\`\`\`)
- ✅ Busca objetos JSON dentro de texto plano
- ✅ Fallback a normalización manual si todo falla

**Logs para debuggear:**

```
📝 Respuesta cruda: <ver qué devolvió la IA>
📊 Datos parseados: <ver JSON extraído>
```

### IA Tarda Mucho (>2 segundos)

**Posibles causas:**

- Red lenta
- Modelo muy grande (usar `gemini-pro` en lugar de `gemini-1.5-pro`)
- API rate limit

**Solución:**

1. Verificar velocidad de internet
2. Cambiar a modelo más rápido en `.env.local`
3. El fallback manual se activará automáticamente si falla

### API Key Inválida

**Problema:**

```
⚠️ GEMINI_API_KEY no configurada
⚠️ IA falló, usando normalización manual...
```

**Solución:**

1. Verificar que `.env.local` existe en la raíz del proyecto
2. Verificar prefijo `NEXT_PUBLIC_`:
   ```bash
   NEXT_PUBLIC_GEMINI_API_KEY=tu_clave_aqui
   ```
3. Reiniciar el servidor de desarrollo (`npm run dev`)
4. Verificar la clave en [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## �📝 Guía de Mantenimiento

### Actualizar Prompt de IA

Editar `src/services/normalizadorIA.ts`:

```typescript
const SYSTEM_PROMPT = `
// Aquí agregar nuevas reglas o ejemplos
`;
```

### Agregar Más Sanitizaciones

Editar `src/services/normalizador.ts`:

```typescript
export function sanitizarDatos(datos: DatosNormalizados) {
  return {
    // Agregar nueva limpieza aquí
  };
}
```

### Mejorar Fallback Manual

Editar `src/services/normalizador.ts`:

```typescript
export function normalizarManualmente(datosOFF: any) {
  // Mejorar lógica de extracción básica
}
```

---

## 🎯 Próximos Pasos Sugeridos

1. **Analytics de IA:**

   - Registrar cuándo usa IA vs fallback
   - Medir tiempos de respuesta
   - Detectar patrones de fallos

2. **Cache Inteligente:**

   - Pre-cargar productos populares
   - Expiración de cache por antigüedad
   - Sync offline → online

3. **Mejora Continua del Prompt:**

   - Recopilar casos edge
   - Ajustar ejemplos del prompt
   - Fine-tuning según región

4. **Feedback del Usuario:**
   - Botón "Corregir nombre"
   - Aprendizaje de correcciones
   - Mejora del modelo

---

## 📚 Referencias

- [Open Food Facts API](https://world.openfoodfacts.org/data)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Dexie.js Docs](https://dexie.org/)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
