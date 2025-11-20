# GondolApp - Gestión de Inventario PWA

Aplicación web progresiva (PWA) para la gestión de inventario de supermercado con escaneo de códigos de barras y control de vencimientos.

## 🚀 Características

### Funcionalidades Principales

- ✅ **Escaneo de Códigos de Barras**: Utiliza la cámara del dispositivo para escanear productos
- 📦 **Lista de Reposición**: Gestiona productos que necesitan ser recomprados
- ⏰ **Control de Vencimientos**: Sistema de alertas para productos próximos a vencer
- 🔄 **Funcionamiento Offline**: Todos los datos se almacenan localmente
- 📱 **Instalable**: Funciona como app nativa en dispositivos móviles
- 🎨 **UI Moderna**: Diseño con Tailwind CSS y animaciones con Framer Motion

### Arquitectura Técnica

#### Stack Tecnológico

- **Frontend**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: Zustand
- **Base de Datos Local**: IndexedDB (Dexie.js)
- **Escaneo**: @zxing/browser
- **Animaciones**: Framer Motion
- **API Externa**: Open Food Facts
- **🆕 IA**: Google Gemini 1.5 Flash (normalización inteligente)

#### Sistema de Normalización IA-First 🤖

GondolApp v2.0 implementa un sistema donde **la IA es la fuente principal** de normalización:

**Flujo de Procesamiento:**

```
Escaneo → Cache Local → Open Food Facts API → 🤖 IA Gemini → Sanitización → Guardar
```

**Características:**

- ✅ **IA como fuente principal**: Detección inteligente de marcas y sub-marcas
- ✅ **Fallback robusto**: Normalización básica si IA falla
- ✅ **Sanitización pura**: `normalizador.ts` solo limpia datos, no decide
- ✅ **Offline-first**: Cache local instantáneo (5ms)
- ✅ **Económico**: ~$0.000045 por producto nuevo

**Ejemplos de Normalización:**

| Producto Escaneado                        | Marca     | Nombre Base    | Variante       |
| ----------------------------------------- | --------- | -------------- | -------------- |
| "Leche UHT Rica Listamilk Sin Lactosa 1L" | Rica      | Listamilk      | Sin Lactosa 1L |
| "Coca-Cola Zero 500ml"                    | Coca-Cola | Coca-Cola Zero | 500ml          |
| "Milex Kinder Gold 2000g"                 | Milex     | Milex Kinder   | Gold 2000g     |

📖 **Arquitectura completa**: [`docs/ARQUITECTURA-IA-FIRST.md`](docs/ARQUITECTURA-IA-FIRST.md)  
🔑 **Configurar Gemini API**: [`docs/GEMINI-API-SETUP.md`](docs/GEMINI-API-SETUP.md)

#### Estructura de Datos

```typescript
// Producto Base
interface ProductoBase {
  id: string;
  nombre: string;
  categoria?: string;
  marca?: string;
  imagen?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Variante de Producto
interface ProductoVariante {
  id: string;
  productoBaseId: string;
  codigoBarras: string;
  nombreCompleto: string;
  tipo?: string;
  tamano?: string;
  imagen?: string;
  createdAt: Date;
}

// Item de Reposición
interface ItemReposicion {
  id: string;
  varianteId: string;
  cantidad: number;
  repuesto: boolean;
  sinStock: boolean;
  agregadoAt: Date;
  actualizadoAt: Date;
}

// Item de Vencimiento
interface ItemVencimiento {
  id: string;
  varianteId: string;
  fechaVencimiento: Date;
  cantidad?: number;
  lote?: string;
  agregadoAt: Date;
  alertaNivel: "critico" | "advertencia" | "precaucion" | "normal";
}
```

## 📁 Estructura del Proyecto

```
gondolapp-beta/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Página principal
│   │   ├── globals.css        # Estilos globales
│   │   └── PWAProvider.tsx    # Proveedor de PWA
│   ├── components/            # Componentes React
│   │   ├── ui/                # Componentes base
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   ├── reposicion/        # Módulo de reposición
│   │   │   ├── ReposicionList.tsx
│   │   │   └── ReposicionCard.tsx
│   │   ├── vencimiento/       # Módulo de vencimientos
│   │   │   ├── VencimientoList.tsx
│   │   │   └── VencimientoItem.tsx
│   │   └── BarcodeScanner.tsx # Escáner de códigos
│   ├── store/                 # Zustand stores
│   │   ├── producto.ts
│   │   ├── reposicion.ts
│   │   └── vencimiento.ts
│   ├── lib/                   # Utilidades y configuración
│   │   ├── db.ts             # Configuración de Dexie
│   │   └── utils.ts          # Funciones auxiliares
│   ├── services/              # Servicios externos
│   │   └── openFoodFacts.ts  # API de Open Food Facts
│   ├── types/                 # Definiciones de tipos
│   │   └── index.ts
│   └── hooks/                 # Custom hooks
│       └── usePWA.ts         # Hook para PWA
├── public/                    # Archivos estáticos
│   ├── manifest.json         # Manifest de PWA
│   └── sw.js                 # Service Worker
├── next.config.js            # Configuración de Next.js
├── tailwind.config.ts        # Configuración de Tailwind
├── tsconfig.json            # Configuración de TypeScript
└── package.json             # Dependencias del proyecto
```

