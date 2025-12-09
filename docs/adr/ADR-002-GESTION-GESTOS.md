# ADR-002: Gestión de Gestos

> **Fecha:** 9 de diciembre de 2025  
> **Estado:** Aprobado  
> **Decisores:** Frontend Architect  
> **Contexto:** Rediseño UX Nativo (REDISENO-UX-NATIVO.md)

---

## Contexto

El PRD de Rediseño UX Nativo requiere implementar gestos nativos:

| User Story | Gesto Requerido                    |
| ---------- | ---------------------------------- |
| US-003     | Drag-to-close en Bottom Sheet      |
| US-004     | Swipe horizontal en items de lista |
| US-005     | Pull-to-refresh vertical           |
| US-006     | Touch feedback (háptico)           |

Se debe elegir la estrategia de implementación entre:

1. **Framer Motion gestures** (drag, pan, tap)
2. **@use-gesture/react** (librería especializada)
3. **Touch events nativos** (implementación custom)
4. **Híbrido** (FM + librería complementaria)

---

## Decisión

### ✅ OPCIÓN ELEGIDA: Framer Motion gestures + Custom hooks

**Usar las capacidades de gestos de Framer Motion** para la mayoría de casos, complementado con **hooks customizados** para lógica específica.

---

## Justificación

### Análisis de Opciones

#### Opción 1: Framer Motion (ELEGIDA)

| Aspecto                         | Evaluación                           |
| ------------------------------- | ------------------------------------ |
| **Ya disponible**               | ✅ Incluido en FM instalado          |
| **Drag-to-close**               | ✅ Ya funciona en BottomSheet actual |
| **Swipe actions**               | ✅ `drag="x"` + constraints          |
| **Pull-to-refresh**             | ⚠️ Requiere custom logic             |
| **Bundle size**                 | ✅ 0KB adicionales                   |
| **Integración con animaciones** | ✅ Nativa                            |

**Ejemplo existente en el proyecto:**

```tsx
// BottomSheet.tsx actual - ya usa gestos FM
drag="y"
dragConstraints={{ top: 0, bottom: 0 }}
dragElastic={{ top: 0, bottom: 0.4 }}
onDragEnd={handleDragEnd}
```

#### Opción 2: @use-gesture/react (DESCARTADA)

| Aspecto                  | Evaluación                      |
| ------------------------ | ------------------------------- |
| **Especialización**      | ✅ API muy completa para gestos |
| **Bundle adicional**     | ❌ +15KB gzipped                |
| **Integración con FM**   | ⚠️ Requiere adaptadores         |
| **Curva de aprendizaje** | ❌ API diferente a aprender     |

**Veredicto:** Añade complejidad sin beneficio claro sobre FM.

#### Opción 3: Touch Events Nativos (DESCARTADA)

| Aspecto           | Evaluación                       |
| ----------------- | -------------------------------- |
| **Control total** | ✅ Máxima flexibilidad           |
| **Boilerplate**   | ❌ Mucho código repetitivo       |
| **Cross-browser** | ❌ Handling manual de edge cases |
| **Performance**   | ⚠️ Depende de implementación     |

**Veredicto:** Alto costo de desarrollo y mantenimiento.

---

## Especificaciones Técnicas

### 1. Swipe Actions (US-004)

Crear componente `SwipeableRow` usando FM:

```typescript
// src/components/native/SwipeableRow.tsx

interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;     // Acción al swipe izquierda (eliminar)
  onSwipeRight?: () => void;    // Acción al swipe derecha (marcar)
  leftAction?: React.ReactNode;  // Contenido visible al swipe derecha
  rightAction?: React.ReactNode; // Contenido visible al swipe izquierda
  threshold?: number;            // Distancia para activar acción (default: 100px)
}

// Implementación con Framer Motion
const x = useMotionValue(0);
const background = useTransform(
  x,
  [-100, 0, 100],
  ["#ef4444", "#ffffff", "#22c55e"]
);

<motion.div
  drag="x"
  dragConstraints={{ left: -150, right: 150 }}
  dragElastic={0.1}
  onDragEnd={(_, info) => {
    if (info.offset.x < -threshold) onSwipeLeft?.();
    if (info.offset.x > threshold) onSwipeRight?.();
  }}
  style={{ x }}
>
```

### 2. Pull-to-Refresh (US-005)

Crear hook personalizado que combina FM con lógica de refresh:

```typescript
// src/hooks/usePullToRefresh.ts

interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  threshold?: number; // default: 80px
  resistance?: number; // default: 2.5
}

interface PullToRefreshReturn {
  pullDistance: MotionValue<number>;
  isRefreshing: boolean;
  isPulling: boolean;
  dragProps: {
    drag: "y";
    dragConstraints: { top: number; bottom: number };
    dragElastic: number;
    onDragEnd: (e: any, info: PanInfo) => void;
  };
}

export function usePullToRefresh(
  config: PullToRefreshConfig
): PullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const pullDistance = useMotionValue(0);

  const handleDragEnd = async (_, info: PanInfo) => {
    if (info.offset.y > threshold && !isRefreshing) {
      setIsRefreshing(true);
      haptic("medium"); // Feedback háptico
      await config.onRefresh();
      setIsRefreshing(false);
    }
  };

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    dragProps: {
      drag: "y",
      dragConstraints: { top: 0, bottom: threshold * 1.5 },
      dragElastic: 0.3,
      onDragEnd: handleDragEnd,
    },
  };
}
```

### 3. Integración con Haptics (US-006)

