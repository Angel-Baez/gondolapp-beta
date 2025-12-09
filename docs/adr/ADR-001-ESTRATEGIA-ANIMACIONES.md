# ADR-001: Estrategia de Animaciones

> **Fecha:** 9 de diciembre de 2025  
> **Estado:** Aprobado  
> **Decisores:** Frontend Architect  
> **Contexto:** Rediseño UX Nativo (REDISENO-UX-NATIVO.md)

---

## Contexto

El PRD de Rediseño UX Nativo requiere animaciones fluidas a 60fps que incluyen:

- Transiciones de tabs (fade + slide)
- Apertura/cierre de modales (slide up/down)
- Animaciones de lista (add/remove items)
- Feedback de presión en botones (scale)
- Pull-to-refresh y swipe actions

Se debe elegir la estrategia de implementación entre:

1. **CSS Transitions/Animations puras** (Tailwind)
2. **Framer Motion** (ya instalado en el proyecto)
3. **React Spring**
4. **Solución híbrida**

---

## Decisión

### ✅ OPCIÓN ELEGIDA: Framer Motion (continuar con stack actual)

**Mantener y extender el uso de Framer Motion** como librería principal de animaciones.

---

## Justificación

### Factores a Favor de Framer Motion

| Factor                        | Puntuación | Razonamiento                                                |
| ----------------------------- | ---------- | ----------------------------------------------------------- |
| **Ya instalado**              | ⭐⭐⭐⭐⭐ | `framer-motion@12.23.24` ya está en `package.json`          |
| **Ya en uso**                 | ⭐⭐⭐⭐⭐ | `BottomSheet`, `Button`, `Card` ya usan `motion` components |
| **API de gestos**             | ⭐⭐⭐⭐⭐ | `drag`, `pan`, `whileTap` integrados nativamente            |
| **Performance**               | ⭐⭐⭐⭐   | WAAPI bajo el capó, GPU-accelerated                         |
| **AnimatePresence**           | ⭐⭐⭐⭐⭐ | Exit animations ya funcionan en BottomSheet                 |
| **Spring physics**            | ⭐⭐⭐⭐⭐ | `springConfig` ya definido en BottomSheet                   |
| **Bundle size**               | ⭐⭐⭐     | ~45KB gzipped (aceptable para PWA)                          |
| **DX (Developer Experience)** | ⭐⭐⭐⭐⭐ | API declarativa, fácil de leer                              |

### Opciones Descartadas

#### ❌ CSS puro (Tailwind)

- **Pro:** Zero bundle overhead
- **Contra:** No soporta exit animations, gestos limitados, sin spring physics
- **Veredicto:** Insuficiente para US-004 (swipe) y US-005 (pull-to-refresh)

#### ❌ React Spring

- **Pro:** Excelente física de springs
- **Contra:** Requiere migración de código existente, API diferente
- **Contra:** No añade valor sobre Framer Motion ya instalado
- **Veredicto:** Costo de migración no justificado

#### ❌ Híbrido (CSS + FM)

- **Pro:** Menor uso de FM para animaciones simples
- **Contra:** Inconsistencia en patterns, más difícil de mantener
- **Veredicto:** Complejidad innecesaria

---

## Especificaciones Técnicas

### Configuración de Springs Estándar

Crear archivo de configuración centralizada:

```typescript
// src/lib/animations.ts

export const springs = {
  // iOS-like spring (ya usado en BottomSheet)
  native: {
    type: "spring" as const,
    damping: 26,
    stiffness: 400,
    mass: 0.8,
  },

  // Para elementos pequeños (botones, chips)
  snappy: {
    type: "spring" as const,
    damping: 30,
    stiffness: 500,
    mass: 0.5,
  },

  // Para transiciones de página/modales
  smooth: {
    type: "spring" as const,
    damping: 25,
    stiffness: 300,
    mass: 1,
  },

  // Para gestos de arrastre
  gesture: {
    type: "spring" as const,
    damping: 20,
    stiffness: 200,
    mass: 0.8,
  },
} as const;

export const durations = {
  instant: 0.1, // 100ms - button press
  fast: 0.15, // 150ms - small transitions
  normal: 0.2, // 200ms - standard
  slow: 0.3, // 300ms - modales, sheets
} as const;

export const easings = {
  easeOut: [0.0, 0.0, 0.2, 1], // entrada
  easeIn: [0.4, 0.0, 1, 1], // salida
  easeInOut: [0.4, 0.0, 0.2, 1], // ambos
} as const;
```

### Variantes Reutilizables

```typescript
// src/lib/animations.ts (continuación)

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const slideFromBottom = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
};

export const slideFromRight = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "-50%", opacity: 0 },
};

export const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};
```

### Uso en Componentes

```tsx
// Ejemplo: List item animado
import { motion } from "framer-motion";
import { springs, slideFromRight } from "@/lib/animations";

function ListItem({ item, onRemove }) {
  return (
    <motion.div
      layout // Para animaciones de reordenamiento
      initial="initial"
      animate="animate"
      exit="exit"
      variants={slideFromRight}
      transition={springs.native}
    >
      {/* contenido */}
    </motion.div>
  );
}
```

---

## Patrones de Implementación por User Story

| User Story             | Animación              | Técnica FM                     |
| ---------------------- | ---------------------- | ------------------------------ |
| US-001 Tab Bar         | Tab indicator slide    | `layoutId` + `motion.div`      |
| US-002 FAB             | Scale on press         | `whileTap={{ scale: 0.95 }}`   |
| US-003 Bottom Sheet    | Slide up/down + drag   | ✅ Ya implementado             |
| US-004 Swipe Actions   | Horizontal drag + snap | `drag="x"` + `dragConstraints` |
| US-005 Pull to Refresh | Vertical drag + spring | `drag="y"` + threshold         |
| US-010 Transitions     | Various                | `AnimatePresence` + variants   |

---

## Consideraciones de Performance

### 1. GPU Acceleration

Framer Motion usa `transform` y `opacity` por defecto → GPU accelerated ✅

### 2. Layout Animations

Usar `layout` prop con cuidado:

```tsx
// ✅ Bueno: layout en contenedores pequeños
<motion.div layout>...</motion.div>

// ⚠️ Cuidado: No usar layout en listas grandes sin virtualización
```

### 3. Exit Animations

Siempre envolver con `AnimatePresence`:

```tsx
<AnimatePresence mode="wait">
  {isVisible && <motion.div exit={{ opacity: 0 }} />}
</AnimatePresence>
```

### 4. Reduced Motion

Respetar preferencias del usuario:

```tsx
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// Usar en contexto global
```

---

## Métricas de Éxito

| Métrica                 | Objetivo           | Medición                    |
| ----------------------- | ------------------ | --------------------------- |
| FPS durante animaciones | ≥ 55fps            | Chrome DevTools Performance |
| Jank frames             | < 5%               | PerformanceObserver         |
| Time to Interactive     | No aumentar > 50ms | Lighthouse                  |
| Bundle size delta       | < 5KB adicionales  | webpack-bundle-analyzer     |

---

## Próximos Pasos

1. **Crear `src/lib/animations.ts`** con configuración centralizada
2. **Migrar constants** del BottomSheet actual a archivo compartido
3. **Implementar hook `useReducedMotion`** para accesibilidad
4. **Documentar patterns** en Storybook (si existe)

---

## Referencias

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Motion performance tips](https://www.framer.com/motion/performance/)
- [PRD: REDISENO-UX-NATIVO.md](../product/REDISENO-UX-NATIVO.md)
- [Implementación actual: BottomSheet.tsx](../../src/components/ui/BottomSheet.tsx)
