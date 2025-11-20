# Sistema de Gestión de Productos con MongoDB

## 🎯 Descripción General

Este sistema permite gestionar tu catálogo de productos de forma estructurada y normalizada usando **MongoDB** como base de datos central, eliminando la dependencia de Open Food Facts.

## 🏗️ Arquitectura

### Esquema de Datos

```
productos_base (Colección)
├── _id: ObjectId
├── nombre: String (ej: "Nido")
├── marca: String (ej: "Nestlé")
├── categoria: String (ej: "Leche en Polvo")
├── imagen: String (opcional)
└── createdAt: Date

productos_variantes (Colección)
├── _id: ObjectId
├── productoBaseId: ObjectId (FK)
├── ean: String (código de barras, único)
├── nombreCompleto: String (generado automáticamente)
├── tipo: String (ej: "Crecimiento")
├── tamano: String (ej: "360g")
├── volumen: Number (ej: 360)
├── unidad: String (ej: "G")
├── sabor: String (opcional)
├── imagen: String (opcional)
└── createdAt: Date
```

### Relación con IndexedDB

- **MongoDB**: Fuente de verdad central (servidor)
- **IndexedDB**: Cache local (offline-first)
- **Sincronización**: Al crear/editar productos, se guarda en ambos

## 📦 3 Fases de Población

### FASE 1: Importación Masiva desde Excel

**Ubicación**: `/admin` → "Importar desde Excel"

**Formato del Excel**:

```csv
ProductoBase,Marca,Categoria,TipoVariante,Tamaño,EAN,Sabor,Imagen
Nido,Nestlé,Leche en Polvo,Crecimiento,360g,1234567890123,,
Coca-Cola,Coca-Cola Company,Refrescos,Regular,2L,7894900011517,,
Heinz Compota,Heinz,Alimentos Infantiles,Manzana,105g,9876543210456,Manzana,
```

**Características**:

- ✅ Detecta duplicados por EAN
- ✅ Normaliza volumen y unidades automáticamente
- ✅ Crea ProductoBase si no existe
- ✅ Reporte detallado de errores
- ⚡ **Velocidad**: 100 SKU en ~5 minutos

**Pasos**:

1. Descarga la plantilla CSV desde la interfaz
2. Llena los datos en Excel
3. Arrastra el archivo a la zona de drop
4. Revisa el reporte de importación

---

### FASE 2: Formulario Manual Inteligente

**Ubicación**: Automático cuando escaneas un código no registrado

**Flujo**:

1. Escaneas un código de barras en Inventario
2. Si no existe en MongoDB → Se abre formulario automáticamente
3. Completas los campos (con autocompletado de marcas/categorías existentes)
4. El sistema genera `nombreCompleto` automáticamente
5. Se guarda en MongoDB + IndexedDB

**Características**:

- 🎯 Autocompletado de marcas y categorías desde MongoDB
- 🎨 Vista previa en tiempo real del nombre completo
- ⚡ **Velocidad**: 15-30 segundos por SKU
- 📱 Disponible durante el escaneo en el supermercado

**Campos**:

- **Producto Base**: Nombre, Marca, Categoría
- **Variante**: Tipo, Tamaño (requerido), Sabor

**Ejemplo**:

```
Producto Base:
  Nombre: Nido
  Marca: Nestlé
  Categoría: Leche en Polvo

Variante:
  Tipo: Crecimiento
  Tamaño: 360g

→ Genera: "Nido Crecimiento 360g"
```

---

### FASE 3: Creación Rápida con Presets

**Ubicación**: `/admin` → "Creación Rápida con Presets"

**Presets Disponibles**:

- 🍼 Leche en Polvo
- 🥛 Leche Líquida
- 🍎 Compotas Infantiles
- 🥤 Refrescos/Gaseosas
- 🍨 Yogurt
- 🛢️ Aceites
- 🍝 Fideos/Pasta
- 🥣 Cereales
- 🍪 Galletas
- 💧 Agua Embotellada

**Características**:

- ⚡ Campos pre-llenados con valores comunes
- 📋 Marcas y tamaños típicos por categoría
- 🎯 Validación automática de unidades
- ⚡ **Velocidad**: 10 segundos por SKU

**Ejemplo - Preset "Leche en Polvo"**:

```
Seleccionas preset → Prellenado:
  Marcas: Nestlé, Abbott, Mead Johnson
  Tipos: Crecimiento, Forticrece, Kinder
  Tamaños: 360g, 400g, 900g, 1100g
  Categoría: "Leche en Polvo" (automático)

Solo escribes:
  EAN: 1234567890123
  Nombre: Nido

Seleccionas de listas:
  Marca: Nestlé
  Tipo: Crecimiento
  Tamaño: 360g

→ Creado en 10 segundos
```

---

## 🚀 Uso Rápido

### 1. Configuración Inicial

```bash
# Copia el archivo de ejemplo
cp .env.example .env.local

# Edita con tu MongoDB URI
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/gondolapp
```

### 2. Poblar Base de Datos (Primera vez)

**Opción A - Importación Masiva (Recomendado)**:

1. Ve a `/admin`
2. Click en "Importar desde Excel"
3. Descarga plantilla
4. Llena 50-100 productos
5. Importa

**Opción B - Presets (Más rápido para pocos productos)**:

1. Ve a `/admin`
2. Click en "Creación Rápida con Presets"
3. Selecciona categoría
4. Completa formulario

### 3. Uso Diario

