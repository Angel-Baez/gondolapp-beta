"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Check, X, Trash2, RotateCcw } from "lucide-react";
import React, { useState, useCallback } from "react";

interface SwipeAction {
  icon: React.ReactNode;
  color: string;
  onAction: () => void;
  threshold?: number;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  className?: string;
  disabled?: boolean;
}

// Thresholds for triggering actions
const ACTION_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 500;

/**
 * SwipeableCard - Tarjeta con gestos de deslizamiento tipo iOS
 * 
 * Características:
 * - Deslizar izquierda/derecha para acciones rápidas
 * - Feedback visual con iconos y colores
 * - Animación de retorno elástica
 * - Umbrales de velocidad y distancia
 */
export function SwipeableCard({
  children,
  leftAction,
  rightAction,
  className = "",
  disabled = false,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  // Transform for left action background
  const leftBgOpacity = useTransform(x, [0, ACTION_THRESHOLD], [0, 1]);
  const leftIconScale = useTransform(x, [0, ACTION_THRESHOLD / 2, ACTION_THRESHOLD], [0.5, 0.8, 1]);
  
  // Transform for right action background
  const rightBgOpacity = useTransform(x, [-ACTION_THRESHOLD, 0], [1, 0]);
  const rightIconScale = useTransform(x, [-ACTION_THRESHOLD, -ACTION_THRESHOLD / 2, 0], [1, 0.8, 0.5]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      
      const { offset, velocity } = info;
      
      // Check left swipe action
      if (leftAction && (offset.x > ACTION_THRESHOLD || velocity.x > VELOCITY_THRESHOLD)) {
        leftAction.onAction();
      }
      
      // Check right swipe action
      if (rightAction && (offset.x < -ACTION_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD)) {
        rightAction.onAction();
      }
    },
    [leftAction, rightAction]
  );

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Left action background (swipe right) */}
      {leftAction && (
        <motion.div
          className={`absolute inset-y-0 left-0 w-24 flex items-center justify-center ${leftAction.color}`}
          style={{ opacity: leftBgOpacity }}
        >
          <motion.div style={{ scale: leftIconScale }}>
            {leftAction.icon}
          </motion.div>
        </motion.div>
      )}

      {/* Right action background (swipe left) */}
      {rightAction && (
        <motion.div
          className={`absolute inset-y-0 right-0 w-24 flex items-center justify-center ${rightAction.color}`}
          style={{ opacity: rightBgOpacity }}
        >
          <motion.div style={{ scale: rightIconScale }}>
            {rightAction.icon}
          </motion.div>
        </motion.div>
      )}

      {/* Main content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: rightAction ? -120 : 0, right: leftAction ? 120 : 0 }}
        dragElastic={{ left: rightAction ? 0.2 : 0, right: leftAction ? 0.2 : 0 }}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={{ x: isDragging ? undefined : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="relative bg-white dark:bg-dark-surface touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Preset de acciones comunes para SwipeableCard
 */
export const SwipeActions = {
  markComplete: (onAction: () => void): SwipeAction => ({
    icon: <Check size={28} className="text-white" />,
    color: "bg-emerald-500",
    onAction,
  }),
  
  markNoStock: (onAction: () => void): SwipeAction => ({
    icon: <X size={28} className="text-white" />,
    color: "bg-red-500",
    onAction,
  }),
  
  delete: (onAction: () => void): SwipeAction => ({
    icon: <Trash2 size={28} className="text-white" />,
    color: "bg-red-600",
    onAction,
  }),
  
  undo: (onAction: () => void): SwipeAction => ({
    icon: <RotateCcw size={28} className="text-white" />,
    color: "bg-amber-500",
    onAction,
  }),
};