## 🛠️ Instalación y Desarrollo

### Requisitos Previos

- Node.js 18+
- npm o yarn
- API Key de Google Gemini (opcional, pero recomendada)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/gondolapp-beta.git
cd gondolapp-beta

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local y agregar tu NEXT_PUBLIC_GEMINI_API_KEY

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar servidor de producción
npm start
```

La aplicación estará disponible en `http://localhost:3000`

### ⚙️ Configuración de IA (Recomendada)

Para obtener normalización inteligente de productos:

1. **Obtener API Key de Gemini:**

   - Ir a [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Crear/copiar tu API key

2. **Configurar `.env.local`:**

   ```bash
   NEXT_PUBLIC_GEMINI_API_KEY=tu_api_key_aqui
   ```

3. **Reiniciar el servidor:**
   ```bash
   npm run dev
   ```

**Importante:** Si no configuras la IA, la app funciona igual con normalización básica.

📖 **Guía completa**: [`docs/GEMINI-API-SETUP.md`](docs/GEMINI-API-SETUP.md)  
🐛 **Troubleshooting Error 404**: [`docs/SOLUCION-ERROR-404-GEMINI.md`](docs/SOLUCION-ERROR-404-GEMINI.md)  
🔧 **Respuesta Vacía IA**: [`docs/SOLUCION-RESPUESTA-VACIA-IA.md`](docs/SOLUCION-RESPUESTA-VACIA-IA.md)

## 📱 Instalación como PWA

### En Android (Chrome)

1. Abre la aplicación en Chrome
2. Toca el menú (⋮) > "Añadir a la pantalla de inicio"
3. Confirma la instalación

### En iOS (Safari)

1. Abre la aplicación en Safari
2. Toca el botón de compartir
3. Selecciona "Añadir a la pantalla de inicio"

## 🎯 Flujos de Usuario

### Agregar Producto a Reposición

1. Usuario toca el botón flotante "+"
2. Escanea el código de barras con la cámara
3. La app busca el producto (primero local, luego API)
4. Ajusta la cantidad deseada
5. Confirma y se agrega a la lista

### Marcar como Repuesto

1. Expande la tarjeta del producto
2. Toca el checkbox "✓" en la variante
3. El producto se marca como repuesto

### Registrar Vencimiento

1. Cambia a la vista "Vencimientos"
2. Toca el botón flotante "+"
3. Escanea el producto
4. Ingresa la fecha de vencimiento
5. Opcionalmente añade cantidad y lote
6. El sistema calcula automáticamente el nivel de alerta

## 🎨 Sistema de Alertas de Vencimiento

- **Crítico** (Rojo): Producto vencido o vence en menos de 15 días
- **Advertencia** (Amarillo): Vence en 15-30 días
- **Precaución** (Naranja): Vence en 30-60 días
- **Normal** (Gris): Vence en más de 60 días

## 🔧 Optimizaciones

### Performance

- Lazy loading de componentes
- Imágenes optimizadas
- Paginación virtual para listas largas
- Caching agresivo con Service Worker

### UX Mobile

- Touch targets mínimo 44x44px
- Swipe gestures
- Haptic feedback
- PWA instalable

### Offline-First

- Todos los datos en IndexedDB
- Service Worker con estrategias de cache
- Funciona completamente sin conexión
- Sincronización cuando hay conexión

## 🔐 Privacidad y Datos

- **Local-First**: Todos los datos se almacenan localmente en el dispositivo
- **Sin servidor**: No se requiere backend ni cuenta de usuario
- **Sin tracking**: No se recopilan datos de usuario
- **Open Food Facts**: API pública para información de productos

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📧 Soporte

Para reportar bugs o solicitar features, abre un issue en el repositorio.

---

Desarrollado con ❤️ usando Next.js y TypeScript
