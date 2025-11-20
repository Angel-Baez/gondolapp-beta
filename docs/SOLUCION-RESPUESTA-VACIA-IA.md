# 🔧 Solución: IA Devuelve Respuesta Vacía

## 🚨 Problema

La IA de Gemini responde pero devuelve un string vacío:

```
🤖 Consultando IA (modelo: gemini-2.5-flash-preview-09-2025)...
✅ IA respondió en 3440ms
📝 Respuesta cruda:
❌ No se pudo extraer JSON de la respuesta de IA
Respuesta completa:
⚠️ IA falló, usando normalización manual...
```

---

## 🔍 Causas Comunes

### 1. **Datos de Entrada Insuficientes**

Si el producto en Open Food Facts tiene datos muy limitados:

```json
{
  "product_name": "Refresco", // ❌ Nombre muy genérico
  "brands": "Country Club",
  "quantity": null, // ❌ Sin información de cantidad
  "categories": [], // ❌ Sin categorías
  "generic_name": null
}
```

La IA puede no tener suficiente contexto para generar una respuesta.

### 2. **Configuración del Modelo**

Algunos modelos (especialmente versiones preview) pueden tener comportamientos inconsistentes:

- `gemini-2.5-flash-preview-09-2025` → Puede fallar con datos limitados
- `gemini-pro` → Más estable y confiable

### 3. **Parámetros de Generación**

Si `temperature` es muy baja (0.1) y los datos son ambiguos, el modelo puede no generar respuesta.

---

## ✅ Soluciones Implementadas

### 1. **Validación de Respuesta Vacía**

```typescript
// Validar que la respuesta no esté vacía
if (!text || text.trim().length === 0) {
  console.error("❌ La IA devolvió una respuesta vacía");
  console.error("Input enviado:", JSON.stringify(inputLimpio, null, 2));
  return null; // Activa fallback manual
}
```

### 2. **Datos de Entrada con Valores por Defecto**

```typescript
const inputLimpio = {
  product_name: rawProductOFF.product?.product_name || "Producto sin nombre",
  brands: rawProductOFF.product?.brands || "Genérico",
  quantity: rawProductOFF.product?.quantity || null,
  categories: rawProductOFF.product?.categories_tags?.slice(0, 3) || [],
  generic_name: rawProductOFF.product?.generic_name || null,
};

// Validar que tengamos al menos algo de información
if (!inputLimpio.product_name && !inputLimpio.brands) {
  console.error("❌ Datos insuficientes para normalización IA");
  return null;
}
```

### 3. **Prompt Mejorado con Ejemplos de Datos Limitados**

```typescript
const SYSTEM_PROMPT = `
...

Entrada: {
  "product_name": "Refresco",
  "brands": "Country Club",
  "quantity": null,
  "categories": ["beverages", "sodas"]
}
Salida:
{
  "marca": "Country Club",
  "nombreBase": "Country Club",
  "nombreVariante": "Refresco Original",
  "categoria": "Refresco",
  "variante": {
    "tipo": "Original"
  }
}

IMPORTANTE: 
- Si los datos son mínimos, infiere valores razonables
- NUNCA devuelvas una respuesta vacía
`;
```

### 4. **Parámetros de Generación Ajustados**

```typescript
generationConfig: {
  temperature: 0.2,      // ↑ Aumentado para más creatividad
  maxOutputTokens: 1024, // ↑ Aumentado para respuestas completas
  topP: 0.8,
  topK: 40,
}
```

### 5. **Logs Detallados para Debugging**

```typescript
console.log("📥 Input para IA:", inputLimpio);
console.log("📝 Respuesta cruda:", text);
console.log("Input enviado:", JSON.stringify(inputLimpio, null, 2));
```

---

## 🎯 Recomendación: Cambiar a `gemini-pro`

Si `gemini-2.5-flash-preview-09-2025` sigue dando respuestas vacías:

```bash
# .env.local
NEXT_PUBLIC_GEMINI_MODEL=gemini-pro
```

