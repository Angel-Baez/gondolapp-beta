# 🚀 Sistema MongoDB para GondolApp - Configuración Rápida

## ✅ Implementación Completada

Se han implementado exitosamente las **3 fases** del sistema de gestión de productos con MongoDB:

### 📦 FASE 1: Importación Masiva desde Excel

- ✅ API `/api/productos/importar-excel`
- ✅ Componente `ImportarExcel.tsx` con drag-and-drop
- ✅ Detección de duplicados y normalización automática
- ✅ Reporte detallado de importación
- ✅ Plantilla CSV descargable

### 📝 FASE 2: Formulario Manual Inteligente

- ✅ API `/api/productos/crear-manual` (GET + POST)
- ✅ Componente `FormularioProductoManual.tsx`
- ✅ Autocompletado de marcas y categorías desde MongoDB
- ✅ Integración automática con BarcodeScanner
- ✅ Generación automática de `nombreCompleto`
- ✅ Vista previa en tiempo real

### ⚡ FASE 3: Creación Rápida con Presets

- ✅ Sistema de presets en `lib/presets.ts`
- ✅ 10 categorías predefinidas (Leches, Refrescos, Compotas, etc.)
- ✅ Componente `CrearConPreset.tsx`
- ✅ Wizard de 2 pasos con autocompletado

### 🎨 Panel de Administración

- ✅ Página `/admin` con acceso a todas las herramientas
- ✅ Interfaz intuitiva para seleccionar método de población

---

## 🔧 Configuración (3 pasos)

### 1. Configurar MongoDB

Crea una cuenta gratuita en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas):

1. Click en "Try Free"
2. Crea un cluster gratuito (M0)
3. Crea un usuario de base de datos
4. Agrega tu IP a la whitelist (o permite todas: `0.0.0.0/0`)
5. Copia tu Connection String

### 2. Variables de Entorno

Crea el archivo `.env.local` en la raíz del proyecto:

```bash
MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/gondolapp?retryWrites=true&w=majority
```

Reemplaza `<usuario>` y `<password>` con tus credenciales.

### 3. Instalar y Ejecutar

```bash
# Las dependencias ya están instaladas
npm run dev
```

---

## 📋 Uso Paso a Paso

### Opción 1: Importación Masiva (Primera vez - Recomendado)

1. Abre http://localhost:3000/admin
2. Click en "Importar desde Excel"
3. Click en "Descargar Plantilla"
4. Abre el CSV y llena tus productos:

```csv
ProductoBase,Marca,Categoria,TipoVariante,Tamaño,EAN,Sabor,Imagen
Nido,Nestlé,Leche en Polvo,Crecimiento,360g,7501234567890,,
Coca-Cola,Coca-Cola Company,Refrescos,Regular,2L,7894900011517,,
Heinz Compota,Heinz,Alimentos Infantiles,Manzana,105g,9876543210456,Manzana,
```

5. Guarda el archivo
6. Arrastra el archivo a la zona de drop en la app
7. Click en "Importar"
8. Revisa el reporte (productos creados, duplicados, errores)

**Resultado**: 50-100 productos en ~5 minutos ⚡

---

### Opción 2: Presets (Productos comunes)

1. Abre http://localhost:3000/admin
2. Click en "Creación Rápida con Presets"
3. Selecciona una categoría (ej: "Leche en Polvo 🍼")
4. Completa los campos:
   - EAN: `7501234567891`
   - Nombre: `Nido`
   - Marca: `Nestlé` (pre-llenado)
   - Tipo: `Crecimiento` (pre-llenado)
   - Tamaño: `400g` (selecciona de lista)
5. Click en "Crear Producto"

**Resultado**: 1 producto en ~10 segundos ⚡

---

### Opción 3: Scanner (Durante trabajo)

1. Ve a http://localhost:3000 (página principal)
2. Click en "Escanear Código" o "Registrar Vencimiento"
3. Escanea un código de barras
4. Si **no existe** → Se abre formulario automáticamente
5. Completa los campos (con autocompletado)
6. Click en "Crear Producto"
7. Continúa con la operación (agregar a reposición/vencimiento)

