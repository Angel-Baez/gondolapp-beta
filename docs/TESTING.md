# Guía de Pruebas - GondolApp

> ℹ️ **Nota de Actualización (Diciembre 2024)**: El sistema actual prioriza la búsqueda en MongoDB Atlas antes de Open Food Facts. El flujo es: Cache Local → MongoDB Atlas → Crear Manual. Los códigos de barras de prueba siguen siendo válidos para testing.

## 🧪 Códigos de Barras de Prueba

### ✅ Códigos que SÍ funcionan (verificados en Open Food Facts)

Estos códigos están en la base de datos de Open Food Facts y deberían funcionar correctamente:

```
3017620422003 - Nutella (750g)
5449000000996 - Coca-Cola (1.5L)
8480000691187 - Leche Semidesnatada Hacendado
7501055363278 - Coca-Cola México
8480000546302 - Galletas María Artiach
3068320053516 - Kinder Bueno
4001686304778 - Milka Chocolate
8712100648366 - Pringles Original
3228857000906 - Danone Yogur
7613034626844 - Toblerone
```

### ❌ Código que NO existe (para testing de errores)

```
7501234567890 - Este código NO existe en la base de datos
```

## 🔍 Flujo de Búsqueda de Productos

### 1. **Cache Local (IndexedDB)**

```
Usuario escanea código → Buscar en BD local → ¿Existe?
  ├─ SÍ → Usar datos locales (instantáneo)
  └─ NO → Ir a paso 2
```

### 2. **API de Open Food Facts**

```
Consultar API → ¿Producto encontrado?
  ├─ SÍ → Normalizar datos → Guardar en BD local → Mostrar modal
  └─ NO → Mostrar error con opciones
```

### 3. **Normalización de Datos**

El sistema limpia y estructura automáticamente los datos:

**Ejemplo:**

```
Entrada API: "Fundació Rica,Inc Leche Entera 1000ml"
↓
Normalización:
├─ Marca: "Rica"
├─ Nombre Base: "Leche"
├─ Tipo: "Entera"
├─ Volumen: 1000
├─ Unidad: "ML"
└─ Nombre Variante: "Leche Entera 1000ML"
```

## 🎯 Casos de Uso y Testing

### Caso 1: Producto Nuevo (Primera vez)

```
1. Escanear código: 3017620422003
2. Sistema busca en BD local → No existe
3. Consulta API de Open Food Facts → Encontrado
4. Normaliza: Marca="Ferrero", Nombre="Nutella"
5. Guarda en BD local
6. Muestra modal de cantidad
7. Usuario confirma → Item agregado a lista
```

### Caso 2: Producto Ya Escaneado (Cache hit)

```
1. Escanear código: 3017620422003 (ya existe)
2. Sistema busca en BD local → ¡Existe!
3. Carga datos instantáneamente
4. Muestra modal de cantidad
5. Si ya existe en lista → Suma cantidad
```

### Caso 3: Producto No Encontrado (Error)

```
1. Escanear código: 7501234567890
2. Sistema busca en BD local → No existe
3. Consulta API → 404 Not Found
4. Muestra error informativo con:
   - Código escaneado
   - Mensaje claro
   - Botón para intentar de nuevo
   - Botón para cerrar
5. Usuario puede:
   - Escanear otro código
   - Usar entrada manual
```

### Caso 4: Error de Conexión

```
1. Usuario sin internet
2. Escanea código nuevo
3. BD local → No existe
4. API → Error de conexión
5. Muestra error: "Verifica tu conexión"
6. Producto se puede agregar cuando haya internet
```

## 🛠️ Funcionalidades de Recuperación de Errores

### 1. **Entrada Manual**

Si el escáner no funciona o el código no se lee:

```
1. Click en botón de Teclado (⌨️) en el scanner
2. Escribir código manualmente
3. Buscar → Mismo flujo de validación
```

### 2. **Reintentos Inteligentes**

