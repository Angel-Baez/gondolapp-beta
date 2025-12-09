# ADR-003: Estructura de Componentes Nativos

> **Fecha:** 9 de diciembre de 2025  
> **Estado:** Aprobado  
> **Decisores:** Frontend Architect  
> **Contexto:** Rediseño UX Nativo (REDISENO-UX-NATIVO.md)

---

## Contexto

El PRD de Rediseño UX Nativo especifica la creación de múltiples componentes nuevos:

```
Nuevos Componentes Requeridos (del PRD):
├── BottomTabBar.tsx        # US-001
├── FloatingActionButton.tsx # US-002
├── BottomSheet.tsx         # US-003 (ya existe - mejorar)
├── SwipeableRow.tsx        # US-004
├── PullToRefresh.tsx       # US-005
├── SkeletonLoader.tsx      # US-007
├── NativeCard.tsx          # US-009
└── HapticButton.tsx        # US-006
```

Se debe decidir:

1. **Ubicación** de los nuevos componentes en el filesystem
2. **Patrón de composición** vs componentes monolíticos
3. **Estrategia de exports** (barrel files vs imports directos)
4. **Relación con componentes `/ui` existentes**

---

## Decisión

### ✅ OPCIÓN ELEGIDA: Directorio `/native` separado + Composición

Crear un nuevo directorio `src/components/native/` para componentes específicos de experiencia móvil nativa, manteniendo `/ui` para primitivos de diseño.

---

## Justificación

### Estructura Actual del Proyecto

```
src/components/
├── ui/                    # Primitivos de diseño ← Mantener
│   ├── Badge.tsx
│   ├── BottomSheet.tsx   # ⚠️ Mover a /native
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── ConfirmDialog.tsx
│   ├── Header.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── index.ts
│
├── features/             # Por feature (HomePage, AdminPage, etc.)
├── BarcodeScanner.tsx    # Componentes sueltos
└── ...
```

### Estructura Propuesta

```
src/components/
├── ui/                    # Primitivos de diseño (sin cambios)
│   ├── Badge.tsx
│   ├── Button.tsx         # Mantener (ya tiene whileTap)
│   ├── Card.tsx
│   ├── ConfirmDialog.tsx
│   ├── Header.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── index.ts
│
├── native/               # 🆕 Componentes móvil-first
│   ├── index.ts           # Barrel export
│   ├── BottomTabBar/
│   │   ├── BottomTabBar.tsx
│   │   ├── TabItem.tsx
│   │   └── index.ts
│   ├── FloatingActionButton.tsx
│   ├── BottomSheet.tsx    # Migrado desde /ui
│   ├── SwipeableRow/
│   │   ├── SwipeableRow.tsx
│   │   ├── SwipeAction.tsx
│   │   └── index.ts
│   ├── PullToRefresh.tsx
│   ├── SkeletonLoader.tsx
│   └── NativeCard.tsx
│
├── features/             # Sin cambios
└── ...
```

---

## Principios de Diseño

### 1. Separación de Responsabilidades

| Directorio  | Propósito                          | Ejemplos             |
| ----------- | ---------------------------------- | -------------------- |
| `/ui`       | Primitivos de diseño reutilizables | Button, Input, Badge |
| `/native`   | Experiencia móvil nativa           | TabBar, FAB, Swipe   |
| `/features` | Lógica de negocio por módulo       | HomePage, AdminPage  |

### 2. Composición sobre Herencia

Los componentes `/native` **consumen** componentes de `/ui`:

```tsx
// native/NativeCard.tsx - COMPONE con ui/Card
import { Card, CardHeader, CardBody } from "@/components/ui";
import { motion } from "framer-motion";

export function NativeCard({ children, onPress, ...props }) {
  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Card {...props}>{children}</Card>
    </motion.div>
  );
}
```

### 3. API Consistente

Todos los componentes `/native` siguen convenciones:

```typescript
// Props pattern estándar
interface NativeComponentProps {
  // Styling
  className?: string;

  // Accessibility
  "aria-label"?: string;

  // Haptics (donde aplique)
  hapticFeedback?: boolean; // default: true

  // Common handlers
  onPress?: () => void;
}
```

---

## Especificaciones por Componente

### 1. BottomTabBar (US-001)