Extender `useHaptics.ts` existente con patterns del PRD:

```typescript
// src/hooks/useHaptics.ts - extensión

export type HapticPattern =
  | "light" // 10ms - tap en botón
  | "medium" // 20ms - agregar item
  | "success" // 15ms-pause-15ms - scan exitoso
  | "warning" // 30ms - eliminar
  | "error" // 50ms-50ms-50ms - error
  | "selection"; // 10ms - swipe reveal

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  success: [15, 50, 15],
  warning: 30,
  error: [50, 30, 50, 30, 50],
  selection: 10,
};

export function useHaptics() {
  // ... código existente ...

  const trigger = useCallback(
    (pattern: HapticPattern) => {
      haptic(HAPTIC_PATTERNS[pattern]);
    },
    [haptic]
  );

  return { haptic, trigger, isSupported };
}
```

---

## Patrones de Integración

### Gestos + Animaciones + Hápticos

```tsx
// Ejemplo completo: SwipeableRow con feedback
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";

function SwipeableProductRow({ product, onDelete, onMarkDone }) {
  const { trigger } = useHaptics();
  const x = useMotionValue(0);

  // Trigger haptic cuando se revela la acción
  useEffect(() => {
    const unsubscribe = x.on("change", (latest) => {
      if (Math.abs(latest) > 50 && Math.abs(latest) < 55) {
        trigger("selection"); // Feedback sutil al revelar
      }
    });
    return unsubscribe;
  }, [x, trigger]);

  const handleSwipeComplete = (direction: "left" | "right") => {
    if (direction === "left") {
      trigger("warning");
      onDelete();
    } else {
      trigger("success");
      onMarkDone();
    }
  };

  return (
    <motion.div
      drag="x"
      style={{ x }}
      dragConstraints={{ left: -120, right: 120 }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -100) handleSwipeComplete("left");
        else if (info.offset.x > 100) handleSwipeComplete("right");
      }}
    >
      {/* ... */}
    </motion.div>
  );
}
```

---

## Consideraciones de UX

### Thresholds Recomendados

| Gesto               | Threshold           | Rationale                      |
| ------------------- | ------------------- | ------------------------------ |
| Swipe para acción   | 100px               | Material Design recommendation |
| Pull-to-refresh     | 80px                | iOS standard                   |
| Drag-to-close sheet | 80px + velocity 300 | Ya en BottomSheet              |

### Velocity-based Actions

Implementar cierre/acción por velocidad además de distancia:

```typescript
const shouldTrigger =
  Math.abs(info.offset.x) > DISTANCE_THRESHOLD ||
  Math.abs(info.velocity.x) > VELOCITY_THRESHOLD;
```

### Visual Feedback During Gesture

- Cambio de color/opacidad mientras arrastra
- Scale/rotate sutil para indicar dirección
- Iconos que aparecen gradualmente

---

## Hooks a Crear

| Hook               | Propósito                  | User Stories     |
| ------------------ | -------------------------- | ---------------- |
| `useSwipeActions`  | Swipe horizontal en items  | US-004           |
| `usePullToRefresh` | Pull vertical para refresh | US-005           |
| `useDragToClose`   | Cerrar modales arrastrando | US-003 (mejorar) |
| `useSafeArea`      | Valores de safe area       | US-001, US-002   |

---

## Estructura de Archivos

```
src/
├── hooks/
│   ├── useHaptics.ts      # ✅ Existe - extender
│   ├── useSwipeActions.ts  # Nuevo
│   ├── usePullToRefresh.ts # Nuevo
│   └── useSafeArea.ts      # Nuevo
│
├── components/native/
│   ├── SwipeableRow.tsx    # Usa useSwipeActions
│   ├── PullToRefresh.tsx   # Wrapper con usePullToRefresh
│   └── ...
```

---

## Edge Cases a Manejar

### 1. Scroll vs Swipe Conflict

```typescript
// Prevenir swipe cuando hay scroll horizontal interno
const preventSwipe = element.scrollWidth > element.clientWidth;
```

### 2. Multi-touch

```typescript
// Ignorar gestos si hay más de un dedo
if (event.touches?.length > 1) return;
```

### 3. Cancelación de Gesto

```typescript
// Si el usuario cancela, animar de vuelta a posición inicial
onDragCancel={() => animate(x, 0, { type: "spring" })}
```

### 4. iOS Overscroll Bounce

```css
/* Prevenir bounce nativo de iOS durante pull-to-refresh custom */
.pull-container {
  overscroll-behavior-y: contain;
}
```

---

## Métricas de Éxito

| Métrica                      | Objetivo                 |
| ---------------------------- | ------------------------ |
| Gesture recognition accuracy | > 95%                    |
| False positive rate          | < 2%                     |
| Response latency             | < 16ms (60fps)           |
| Haptic trigger accuracy      | 100% en gestos completos |

---

## Próximos Pasos

1. **Extender `useHaptics.ts`** con patterns del PRD
2. **Crear `useSwipeActions.ts`** hook
3. **Crear `usePullToRefresh.ts`** hook
4. **Implementar `SwipeableRow.tsx`** componente
5. **Testing en dispositivos** iOS Safari + Android Chrome

---

## Referencias

- [Framer Motion Gestures](https://www.framer.com/motion/gestures/)
- [PRD: REDISENO-UX-NATIVO.md](../product/REDISENO-UX-NATIVO.md)
- [useHaptics.ts actual](../../src/hooks/useHaptics.ts)
- [Apple HIG - Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures)