**Resultado**: Productos se crean mientras trabajas 🎯

---

## 📂 Archivos Creados

```
src/
├── app/
│   ├── admin/
│   │   └── page.tsx                    # Panel de administración
│   └── api/
│       └── productos/
│           ├── importar-excel/
│           │   └── route.ts            # API importación Excel
│           └── crear-manual/
│               └── route.ts            # API creación manual
├── components/
│   ├── ImportarExcel.tsx               # UI importación Excel
│   ├── FormularioProductoManual.tsx    # Formulario inteligente
│   └── CrearConPreset.tsx              # UI presets
├── lib/
│   ├── mongodb.ts                      # Conexión MongoDB
│   └── presets.ts                      # Sistema de presets
└── types/
    └── index.ts                        # Interfaces MongoDB (actualizado)

docs/
└── MONGODB-SETUP.md                    # Documentación completa

.env.example                            # Template variables de entorno
```

---

## 🎯 Flujo Completo de Trabajo

### Día 1: Setup Inicial (30 min)

```
1. Configurar MongoDB Atlas
2. Agregar MONGODB_URI a .env.local
3. Descargar plantilla Excel
4. Llenar 50 productos base
5. Importar a MongoDB
✅ Tienes 50 SKU listos
```

### Semana 1: Escaneo Diario (5-10 min/día)

```
1. Vas al supermercado
2. Escaneas productos
3. Si no existe → Formulario automático
4. Completas en 15 segundos
✅ Agregaste 20 SKU nuevos
```

### Mes 1: Optimización (2-3 min/día)

```
1. Identificas categorías repetitivas
2. Usas presets para crear variantes
3. 10 segundos por producto
✅ Tienes 200+ SKU en tu catálogo
```

---

## 📊 Estructura de Datos

### Colección: `productos_base`

```json
{
  "_id": "ObjectId",
  "nombre": "Nido",
  "marca": "Nestlé",
  "categoria": "Leche en Polvo",
  "imagen": null,
  "createdAt": "2025-11-19T..."
}
```

### Colección: `productos_variantes`

```json
{
  "_id": "ObjectId",
  "productoBaseId": "ObjectId de productos_base",
  "ean": "7501234567890",
  "nombreCompleto": "Crecimiento 360g",
  "tipo": "Crecimiento",
  "tamano": "360g",
  "volumen": 360,
  "unidad": "G",
  "sabor": null,
  "imagen": null,
  "createdAt": "2025-11-19T..."
}
```

---

## 🐛 Solución de Problemas

### Error: "MONGODB_URI no definido"

```bash
# Verifica que existe .env.local
ls -la .env.local

# Si no existe, créalo:
cp .env.example .env.local

# Edita y agrega tu URI
nano .env.local
```

### Error: "Cannot connect to MongoDB"

1. Verifica que el cluster esté activo en MongoDB Atlas
2. Revisa que tu IP esté en la whitelist
3. Verifica usuario y password en el URI

### Excel no se importa

1. Verifica que las columnas sean exactas:
   - `ProductoBase`, `Marca`, `Categoria`, `TipoVariante`, `Tamaño`, `EAN`, `Sabor`, `Imagen`
2. Descarga la plantilla desde la app para asegurar formato
3. Guarda como `.xlsx` o `.xls`

### Formulario no se abre al escanear

1. Verifica que el código NO exista ya en la base de datos
2. Revisa la consola del navegador para errores
3. Asegúrate de que MongoDB_URI esté configurado

---

## 🎉 ¡Listo!

Ahora tienes un sistema completo de gestión de productos con:

- ✅ Control total de la normalización
- ✅ Base de datos estructurada en MongoDB
- ✅ 3 métodos de población según tu necesidad
- ✅ Sincronización automática con IndexedDB (offline)
- ✅ Interfaz intuitiva y rápida

**Próximos pasos**:

1. Configura tu MongoDB URI
2. Importa tu primer lote de productos
3. Empieza a escanear y la app aprenderá tus productos

Para más detalles, consulta `/docs/MONGODB-SETUP.md` 📚