```
native/BottomTabBar/
├── BottomTabBar.tsx       # Container principal
├── TabItem.tsx            # Item individual
├── TabIndicator.tsx       # Indicador animado de tab activo
└── index.ts               # Exports
```

**Props principales:**

```typescript
interface BottomTabBarProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  showLabels?: boolean; // default: true
  hapticFeedback?: boolean; // default: true
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string; // Para navegación
  action?: () => void; // Para acciones (ej: scanner)
  badge?: number; // Notificación
}
```

**Diseño:**

```
┌─────────────────────────────────────────────┐
│  📦      ⏰       ➕       📊      ⚙️    │
│ Repos.  Venc.   Escanear  Hist.    Más    │
│  ____                                      │  ← Indicador animado
└─────────────────────────────────────────────┘
   56px altura + safe-area-bottom
```

### 2. FloatingActionButton (US-002)

**Archivo único** (no necesita subdirectorio):

```typescript
// native/FloatingActionButton.tsx

interface FABProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary";
  size?: "normal" | "mini"; // 56px | 40px
  position?: "bottom-right" | "bottom-center";
  visible?: boolean; // Para ocultar durante scan
  label?: string; // Screen reader
}
```

**Posicionamiento:**

```css
/* Encima del TabBar */
bottom: calc(56px + 16px + env(safe-area-inset-bottom));
right: 16px;
```

### 3. BottomSheet (US-003) - MEJORAR

Migrar desde `/ui` y agregar features:

```typescript
// Nuevas props a agregar
interface BottomSheetProps {
  // Existentes...

  // Nuevas:
  snapPoints?: number[]; // Ej: [0.25, 0.5, 0.9]
  initialSnap?: number; // Índice del snap inicial
  onSnapChange?: (index: number) => void;
  preventClose?: boolean; // Para formularios críticos
  fullScreen?: boolean; // 100vh mode
}
```

### 4. SwipeableRow (US-004)

```
native/SwipeableRow/
├── SwipeableRow.tsx       # Container con drag
├── SwipeAction.tsx        # Botón de acción revelada
└── index.ts
```

```typescript
interface SwipeableRowProps {
  children: React.ReactNode;

  // Acciones
  leftActions?: SwipeActionConfig[]; // Swipe derecha → revela izq
  rightActions?: SwipeActionConfig[]; // Swipe izquierda → revela der

  // Comportamiento
  threshold?: number; // px para trigger (default: 100)
  fullSwipeAction?: "left" | "right"; // Acción al swipe completo

  // Feedback
  hapticFeedback?: boolean;
}

interface SwipeActionConfig {
  key: string;
  icon: React.ReactNode;
  label: string;
  color: string; // bg color
  onPress: () => void;
}
```

### 5. PullToRefresh (US-005)

**Wrapper component:**

```typescript
// native/PullToRefresh.tsx

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean; // Controlled mode
  threshold?: number; // default: 80px

  // Customización
  spinnerComponent?: React.ReactNode;
  pullIndicator?: React.ReactNode;
}

// Uso:
<PullToRefresh onRefresh={handleRefresh}>
  <ProductList items={items} />
</PullToRefresh>;
```

### 6. SkeletonLoader (US-007)

```typescript
// native/SkeletonLoader.tsx

interface SkeletonProps {
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
  className?: string;
}

// Presets para el proyecto
export const ProductCardSkeleton = () => (
  <div className="flex gap-3 p-4">
    <Skeleton variant="rectangular" width={60} height={60} />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
    </div>
  </div>
);
```

### 7. NativeCard (US-009)

Extensión de `/ui/Card` con:

```typescript
// native/NativeCard.tsx

interface NativeCardProps extends CardProps {
  // Press feedback
  pressable?: boolean;
  onPress?: () => void;

  // Visual
  elevation?: 1 | 2 | 3 | 4; // Nivel de sombra
  hapticFeedback?: boolean;

  // Estado
  isActive?: boolean;
  isDisabled?: boolean;
}
```

---

## Barrel Exports

### `/native/index.ts`

```typescript
// Componentes principales
export { BottomTabBar } from "./BottomTabBar";
export { FloatingActionButton } from "./FloatingActionButton";
export { BottomSheet } from "./BottomSheet";
export { SwipeableRow } from "./SwipeableRow";
export { PullToRefresh } from "./PullToRefresh";
export { SkeletonLoader, ProductCardSkeleton } from "./SkeletonLoader";
export { NativeCard } from "./NativeCard";

// Types
export type { BottomTabBarProps, TabConfig } from "./BottomTabBar";
export type { FABProps } from "./FloatingActionButton";
export type { SwipeableRowProps, SwipeActionConfig } from "./SwipeableRow";
// ... etc
```

