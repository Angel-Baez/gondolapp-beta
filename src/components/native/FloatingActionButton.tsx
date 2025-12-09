"use client";

import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { TOUCH_TARGETS, Z_INDEX, ELEVATION } from "@/lib/constants";
import { springs } from "@/lib/animations";

export interface FloatingActionButtonProps {
  /**
   * Icono a mostrar en el FAB
   * @default <Camera />
   */
  icon?: React.ReactNode;
  
  /**
   * Handler al presionar el botón
   */
  onPress: () => void;
  
  /**
   * Variante visual del botón
   * @default "primary"
   */
  variant?: "primary" | "secondary";
  
  /**
   * Tamaño del FAB
   * @default "normal"
   */
  size?: "normal" | "mini";
  
  /**
   * Posición en la pantalla
   * @default "bottom-right"
   */
  position?: "bottom-right" | "bottom-center";
  
  /**
   * Controla la visibilidad del FAB
   * @default true
   */
  visible?: boolean;
  
  /**
   * Label para screen readers
   * @default "Acción principal"
   */
  label?: string;
  
  /**
   * Habilitar feedback háptico
   * @default true
   */
  hapticFeedback?: boolean;
  
  /**
   * Clases CSS adicionales
   */
  className?: string;
}

/**
 * FloatingActionButton (FAB) - US-002
 * 
 * Botón flotante siempre visible para acciones principales.
 * Sigue los patrones de Material Design y Apple HIG.
 * 
 * Características:
 * - Tamaño táctil mínimo de 56x56px
 * - Posicionamiento encima del TabBar
 * - Feedback háptico y visual
 * - Animación de presión (scale down)
 * - Elevación prominente con sombra
 * - Respeta safe areas
 * 
 * @example
 * <FloatingActionButton
 *   icon={<Camera size={24} />}
 *   onPress={() => openScanner()}
 *   label="Escanear producto"
 * />
 */
export function FloatingActionButton({
  icon = <Camera size={24} />,
  onPress,
  variant = "primary",
  size = "normal",
  position = "bottom-right",
  visible = true,
  label = "Acción principal",
  hapticFeedback = true,
  className = "",
}: FloatingActionButtonProps) {
  const { trigger } = useHaptics();

  const handlePress = () => {
    if (hapticFeedback) {
      trigger("light");
    }
    onPress();
  };

  // Tamaños según Material Design
  const sizeClass = size === "normal" ? "w-14 h-14" : "w-10 h-10"; // 56px : 40px
  
  // Posicionamiento
  const positionClass =
    position === "bottom-right"
      ? "right-4"
      : "left-1/2 -translate-x-1/2";

  // Colores según variante
  const variantClass =
    variant === "primary"
      ? "bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white"
      : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white";

  return (
    <motion.button
      initial={{ scale: visible ? 1 : 0 }}
      animate={{ scale: visible ? 1 : 0 }}
      exit={{ scale: 0 }}
      transition={springs.snappy}
      whileTap={{ scale: 0.95 }}
      onClick={handlePress}
      className={`
        fixed
        ${positionClass}
        ${sizeClass}
        ${variantClass}
        ${ELEVATION.lg}
        rounded-full
        flex items-center justify-center
        transition-colors duration-200
        touch-manipulation
        touch-target
        ${className}
      `}
      style={{
        // Posicionado encima del TabBar (56px) + gap (16px) + safe area
        bottom: `calc(${TOUCH_TARGETS.tabBarHeight}px + 16px + env(safe-area-inset-bottom))`,
        zIndex: Z_INDEX.fab,
        willChange: "transform",
      }}
      aria-label={label}
      type="button"
    >
      {icon}
    </motion.button>
  );
}
