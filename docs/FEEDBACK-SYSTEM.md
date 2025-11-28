# Sistema de Feedback para Beta-Testers

Este documento describe el sistema integral de feedback implementado en GondolApp para facilitar la comunicación entre los beta-testers y el equipo de desarrollo.

## 📋 Descripción General

El sistema de feedback permite a los usuarios reportar bugs, sugerencias y problemas de manera estructurada, con captura automática de información técnica y la posibilidad de adjuntar capturas de pantalla.

## 🎯 Características Principales

### Para Usuarios (Beta-Testers)

- **Acceso fácil**: Botón flotante (FAB) disponible en todas las páginas
- **Formulario intuitivo**: Modal con selección de tipo, categoría y prioridad
- **Capturas de pantalla**: Posibilidad de adjuntar imágenes (máx. 5MB)
- **Captura automática de metadata**: Información del dispositivo y navegador

### Para Administradores

- **Panel de gestión**: Dashboard en `/admin/feedback`
- **Filtros avanzados**: Por estado, prioridad, tipo y búsqueda de texto
- **Gestión de estados**: Pendiente, En progreso, Resuelto, Descartado
- **Integración GitHub**: Creación automática de issues

## 🛠️ Componentes del Sistema

### Frontend - Componentes Públicos

```
src/components/feedback/
├── FeedbackFAB.tsx      # Botón flotante accesible desde toda la app
├── FeedbackForm.tsx     # Modal del formulario de feedback
├── FeedbackProvider.tsx # Wrapper cliente para el layout
└── index.ts             # Exports
```

### Frontend - Panel de Administración (Arquitectura SOLID)

```
src/components/feedback/admin/
├── constants.tsx              # Configuración de UI (iconos, colores, opciones)
├── utils.ts                   # Funciones auxiliares (formateo de fechas)
├── FeedbackStatsCards.tsx     # Tarjetas de estadísticas (SRP)
├── FeedbackSearchAndFilters.tsx # Búsqueda y filtros (SRP, OCP)
├── FeedbackReporteListItem.tsx  # Item de lista individual (SRP)
├── FeedbackReporteDetail.tsx    # Vista detallada del reporte (SRP, OCP)
└── index.ts                     # Exports
```

### Hooks Personalizados

```
src/hooks/
└── useFeedbackApi.tsx   # Operaciones de API para feedback (SRP, DIP)
```

### API Routes

```
src/app/api/
├── feedback/
│   └── route.ts         # POST - Envío de feedback público
└── admin/feedback/
    ├── route.ts         # GET - Lista de reportes con filtros
    └── [id]/
        ├── route.ts     # GET/PUT/DELETE - CRUD individual
        └── github-issue/
            └── route.ts # POST - Crear issue en GitHub
```

### Store (Zustand)

```typescript
// src/store/feedback.ts
interface FeedbackStore {
  isFormOpen: boolean;
  openForm: () => void;
  closeForm: () => void;
}
```

## 📊 Modelo de Datos

```typescript
interface FeedbackReporte {
  _id?: string;
  tipo: FeedbackTipo[];           // ["Bug", "Mejora", "Pregunta", "Otro"]
  titulo: string;
  descripcion: string;
  estado: FeedbackEstado;         // "Pendiente" | "En progreso" | "Resuelto" | "Descartado"
  prioridad: FeedbackPrioridad;   // "Baja" | "Media" | "Alta" | "Critica"
  categorias: FeedbackCategoria[]; // ["escaneo", "inventario", "ui/ux", ...]
  metadata: FeedbackMetadata;
  screenshots: string[];
  userEmail?: string;
  userId?: string;
  notas: FeedbackNota[];
  respuesta?: string;
  creadoAt: Date;
  resolvedAt?: Date;
  actualizadoEn: Date;
  leidoEn?: Date;
  historial: FeedbackHistorialEntry[];
  githubIssueUrl?: string;
  githubIssueNumber?: number;
}

interface FeedbackMetadata {
  navegador: string;
  dispositivo: string;
  versionApp: string;
  url: string;
  userAgent: string;
  sistemaOperativo?: string;
  resolucionPantalla?: string;
}
```

## 🔧 Configuración

### Variables de Entorno

Añadir al archivo `.env.local`:

```bash
# MongoDB (requerido)
MONGODB_URI=mongodb+srv://...

# GitHub Integration (opcional, para crear issues)
GITHUB_TOKEN=ghp_xxxxx
GITHUB_REPO_OWNER=tu-usuario
GITHUB_REPO_NAME=tu-repositorio
```

### Obtener Token de GitHub