### Uso en la app

```tsx
// Imports limpios desde barrel
import {
  BottomTabBar,
  FloatingActionButton,
  SwipeableRow,
} from "@/components/native";

// O imports específicos para tree-shaking
import { BottomTabBar } from "@/components/native/BottomTabBar";
```

---

## Migración de BottomSheet

### Plan de Migración

1. **Copiar** `ui/BottomSheet.tsx` → `native/BottomSheet.tsx`
2. **Agregar** nuevas features (snap points)
3. **Actualizar** imports en archivos que lo usan
4. **Deprecar** `ui/BottomSheet.tsx` con comentario
5. **Eliminar** `ui/BottomSheet.tsx` después de verificar

```typescript
// ui/BottomSheet.tsx - Deprecation notice
/**
 * @deprecated Use @/components/native/BottomSheet instead.
 * This will be removed in v2.0.
 */
export { BottomSheet } from "../native/BottomSheet";
```

---

## Dependencias entre Componentes

```
┌─────────────────────────────────────────────────────────┐
│                        APP LAYOUT                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │               Page Content                       │    │
│  │   ┌─────────────────────────────────────────┐   │    │
│  │   │  PullToRefresh                          │   │    │
│  │   │   ┌─────────────────────────────────┐   │   │    │
│  │   │   │  SwipeableRow (list items)      │   │   │    │
│  │   │   │   └── NativeCard                │   │   │    │
│  │   │   └─────────────────────────────────┘   │   │    │
│  │   └─────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌───────────────────────────────────────────────┐      │
│  │  FloatingActionButton (fixed)                 │      │
│  └───────────────────────────────────────────────┘      │
│                                                          │
│  ┌───────────────────────────────────────────────┐      │
│  │  BottomTabBar (fixed)                         │      │
│  └───────────────────────────────────────────────┘      │
│                                                          │
│  ┌───────────────────────────────────────────────┐      │
│  │  BottomSheet (portal/overlay)                 │      │
│  └───────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## Z-Index Strategy

Para evitar conflictos de capas:

```typescript
// src/lib/constants.ts

export const Z_INDEX = {
  // Contenido base
  content: 0,

  // Elementos sticky/fixed
  header: 10,
  tabBar: 20,
  fab: 25,

  // Overlays
  backdrop: 40,
  bottomSheet: 50,
  modal: 60,

  // Máxima prioridad
  toast: 100,
} as const;
```

---

## CSS Utilities Requeridos

Agregar a `globals.css`:

```css
/* Safe areas para dispositivos con notch */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-all {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(
      safe-area-inset-bottom
    ) env(safe-area-inset-left);
}

/* Scroll nativo optimizado */
.native-scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* Touch targets mínimos */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* Skeleton shimmer animation */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Dark mode skeleton */
.dark .skeleton-shimmer {
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
}
```

---

## Checklist de Implementación

### Sprint 1 (Must Have)

- [ ] Crear directorio `src/components/native/`
- [ ] Crear `native/index.ts` con exports
- [ ] Implementar `BottomTabBar` + `TabItem`
- [ ] Implementar `FloatingActionButton`
- [ ] Migrar y mejorar `BottomSheet`
- [ ] Agregar CSS utilities a `globals.css`

### Sprint 2 (Should Have)

- [ ] Implementar `SwipeableRow` + `SwipeAction`
- [ ] Implementar `NativeCard`
- [ ] Crear constantes de z-index

### Sprint 3 (Could Have)

- [ ] Implementar `PullToRefresh`
- [ ] Implementar `SkeletonLoader`

---

## Referencias

- [PRD: REDISENO-UX-NATIVO.md](../product/REDISENO-UX-NATIVO.md)
- [ADR-001: Estrategia de Animaciones](./ADR-001-ESTRATEGIA-ANIMACIONES.md)
- [ADR-002: Gestión de Gestos](./ADR-002-GESTION-GESTOS.md)
- [Componentes UI actuales](../../src/components/ui/)
- [Apple HIG - Components](https://developer.apple.com/design/human-interface-guidelines/components)
