/**
 * Configuración centralizada de animaciones
 * 
 * Basado en ADR-001: Estrategia de Animaciones
 * Utiliza Framer Motion para todas las animaciones del proyecto
 */

// Spring configurations siguiendo patrones iOS/Android nativos
export const springs = {
  // iOS-like spring (usado en BottomSheet actual)
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

// Duraciones estándar para transiciones sin spring
export const durations = {
  instant: 0.1,  // 100ms - button press
  fast: 0.15,    // 150ms - small transitions
  normal: 0.2,   // 200ms - standard
  slow: 0.3,     // 300ms - modales, sheets
} as const;

// Easing curves según Material Design y Apple HIG
export const easings = {
  easeOut: [0.0, 0.0, 0.2, 1] as [number, number, number, number],     // entrada
  easeIn: [0.4, 0.0, 1, 1] as [number, number, number, number],        // salida
  easeInOut: [0.4, 0.0, 0.2, 1] as [number, number, number, number],   // ambos
} as const;

// Variantes reutilizables para componentes
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

export const slideFromLeft = {
  initial: { x: "-100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "50%", opacity: 0 },
};

export const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Configuraciones específicas para componentes nativos
export const tabTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const listItemTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20, height: 0 },
};

// Thresholds para gestos
export const GESTURE_THRESHOLDS = {
  // Swipe actions
  swipeReveal: 50,      // px para revelar acción
  swipeTrigger: 100,    // px para ejecutar acción
  swipeVelocity: 500,   // velocity para auto-trigger
  
  // Pull to refresh
  pullTrigger: 80,      // px para activar refresh
  pullResistance: 2.5,  // factor de resistencia
  
  // Drag to close
  dragClose: 80,        // px para cerrar modal
  dragVelocity: 300,    // velocity para auto-close
} as const;