Escanea códigos de barras normalmente:

- Si existe → Funciona como siempre
- Si no existe → Formulario automático para registro

---

## 📡 API Endpoints

### POST `/api/productos/importar-excel`

Importa productos desde archivo Excel.

**Body**: FormData con archivo Excel
**Response**:

```json
{
  "success": true,
  "contadores": {
    "productosBase": 10,
    "variantes": 25,
    "duplicados": 3,
    "errores": 0
  },
  "errores": []
}
```

### POST `/api/productos/crear-manual`

Crea un producto manualmente.

**Body**:

```json
{
  "ean": "1234567890123",
  "productoBase": {
    "nombre": "Nido",
    "marca": "Nestlé",
    "categoria": "Leche en Polvo"
  },
  "variante": {
    "tipo": "Crecimiento",
    "tamano": "360g",
    "sabor": null
  }
}
```

**Response**:

```json
{
  "success": true,
  "producto": {
    "base": {
      "id": "...",
      "nombre": "Nido",
      "marca": "Nestlé"
    },
    "variante": {
      "id": "...",
      "ean": "1234567890123",
      "nombreCompleto": "Crecimiento 360g"
    }
  }
}
```

### GET `/api/productos/crear-manual`

Obtiene marcas y categorías existentes para autocompletado.

**Response**:

```json
{
  "success": true,
  "marcas": ["Nestlé", "Coca-Cola", "Heinz"],
  "categorias": ["Leche en Polvo", "Refrescos", "Alimentos Infantiles"]
}
```

---

## 🎨 Componentes UI

### `ImportarExcel`

Drag-and-drop para subir Excel + reporte detallado.

### `FormularioProductoManual`

Modal con autocompletado que se abre cuando EAN no existe.

### `CrearConPreset`

Wizard de 2 pasos: selección de preset → configuración rápida.

---

## 🔄 Sincronización MongoDB ↔ IndexedDB

### Al crear producto:

1. Se guarda en MongoDB
2. Se guarda en IndexedDB local
3. Se devuelve respuesta al cliente

### Al escanear código:

1. Busca en IndexedDB (cache local)
2. Si no existe → Busca en MongoDB (API)
3. Si encuentra → Guarda en IndexedDB
4. Si no encuentra → Abre formulario manual

---

## 📊 Normalización Automática

### Extracción de Volumen y Unidad

```typescript
"360g"    → volumen: 360,  unidad: "G"
"1L"      → volumen: 1,    unidad: "L"
"500ml"   → volumen: 500,  unidad: "ML"
"2.5L"    → volumen: 2.5,  unidad: "L"
"12u"     → volumen: 12,   unidad: "UNIDAD"
```

### Generación de `nombreCompleto`

```typescript
tipo: "Crecimiento", tamano: "360g", sabor: null
→ "Crecimiento 360g"

tipo: "Regular", tamano: "2L", sabor: "Cola"
→ "Regular 2L Cola"

tipo: null, tamano: "1L", sabor: "Fresa"
→ "1L Fresa"
```

---

## 🛠️ Mantenimiento

### Agregar nuevo preset:

Edita `/src/lib/presets.ts`:

```typescript
{
  id: "mi-categoria",
  nombre: "Mi Categoría",
  descripcion: "Descripción corta",
  categoria: "Categoría en DB",
  marcasComunes: ["Marca1", "Marca2"],
  tipos: ["Tipo1", "Tipo2"],
  tamanosComunes: ["100g", "200g"],
  unidadBase: "G",
  sabores: ["Sabor1", "Sabor2"],
  icono: "🎯",
}
```

### Modificar estructura de Excel:

Edita `/src/app/api/productos/importar-excel/route.ts` líneas 65-80.

---

## ⚠️ Consideraciones

- **EAN único**: Cada código de barras solo puede existir una vez
- **MongoDB requerido**: Las APIs no funcionan sin MongoDB_URI
- **Sincronización**: Productos se guardan en ambos lados automáticamente
- **Offline**: IndexedDB permite uso offline después de primera carga

---

## 📈 Métricas de Rendimiento

| Método            | Productos | Tiempo    | Velocidad   |
| ----------------- | --------- | --------- | ----------- |
| Importación Excel | 100 SKU   | ~5 min    | 20 SKU/min  |
| Formulario Manual | 1 SKU     | 15-30 seg | 2-4 SKU/min |
| Preset            | 1 SKU     | 10 seg    | 6 SKU/min   |
| Scanner + Form    | 1 SKU     | 8 seg     | 7.5 SKU/min |

---

## 🎯 Flujo Recomendado

1. **Día 1**: Importa 50-100 productos base desde Excel (30 min)
2. **Semana 1**: Agrega productos nuevos mientras escaneas en el super (5-10 min/día)
3. **Mes 1**: Usa presets para categorías repetitivas (2-3 min/día)
4. **Resultado**: Base de datos de 200-300 SKU en 1 mes, 100% controlada

---

## 🐛 Debugging

### Error: "MONGODB_URI no definido"

→ Copia `.env.example` a `.env.local` y completa el URI

### Error: "EAN ya existe"

→ El código de barras está duplicado, busca el producto existente

### Excel no importa

→ Verifica que las columnas coincidan exactamente con la plantilla

---

## 📚 Recursos

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Base de datos en la nube (gratis hasta 512MB)
- [xlsx npm](https://www.npmjs.com/package/xlsx) - Librería para leer Excel
- Plantilla Excel: Descargable desde `/admin`