1. Ir a [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Crear un nuevo token con permisos:
   - `repo` (acceso completo a repositorios)
   - O solo `public_repo` si el repo es público
3. Copiar el token y añadirlo a `.env.local`

## 📖 Uso

### Como Usuario

1. Haz clic en el botón flotante (FAB) en la esquina inferior derecha
2. Selecciona el tipo de reporte (Bug, Sugerencia, Pregunta, Otro)
3. Elige las categorías afectadas
4. Define la prioridad (Baja, Media, Alta)
5. Escribe un título descriptivo (máx. 100 caracteres)
6. Detalla el problema en la descripción
7. Opcionalmente adjunta capturas de pantalla
8. Proporciona tu email si deseas seguimiento
9. Envía el formulario

### Como Administrador

1. Accede a `/admin/feedback` desde el panel de administración
2. Usa los filtros para encontrar reportes específicos
3. Haz clic en un reporte para ver los detalles
4. Cambia el estado y prioridad según sea necesario
5. Usa el botón de GitHub para crear un issue automáticamente
6. El issue creado se vincula al reporte

## 🔗 Integración con GitHub

Cuando se crea un issue desde un reporte:

1. **Título**: `[Feedback] {título del reporte}`
2. **Etiquetas automáticas**:
   - `beta-feedback` (siempre)
   - Tipo: `bug`, `enhancement`, `question`
   - Prioridad: `priority: critical`, `priority: high`, etc.
   - Categorías: `area: escaneo`, `area: inventario`, etc.
3. **Cuerpo del issue**: Información completa del reporte en formato Markdown
4. **Vinculación**: El reporte muestra el número y URL del issue creado

## 🎨 Componente Header Reutilizable

El sistema incluye un componente `Header` reutilizable que proporciona consistencia visual en toda la aplicación.

### Uso

```tsx
import { Header } from "@/components/ui";

// Página principal (variante main)
<Header
  variant="main"
  title="GondolApp"
  subtitle="Gestor de Inventario Inteligente"
  icon={Archive}
  animateIcon
  rightContent={<AdminButton />}
/>

// Páginas internas (variante default)
<Header
  title="Administración"
  subtitle="Gestiona tu catálogo de productos"
  icon={Database}
  backHref="/"
  backText="Volver al Inventario"
  rightContent={<RefreshButton />}
/>
```

### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `title` | `string` | Título principal del header |
| `subtitle` | `string?` | Subtítulo opcional |
| `icon` | `LucideIcon?` | Icono de Lucide a mostrar |
| `backHref` | `string?` | URL para el botón de volver |
| `backText` | `string?` | Texto del botón de volver (default: "Volver") |
| `rightContent` | `ReactNode?` | Contenido personalizado a la derecha |
| `animateIcon` | `boolean?` | Activa animación del icono |
| `variant` | `"default" \| "main"` | Variante del header |

## 🛡️ Seguridad

- **Sanitización XSS**: Todos los campos de texto se sanitizan antes de guardar
- **Validación**: Campos obligatorios y límites de longitud
- **Límite de archivos**: Capturas de pantalla máximo 5MB
- **MongoDB**: Datos almacenados de forma segura en Atlas

## 🏗️ Arquitectura SOLID del Panel de Administración

El panel de administración de feedback sigue los principios SOLID para garantizar código limpio, mantenible y extensible:

### Principios Aplicados

**SRP (Single Responsibility Principle)**:
- Cada componente tiene una única responsabilidad bien definida
- `FeedbackStatsCards`: Solo renderiza estadísticas
- `FeedbackSearchAndFilters`: Solo maneja búsqueda y filtros
- `FeedbackReporteListItem`: Solo renderiza un item de lista
- `FeedbackReporteDetail`: Solo muestra el detalle de un reporte
- `useFeedbackApi`: Solo operaciones de API

**OCP (Open/Closed Principle)**:
- Componentes extensibles sin modificar código existente
- Configuración de colores/iconos en `constants.tsx`
- Nuevos estados/tipos se agregan sin cambiar componentes

**LSP (Liskov Substitution Principle)**:
- Componentes intercambiables con interfaces consistentes
- Todos los componentes admin exportan tipos bien definidos

**ISP (Interface Segregation Principle)**:
- Interfaces específicas por componente
- Props mínimas y necesarias, sin interfaces monolíticas

**DIP (Dependency Inversion Principle)**:
- Página principal depende de abstracciones (hooks y componentes)
- `useFeedbackApi` abstrae todas las llamadas al servidor
- Facilita testing y cambios de implementación

### Estructura del Custom Hook

```typescript
// useFeedbackApi.tsx
interface UseFeedbackApiResult {
  reportes: FeedbackReporte[];
  stats: FeedbackStats | null;
  pagination: FeedbackPagination | null;
  isLoading: boolean;
  isCreatingIssue: boolean;
  fetchReportes: () => Promise<void>;
  actualizarEstado: (id: string, nuevoEstado: FeedbackEstado) => Promise<boolean>;
  actualizarPrioridad: (id: string, nuevaPrioridad: FeedbackPrioridad) => Promise<boolean>;
  eliminarReporte: (id: string) => Promise<boolean>;
  crearGitHubIssue: (id: string) => Promise<{ issueUrl?: string; issueNumber?: number } | null>;
}
```

### Beneficios de la Arquitectura

1. **Mantenibilidad**: Cambios localizados sin efectos secundarios
2. **Testabilidad**: Componentes y hooks fáciles de testear en aislamiento
3. **Reutilización**: Componentes usables en otros contextos
4. **Escalabilidad**: Fácil agregar nuevas funcionalidades
5. **Legibilidad**: Código organizado y auto-documentado

## 📈 Estadísticas

El panel de administración muestra:

- Total de reportes
- Reportes pendientes
- Reportes en progreso
- Reportes resueltos
- Reportes críticos
- Reportes de alta prioridad

---

Desarrollado para GondolApp v2.0 🚀
