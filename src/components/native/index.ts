/**
 * Native Components Barrel Export
 * 
 * Componentes específicos para experiencia móvil nativa.
 * Basado en ADR-003: Estructura de Componentes Nativos
 */

// BottomTabBar (US-001)
export { BottomTabBar, TabItem } from "./BottomTabBar";
export type { BottomTabBarProps, TabConfig, TabItemProps } from "./BottomTabBar";

// FloatingActionButton (US-002)
export { FloatingActionButton } from "./FloatingActionButton";
export type { FloatingActionButtonProps } from "./FloatingActionButton";

// BottomSheet (US-003) - Migrado y mejorado desde /ui
export { BottomSheet } from "./BottomSheet";
export type { BottomSheetProps } from "./BottomSheet";

// TODO: Agregar exports para los siguientes componentes:
// - SwipeableRow (US-004)
// - PullToRefresh (US-005)
// - SkeletonLoader (US-007)
// - NativeCard (US-009)
