# Contexto Compartido de GondolApp

> Este archivo contiene el contexto común que todos los agentes de GondolApp deben conocer.
> Cada agente debe referenciar este contexto en lugar de duplicarlo.

## ¿Qué es GondolApp?

GondolApp es una **Progressive Web App (PWA)** de gestión de inventario diseñada específicamente para supermercados y retail. Permite al personal de tienda gestionar eficientemente el inventario, controlar fechas de vencimiento y manejar reposición de productos.

## Características Principales

- **Escaneo de códigos de barras**: Identificación rápida de productos con la cámara del dispositivo
- **Gestión offline-first**: Funciona completamente sin conexión gracias a IndexedDB (Dexie.js)
- **Control de vencimientos**: Sistema de alertas automáticas por niveles (crítico, advertencia, precaución)
- **Normalización con IA**: Gemini normaliza datos de productos de Open Food Facts
- **Rate limiting**: Protección de APIs con Upstash Redis
- **PWA completa**: Instalable, con Service Worker y sincronización posterior

## Stack Tecnológico

### Frontend
| Tecnología | Propósito |
|------------|-----------|
| **Next.js 16** | Framework (App Router, Server Components) |
| **TypeScript** | Lenguaje (strict mode) |
| **Tailwind CSS** | Estilos |
| **Framer Motion** | Animaciones |
| **Zustand** | Estado de UI (solo estado efímero) |
| **Dexie.js** | IndexedDB para persistencia offline |
| **html5-qrcode** | Escaneo de códigos de barras |

### Backend / Infraestructura
| Tecnología | Propósito |
|------------|-----------|
| **MongoDB Atlas** | Base de datos remota |
| **Upstash Redis** | Rate limiting y cache |
| **Google Gemini API** | Normalización con IA |
| **Vercel** | Hosting y Edge Functions |
| **GitHub Actions** | CI/CD |

## Arquitectura SOLID

GondolApp implementa una arquitectura **SOLID** estricta con los siguientes patrones:

- **Dependency Injection**: IoC Container para inyección de dependencias
- **Repository Pattern**: Abstracción de persistencia (IndexedDB, MongoDB)
- **Strategy Pattern**: Data sources intercambiables
- **Chain of Responsibility**: Pipeline de normalización (Gemini → Regex → Manual)
- **Facade Pattern**: Servicios que simplifican la complejidad

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  React Components + Tailwind + Framer Motion                 │
├─────────────────────────────────────────────────────────────┤
│                    STATE MANAGEMENT                          │
│  Zustand (UI State) + React Query (Server State)             │
├─────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                      │
│  Services (Facades) + Normalizers (Chain) + Validators       │
├─────────────────────────────────────────────────────────────┤
│                    DATA ACCESS LAYER                         │
│  Repositories (IndexedDB) + DataSources (Strategy)           │
├─────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                      │
│  IndexedDB (Dexie) + MongoDB Atlas + Upstash Redis           │
└─────────────────────────────────────────────────────────────┘
```

## Modelo de Datos

### Tablas IndexedDB (Dexie.js)

| Tabla | Propósito | Campos Clave |
|-------|-----------|--------------|
| `productosBase` | Productos genéricos (ej: "Coca-Cola") | `id`, `nombre`, `marca`, `categoria` |
| `productosVariantes` | SKUs específicos con código de barras | `id`, `productoBaseId`, `codigoBarras` |
| `itemsReposicion` | Lista de productos a reponer | `id`, `varianteId`, `cantidad`, `repuesto` |
| `itemsVencimiento` | Control de fechas de vencimiento | `id`, `varianteId`, `fechaVencimiento`, `alertaNivel` |

### Relaciones

```
ProductoBase (1) ──────< ProductoVariante (N)
                              │
                              ├──── ItemReposicion
                              └──── ItemVencimiento
```

## Usuarios Objetivo

**Personal de supermercado** trabajando en ambiente retail:
- Frecuentemente usando guantes
- Necesitan realizar operaciones rápidas
- Ambiente con iluminación variable
- Conectividad inestable o inexistente
- Dispositivos móviles de gama media

## Métricas de Calidad

| Métrica | Objetivo |
|---------|----------|
| Lighthouse Performance | >= 96/100 |
| Lighthouse Accessibility | >= 95/100 |
| LCP (Largest Contentful Paint) | < 2.5s |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| Funcionamiento Offline | 100% de features core |

## Flujo Principal: Escaneo de Producto

```
┌──────────┐     ┌──────────────┐     ┌────────────────┐
│  Cámara  │────▶│ BarcodeScanner│────▶│ ProductService │
└──────────┘     └──────────────┘     └───────┬────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
            │ LocalDataSrc │         │ MongoDataSrc │         │ OFFDataSrc   │
            │ (IndexedDB)  │         │ (API Route)  │         │ (External)   │
            └──────────────┘         └──────────────┘         └──────────────┘
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              ▼
                                    ┌──────────────────┐
                                    │  NormalizerChain │
                                    │  (Gemini→Regex→  │
                                    │   Manual)        │
                                    └──────────────────┘
```

## Estructura del Proyecto

```
src/
├── app/              # App Router de Next.js
│   ├── api/          # API Routes
│   └── page.tsx      # Página principal
├── components/       # Componentes React
│   ├── ui/           # Componentes reutilizables
│   ├── feedback/     # Sistema de feedback
│   ├── reposicion/   # Módulo de reposición
│   └── vencimiento/  # Módulo de vencimientos
├── core/             # Arquitectura SOLID
│   ├── interfaces/   # Abstracciones
│   ├── repositories/ # Persistencia
│   ├── normalizers/  # Normalización
│   ├── datasources/  # Fuentes de datos
│   └── services/     # Lógica de negocio
├── lib/              # Utilidades
│   ├── db.ts         # IndexedDB (Dexie)
│   └── hooks/        # Custom hooks
└── types/            # Tipos TypeScript
```

## Comandos Principales

```bash
npm run dev     # Servidor de desarrollo (:3000)
npm run build   # Build de producción
npm run start   # Servidor de producción
npm run lint    # ESLint check
```

## Enlaces de Referencia

- **Repositorio**: `Angel-Baez/gondolapp-beta`
- **Documentación**: `docs/`
- **Agentes**: `.github/agents/`
- **Arquitectura SOLID**: `docs/SOLID-PRINCIPLES.md`

---

> **Nota**: Este contexto debe mantenerse actualizado cuando haya cambios significativos en la arquitectura o stack de GondolApp.
