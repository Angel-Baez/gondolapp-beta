/**
 * Constantes globales del proyecto
 * 
 * Basado en ADR-003: Estructura de Componentes Nativos
 */

// Z-Index strategy para evitar conflictos de capas
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

// Tamaños táctiles según Apple HIG y Material Design
export const TOUCH_TARGETS = {
  minimum: 44,        // Apple HIG - mínimo absoluto
  recommended: 48,    // Material Design - recomendado
  fab: 56,           // FAB estándar
  tabBarHeight: 56,  // Altura del tab bar
} as const;

// Sistema de espaciado (múltiplos de 4px)
export const SPACING = {
  micro: 4,   // iconos inline
  xs: 8,      // elementos relacionados
  sm: 12,     // padding interno cards
  md: 16,     // padding estándar, gaps
  lg: 24,     // secciones
  xl: 32,     // áreas principales
} as const;

// Radios de borde
export const BORDER_RADIUS = {
  sm: 4,      // botones pequeños, inputs
  md: 8,      // cards pequeñas, chips
  lg: 12,     // cards, botones grandes
  xl: 16,     // bottom sheets, modales
  xxl: 24,    // FAB
  full: 9999, // avatares, indicadores
} as const;

// Breakpoints (sincronizados con Tailwind)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Configuración de elevación (sombras)
export const ELEVATION = {
  none: 'shadow-none',
  sm: 'shadow-sm',    // Cards en reposo
  md: 'shadow-md',    // Cards hover/active
  lg: 'shadow-lg',    // FAB, elementos flotantes
  xl: 'shadow-xl',    // Modales, bottom sheets
  '2xl': 'shadow-2xl', // Máxima elevación
} as const;
