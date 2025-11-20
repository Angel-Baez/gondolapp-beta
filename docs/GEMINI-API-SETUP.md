# 🔑 Configuración de Google Gemini API

## Paso 1: Obtener API Key

1. Ve a: **https://aistudio.google.com/app/apikey**

2. Si no tienes cuenta, inicia sesión con tu cuenta de Google

3. Haz clic en **"Create API Key"**

4. Selecciona un proyecto existente o crea uno nuevo

5. Copia la API key generada (formato: `AIza...`)

---

## Paso 2: Configurar en tu Proyecto

### Crear archivo `.env.local`

En la raíz del proyecto, crea un archivo llamado `.env.local`:

```bash
# En la terminal (macOS/Linux):
touch .env.local
```

### Agregar la API Key

Abre `.env.local` y agrega:

```env
GEMINI_API_KEY=AIza...tu_clave_aqui
```

**Ejemplo**:

```env
GEMINI_API_KEY=AIzaSyDv8JQ7X2h9mZ3rK5lN4pT6wY1bC8eF0gH
```

---

## Paso 3: Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C)
# Volver a iniciar
npm run dev
```

---

## Verificación

Al escanear un producto con sub-marca (ej: "Leche Rica Listamilk"), deberías ver en la consola:

```
🤖 Detectada sub-marca, consultando IA...
📝 Respuesta IA: {...}
✅ Normalización IA exitosa: { marca: "Rica", base: "Listamilk", ... }
```

---

## ¿Es Obligatoria?

**NO** ❌

El sistema funciona sin API key usando solo taxonomías:

- ✅ **Con API key**: Detección inteligente de sub-marcas (Listamilk, Kinder, etc.)
- ⚠️ **Sin API key**: Solo categorías genéricas (Leche, Jugo, etc.)

---

## Límites y Costos

### Tier Gratuito de Gemini

- **15 RPM** (requests por minuto)
- **1 millón de tokens/mes gratis**
- **$0.075 por millón de tokens** adicionales

### Estimaciones de Uso

- **1 producto**: ~500 tokens
- **10% de productos** usan IA (resto usa taxonomías)
- **1000 escaneos/mes**: ~50 productos con IA = **25,000 tokens** = **GRATIS** ✅

---

## Troubleshooting

### Error: "GEMINI_API_KEY no configurada"

**Causa**: No existe el archivo `.env.local` o está mal escrito

**Solución**:

1. Verifica que el archivo se llame exactamente `.env.local` (con punto al inicio)
2. Verifica que esté en la raíz del proyecto (mismo nivel que `package.json`)
3. Reinicia el servidor

### Error: "IA falló"

**Posibles causas**:

- API key inválida
- Límite de rate excedido (15 RPM)
- Sin conexión a internet

**Solución**: El sistema automáticamente usa taxonomías como fallback

### Verificar que la API key funciona

```bash
# Test rápido (reemplaza con tu key):
curl \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hola"}]}]}' \
  -X POST 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=TU_API_KEY'
```

Deberías recibir una respuesta JSON con texto generado.

---

## Seguridad

⚠️ **IMPORTANTE**:

1. **Nunca** subas `.env.local` a Git (ya está en `.gitignore`)
2. **Nunca** compartas tu API key públicamente
3. Si la expones accidentalmente, elimínala en Google AI Studio y genera una nueva

---

## Más Información

- 📚 Docs oficiales: https://ai.google.dev/gemini-api/docs
- 💰 Precios: https://ai.google.dev/pricing
- 🔑 Gestión de keys: https://aistudio.google.com/app/apikey
