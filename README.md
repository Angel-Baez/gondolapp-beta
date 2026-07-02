# GondolApp - Gestión de Inventario PWA

Aplicación web progresiva (PWA) enfocada en dos flujos centrales de un supermercado: la **lista de reposición** y el **control de vencimientos**, con escaneo de códigos de barras.

## 🚀 Características

- ✅ **Escaneo de Códigos de Barras**: usa la cámara del dispositivo para identificar productos
- 📦 **Lista de Reposición**: pendientes / repuestos / sin stock, con historial y estadísticas de listas cerradas
- ⏰ **Control de Vencimientos**: alertas por nivel de urgencia (vencido, crítico, advertencia, precaución, normal), con historial de productos retirados
- 📱 **Instalable**: funciona como app nativa en dispositivos móviles (PWA)
- 🎨 **UI**: Tailwind CSS + animaciones con Framer Motion, modo claro/oscuro
- 🛡️ **Seguridad**: rate limiting con Redis + security headers

## Arquitectura Técnica

### Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Estilos**: Tailwind CSS
- **Estado de servidor**: TanStack React Query (cache de lecturas + mutaciones optimistas)
- **Estado de UI**: Zustand (solo estado de interfaz, no datos de servidor)
- **Base de datos**: Supabase (Postgres) — única fuente de verdad para catálogo, listas activas e historial
- **Escaneo**: html5-qrcode
- **Animaciones**: Framer Motion
- **Rate limiting**: Redis (Upstash)

### Modelo de datos (resumen)

Ver el esquema completo en [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

```typescript
interface ProductoBase {
  id: string;
  nombre: string;
  categoria?: string;
  marca?: string;
  imagen?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductoVariante {
  id: string;
  productoBaseId: string;
  codigoBarras: string;
  nombreCompleto: string;
  tipo?: string;
  tamano?: string;
  sabor?: string;
  imagen?: string;
  createdAt: Date;
}

// Reposición: un solo enum de estado (no dos booleans independientes)
interface ItemReposicion {
  id: string;
  varianteId: string;
  cantidad: number;
  estado: "pendiente" | "repuesto" | "sin_stock";
  agregadoAt: Date;
  actualizadoAt: Date;
}

// Vencimiento: el nivel de alerta se calcula al leer, nunca se persiste
interface ItemVencimiento {
  id: string;
  varianteId: string;
  fechaVencimiento: Date;
  cantidad?: number;
  lote?: string;
  estado: "pendiente" | "retirado";
  agregadoAt: Date;
  resueltoAt?: Date;
}
type AlertaNivel = "vencido" | "critico" | "advertencia" | "precaucion" | "normal";
```

## 📁 Estructura del Proyecto

```
gondolapp-beta/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Home: tabs reposición/vencimiento + escaneo
│   │   ├── QueryProvider.tsx        # React Query provider
│   │   ├── reposicion/historial/    # Historial + estadísticas de reposición
│   │   ├── vencimiento/historial/   # Historial + estadísticas de vencimiento
│   │   └── api/productos/           # buscar (por código de barras) y crear-manual
│   ├── components/
│   │   ├── ui/                      # Primitivas: Button, Card, Badge, Modal, Header...
│   │   ├── reposicion/               # ReposicionList, ReposicionCard, historial
│   │   ├── vencimiento/              # VencimientoList, VencimientoItem
│   │   ├── lists/                    # Primitivos compartidos entre ambas listas
│   │   ├── HomePage/                 # ScanWorkflow y navegación de la home
│   │   └── BarcodeScanner.tsx
│   ├── services/                     # Capa de acceso a datos (funciones planas, sin DI)
│   │   ├── catalogo.ts               # búsqueda/alta de productos
│   │   ├── reposicion.ts             # CRUD + guardar lista + historial + estadísticas
│   │   └── vencimiento.ts            # CRUD + retirar + historial + estadísticas
│   ├── hooks/                        # Hooks de React Query sobre los servicios
│   ├── store/                        # Zustand: solo estado de UI
│   ├── lib/
│   │   ├── supabase.ts               # Cliente Supabase
│   │   └── utils.ts                  # calcularNivelAlerta, formatearFecha, etc.
│   └── types/index.ts
├── supabase/migrations/              # Esquema SQL
├── public/                           # manifest.json, sw.js
└── package.json
```

## 🛠️ Instalación y Desarrollo

### Requisitos

- Node.js 18+
- Un proyecto de [Supabase](https://supabase.com) (gratuito)

### Setup

```bash
git clone <repo>
cd gondolapp-beta
npm install

cp .env.example .env.local
# completar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY

# Aplicar el esquema en tu proyecto Supabase (SQL editor o CLI):
#   supabase/migrations/0001_init.sql

npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## 📱 Instalación como PWA

**Android (Chrome)**: menú (⋮) → "Añadir a la pantalla de inicio".
**iOS (Safari)**: botón compartir → "Añadir a la pantalla de inicio".

## 🎯 Flujos principales

### Reposición

1. Escanear o buscar un producto → se agrega como pendiente.
2. Marcar como **repuesto** o **sin stock** (estado único, no se pueden pisar entre sí).
3. Ajustar cantidad; bajar a 0 lo saca de la lista con opción de deshacer.
4. **Guardar lista** archiva el estado actual en el historial y limpia la lista para el próximo turno.

### Vencimientos

1. Escanear un producto y registrar su fecha de vencimiento (+ cantidad/lote opcional).
2. Los productos se agrupan por nivel de alerta: vencido, crítico (0-15 días), advertencia (15-30), precaución (30-60), normal (+60).
3. **Retirar** archiva el producto en el historial de vencimientos (con la fecha de retiro y el nivel de alerta al momento de retirarlo).

## 🎨 Niveles de alerta de vencimiento

| Nivel | Rango | Color |
|---|---|---|
| Vencido | Ya pasó la fecha | Rojo oscuro |
| Crítico | 0–15 días | Rojo |
| Advertencia | 15–30 días | Naranja |
| Precaución | 30–60 días | Amarillo |
| Normal | +60 días | Gris |

## 🔐 Seguridad

Rate limiting (Upstash Redis) sobre `/api/productos/buscar` y `/api/productos/crear-manual`, más security headers (CSP, X-Frame-Options, etc.) aplicados en `src/proxy.ts`.

## 📝 Licencia

MIT.