```
- Error de red → Botón "Intentar de nuevo"
- Producto no encontrado → Botón "Escanear otro"
- Cámara no disponible → Cambiar a entrada manual
```

### 3. **Mensajes de Error Específicos**

```
✅ "Producto no encontrado en la base de datos"
   → El código no existe en Open Food Facts

✅ "Error de conexión al buscar el producto"
   → Problema de internet o servidor

✅ "Permiso de cámara denegado"
   → Usuario debe permitir acceso

✅ "No se encontró ninguna cámara"
   → Dispositivo sin cámara o no detectada
```

## 📊 Estados de la Aplicación

### Loading States

```javascript
loading = true  → Modal de carga con spinner
loading = false → Ocultar modal de carga
```

### Error States

```javascript
error = "mensaje"      → Toast rojo en bottom
error = null           → Sin errores visibles
codigoNoEncontrado     → Muestra código problemático
```

### Success States

```javascript
productoSeleccionado   → Modal de cantidad/vencimiento
showQuantityModal      → Agregar a reposición
showExpiryModal        → Agregar a vencimientos
```

## 🔧 Debugging

### Console Logs Útiles

```javascript
// Buscar producto
"🔍 Buscando producto con código: XXXXX";

// Encontrado en cache
"✅ Producto encontrado en BD local: Nombre";

// Consultando API
"📦 Datos crudos de OFF: {data}";

// Normalización
"🔧 Datos normalizados: {normalized}";

// Nuevo producto creado
"✨ Nuevo producto base creado: Nombre";
"✨ Nueva variante creada: Nombre Completo";

// Error
"❌ Producto no encontrado en Open Food Facts para EAN: XXXXX";
"❌ Error al procesar código: Error";
```

### Inspeccionar IndexedDB

```
1. Chrome DevTools → Application
2. Storage → IndexedDB → GondolAppDB
3. Tablas:
   - productosBase
   - productosVariantes
   - itemsReposicion
   - itemsVencimiento
```

## 🚀 Mejoras Implementadas

### v2.0 - Manejo de Errores Mejorado

- ✅ Modal de loading durante búsqueda
- ✅ Toast de error informativo
- ✅ Mostrar código problemático
- ✅ Botones de recuperación
- ✅ Entrada manual como fallback
- ✅ Mensajes específicos por tipo de error
- ✅ No lanza excepciones, retorna null
- ✅ Console logs informativos

### Antes (v1.0)

```javascript
if (!dataOFF) {
  throw new Error("Producto no encontrado");
}
// ❌ App se rompe
```

### Ahora (v2.0)

```javascript
if (!dataOFF) {
  console.warn("Producto no encontrado para EAN:", ean);
  return null;
}
// ✅ App maneja el error gracefully
```

## 📱 Testing en Dispositivos

### Desktop

- Chrome: ✅ Entrada manual disponible
- Firefox: ✅ Entrada manual disponible
- Safari: ✅ Entrada manual disponible

### Mobile

- Android Chrome: ✅ Cámara + Entrada manual
- iOS Safari: ✅ Cámara + Entrada manual
- Sin cámara: ✅ Automáticamente usa entrada manual

## 🎓 Notas para Desarrollo

1. **Open Food Facts API Rate Limits**: No hay límite conocido, pero usa responsablemente
2. **Caching**: Primera carga lenta, siguientes instantáneas
3. **Offline**: Solo funciona con productos previamente cacheados
4. **PWA**: Instalar para mejor experiencia offline

## 📝 Checklist de Testing Manual

```
☐ Escanear código válido → Debe agregar producto
☐ Escanear código inválido → Debe mostrar error claro
☐ Escanear sin internet → Debe mostrar error de conexión
☐ Usar entrada manual → Debe funcionar igual que scanner
☐ Código ya existente → Debe sumar cantidad
☐ Cerrar error → Toast desaparece
☐ Intentar de nuevo → Reabre scanner
☐ Modal de loading → Aparece durante búsqueda
```
