"use client";

import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { CheckCircle, Trash2, XCircle } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

interface SwipeAction {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  label: string;
  onAction: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  className?: string;
  /** Disable swipe functionality */
  disabled?: boolean;
  /** Callback when swipe starts */
  onSwipeStart?: () => void;
  /** Callback when swipe ends */
  onSwipeEnd?: () => void;
}

// Swipe thresholds
const SWIPE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 500;

/**
 * SwipeableCard - Card with native-like swipe actions
 *
 * Native-like features:
 * - Smooth swipe gestures
 * - Action indicators revealed on swipe
 * - Spring animations
 * - Haptic feedback ready
 * - Touch optimized
 */
export function SwipeableCard({
  children,
  leftAction,
  rightAction,
  className = "",
  disabled = false,
  onSwipeStart,
  onSwipeEnd,
}: SwipeableCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const x = useMotionValue(0);

  // Transform for left action opacity
  const leftOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.8, 1]);

  // Transform for right action opacity
  const rightOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const rightScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.8]);

  // Memoize drag constraints to avoid recreation on each render
  const dragConstraints = useMemo(() => ({
    left: rightAction ? -SWIPE_THRESHOLD : 0,
    right: leftAction ? SWIPE_THRESHOLD : 0
  }), [leftAction, rightAction]);

  const handleDragStart = useCallback(() => {
    onSwipeStart?.();
  }, [onSwipeStart]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      onSwipeEnd?.();
      const offset = info.offset.x;
      const velocity = info.velocity.x;

      // Check if should trigger action
      const shouldTriggerLeft =
        offset > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD;
      const shouldTriggerRight =
        offset < -SWIPE_THRESHOLD || velocity < -SWIPE_VELOCITY_THRESHOLD;

      if (shouldTriggerLeft && leftAction) {
        setIsAnimating(true);
        leftAction.onAction();
        setTimeout(() => setIsAnimating(false), 300);
      } else if (shouldTriggerRight && rightAction) {
        setIsAnimating(true);
        rightAction.onAction();
        setTimeout(() => setIsAnimating(false), 300);
      }
    },
    [leftAction, rightAction, onSwipeEnd]
  );

  if (disabled || (!leftAction && !rightAction)) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Left action background */}
      {leftAction && (
        <motion.div
          className={`absolute inset-y-0 left-0 flex items-center justify-start pl-4 ${leftAction.bgColor}`}
          style={{
            opacity: leftOpacity,
            width: SWIPE_THRESHOLD + 20,
          }}
        >
          <motion.div
            style={{ scale: leftScale }}
            className="flex items-center gap-2"
          >
            <div className={`p-2 rounded-full ${leftAction.color}`}>
              {leftAction.icon}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Right action background */}
      {rightAction && (
        <motion.div
          className={`absolute inset-y-0 right-0 flex items-center justify-end pr-4 ${rightAction.bgColor}`}
          style={{
            opacity: rightOpacity,
            width: SWIPE_THRESHOLD + 20,
          }}
        >
          <motion.div
            style={{ scale: rightScale }}
            className="flex items-center gap-2"
          >
            <div className={`p-2 rounded-full ${rightAction.color}`}>
              {rightAction.icon}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Main card content */}
      <motion.div
        drag="x"
        dragConstraints={dragConstraints}
        dragElastic={0.2}
        style={{ x }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={isAnimating ? { x: 0 } : undefined}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
        className="relative bg-white dark:bg-dark-surface cursor-grab active:cursor-grabbing touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}

// Pre-configured swipe actions
export const SwipeActions = {
  markComplete: (onAction: () => void): SwipeAction => ({
    icon: <CheckCircle size={24} className="text-white" />,
    color: "bg-emerald-600", // Icon background
    bgColor: "bg-emerald-500", // Action area background
    label: "Marcar completo",
    onAction,
  }),

  markOutOfStock: (onAction: () => void): SwipeAction => ({
    icon: <XCircle size={24} className="text-white" />,
    color: "bg-red-600", // Icon background
    bgColor: "bg-red-500", // Action area background
    label: "Sin stock",
    onAction,
  }),

  delete: (onAction: () => void): SwipeAction => ({
    icon: <Trash2 size={24} className="text-white" />,
    color: "bg-red-700", // Icon background
    bgColor: "bg-red-600", // Action area background
    label: "Eliminar",
    onAction,
  }),
};