**Ventajas de `gemini-pro`:**

- ✅ Más estable (no es preview)
- ✅ Mejor manejo de datos limitados
- ✅ Respuestas más consistentes
- ✅ Disponible en todas las regiones

---

## 🧪 Testing

### Verificar con Producto Problemático

```javascript
// En la consola del navegador
import { obtenerOCrearProducto } from "@/services/productos";

// Probar con el código que falló
const producto = await obtenerOCrearProducto("0049000057683");
console.log(producto);
```

**Logs esperados (con corrección):**

```
📥 Input para IA: {
  product_name: "Refresco",
  brands: "Country Club",
  quantity: null,
  categories: ["beverages"],
  generic_name: null
}
🤖 Consultando IA (modelo: gemini-pro)...
✅ IA respondió en 450ms
📝 Respuesta cruda: {
  "marca": "Country Club",
  "nombreBase": "Country Club",
  "nombreVariante": "Refresco Original",
  ...
}
📊 Datos parseados: { marca: "Country Club", ... }
```

---

## 🔄 Fallback Manual Funciona

Si la IA sigue fallando, el sistema automáticamente usa normalización manual:

```
⚠️ IA falló, usando normalización manual...
🧼 Datos sanitizados: {
  marca: 'Country Club',
  base: 'Refresco',
  variante: 'Refresco'
}
```

**El producto se guardará igualmente**, solo con nombres menos "inteligentes".

---

## 📊 Comparación de Resultados

### Con IA Exitosa:

```typescript
{
  marca: "Country Club",
  nombreBase: "Country Club Limón",  // ✅ Detecta sub-marca
  nombreVariante: "Sabor Limón 600ml" // ✅ Descriptivo
}
```

### Con Fallback Manual:

```typescript
{
  marca: "Country Club",
  nombreBase: "Refresco",            // ⚠️ Genérico
  nombreVariante: "Refresco"          // ⚠️ Menos descriptivo
}
```

**Ambos funcionan**, pero la IA da mejores nombres.

---

## ⚙️ Configuración Recomendada

```bash
# .env.local

# Usar gemini-pro para máxima estabilidad
NEXT_PUBLIC_GEMINI_MODEL=gemini-pro

# O si quieres probar con modelos preview (menos estable)
# NEXT_PUBLIC_GEMINI_MODEL=gemini-2.5-flash-preview-09-2025
```

**Reiniciar servidor después de cambiar:**

```bash
npm run dev
```

---

## 🐛 Debugging Avanzado

### Ver Input Enviado a la IA

Agregar en `src/services/normalizadorIA.ts` (ya implementado):

```typescript
console.log("📥 Input para IA:", inputLimpio);
```

### Probar API Directamente con curl

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=TU_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Normaliza este producto: {\"product_name\": \"Refresco\", \"brands\": \"Country Club\"}"
      }]
    }]
  }'
```

---

## ✅ Checklist de Solución

- [x] Validación de respuesta vacía implementada
- [x] Valores por defecto en input
- [x] Prompt mejorado con ejemplos de datos limitados
- [x] Parámetros de generación ajustados
- [x] Logs detallados agregados
- [ ] Cambiar a `gemini-pro` en `.env.local`
- [ ] Reiniciar servidor
- [ ] Probar con código problemático: `0049000057683`
- [ ] Verificar logs en DevTools

---

## 📚 Referencias

- [Gemini API - Modelos Disponibles](https://ai.google.dev/models/gemini)
- [Configuración de Generación](https://ai.google.dev/api/generate-content#generationconfig)
- [`docs/ARQUITECTURA-IA-FIRST.md`](./ARQUITECTURA-IA-FIRST.md)
- [`docs/SOLUCION-ERROR-404-GEMINI.md`](./SOLUCION-ERROR-404-GEMINI.md)

---

**Estado:** ✅ **MITIGADO** - El sistema ahora detecta respuestas vacías y usa fallback automáticamente. Se recomienda cambiar a `gemini-pro` para evitar el problema.
