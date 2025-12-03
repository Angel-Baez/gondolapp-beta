"use client";

import { motion as m, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ReactNode, useCallback, useState } from "react";
import { Trash2, CheckCircle, XCircle } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon?: ReactNode;
    color: string;
    label: string;
  };
  rightAction?: {
    icon?: ReactNode;
    color: string;
    label: string;
  };
  className?: string;
  disabled?: boolean;
}

// Swipe threshold in pixels
const SWIPE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 500;
const DRAG_CONSTRAINT_MULTIPLIER = 1.875; // Allow some overscroll
const DRAG_CONSTRAINT = SWIPE_THRESHOLD * DRAG_CONSTRAINT_MULTIPLIER; // 150

/**
 * SwipeableCard - Card with swipe gesture actions
 * 
 * ✅ Native-like Features:
 * - Smooth drag with spring physics
 * - Reveal action buttons on swipe
 * - Haptic feedback at thresholds
 * - Velocity-based swipe detection
 * - Visual feedback during drag
 */
export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = {
    icon: <Trash2 className="w-6 h-6 text-white" />,
    color: "bg-red-500",
    label: "Eliminar",
  },
  rightAction = {
    icon: <CheckCircle className="w-6 h-6 text-white" />,
    color: "bg-emerald-500",
    label: "Completar",
  },
  className = "",
  disabled = false,
}: SwipeableCardProps) {
  const { haptic } = useHaptics();
  const [isDragging, setIsDragging] = useState(false);
  const [hasTriggeredLeftHaptic, setHasTriggeredLeftHaptic] = useState(false);
  const [hasTriggeredRightHaptic, setHasTriggeredRightHaptic] = useState(false);

  const x = useMotionValue(0);
  
  // Opacity transforms for action indicators
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);
  const rightOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);
  
  // Scale transforms for icons
  const leftScale = useTransform(x, [-SWIPE_THRESHOLD * 1.5, -SWIPE_THRESHOLD], [1.2, 1]);
  const rightScale = useTransform(x, [SWIPE_THRESHOLD, SWIPE_THRESHOLD * 1.5], [1, 1.2]);

  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = info.offset.x;
      
      // Trigger haptic at threshold
      if (offset < -SWIPE_THRESHOLD && !hasTriggeredLeftHaptic && onSwipeLeft) {
        haptic(20);
        setHasTriggeredLeftHaptic(true);
      } else if (offset > -SWIPE_THRESHOLD / 2) {
        setHasTriggeredLeftHaptic(false);
      }

      if (offset > SWIPE_THRESHOLD && !hasTriggeredRightHaptic && onSwipeRight) {
        haptic(20);
        setHasTriggeredRightHaptic(true);
      } else if (offset < SWIPE_THRESHOLD / 2) {
        setHasTriggeredRightHaptic(false);
      }
    },
    [haptic, hasTriggeredLeftHaptic, hasTriggeredRightHaptic, onSwipeLeft, onSwipeRight]
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      setHasTriggeredLeftHaptic(false);
      setHasTriggeredRightHaptic(false);

      const offset = info.offset.x;
      const velocity = info.velocity.x;

      // Check for swipe left (delete)
      if (
        (offset < -SWIPE_THRESHOLD || velocity < -SWIPE_VELOCITY_THRESHOLD) &&
        onSwipeLeft
      ) {
        haptic([30, 50, 30]); // Confirmation pattern
        onSwipeLeft();
        return;
      }

      // Check for swipe right (complete)
      if (
        (offset > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) &&
        onSwipeRight
      ) {
        haptic([30, 50, 30]); // Confirmation pattern
        onSwipeRight();
        return;
      }
    },
    [haptic, onSwipeLeft, onSwipeRight]
  );

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Left action background (delete - revealed on swipe left) */}
      {onSwipeLeft && (
        <m.div
          className={`absolute inset-y-0 right-0 ${leftAction.color} flex items-center justify-end px-6`}
          style={{ opacity: leftOpacity, width: "100%" }}
        >
          <m.div
            className="flex flex-col items-center gap-1"
            style={{ scale: leftScale }}
          >
            {leftAction.icon}
            <span className="text-xs font-medium text-white">
              {leftAction.label}
            </span>
          </m.div>
        </m.div>
      )}

      {/* Right action background (complete - revealed on swipe right) */}
      {onSwipeRight && (
        <m.div
          className={`absolute inset-y-0 left-0 ${rightAction.color} flex items-center justify-start px-6`}
          style={{ opacity: rightOpacity, width: "100%" }}
        >
          <m.div
            className="flex flex-col items-center gap-1"
            style={{ scale: rightScale }}
          >
            {rightAction.icon}
            <span className="text-xs font-medium text-white">
              {rightAction.label}
            </span>
          </m.div>
        </m.div>
      )}

      {/* Swipeable content */}
      <m.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: onSwipeLeft ? -DRAG_CONSTRAINT : 0, right: onSwipeRight ? DRAG_CONSTRAINT : 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDragStart={() => setIsDragging(true)}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={`relative bg-white dark:bg-dark-surface touch-pan-y ${className} ${
          isDragging ? "z-10 shadow-lg" : ""
        }`}
        whileDrag={{ cursor: "grabbing" }}
      >
        {children}
      </m.div>
    </div>
  );
}

// Pre-configured variants for common use cases
export function SwipeToDeleteCard({
  children,
  onDelete,
  className = "",
}: {
  children: ReactNode;
  onDelete: () => void;
  className?: string;
}) {
  return (
    <SwipeableCard
      onSwipeLeft={onDelete}
      leftAction={{
        icon: <Trash2 className="w-6 h-6 text-white" />,
        color: "bg-red-500",
        label: "Eliminar",
      }}
      className={className}
    >
      {children}
    </SwipeableCard>
  );
}

export function SwipeToCompleteCard({
  children,
  onComplete,
  onDelete,
  className = "",
}: {
  children: ReactNode;
  onComplete: () => void;
  onDelete?: () => void;
  className?: string;
}) {
  return (
    <SwipeableCard
      onSwipeRight={onComplete}
      onSwipeLeft={onDelete}
      rightAction={{
        icon: <CheckCircle className="w-6 h-6 text-white" />,
        color: "bg-emerald-500",
        label: "Completar",
      }}
      leftAction={{
        icon: <Trash2 className="w-6 h-6 text-white" />,
        color: "bg-red-500",
        label: "Eliminar",
      }}
      className={className}
    >
      {children}
    </SwipeableCard>
  );
}

export function SwipeToMarkOutOfStock({
  children,
  onMarkOutOfStock,
  onDelete,
  className = "",
}: {
  children: ReactNode;
  onMarkOutOfStock: () => void;
  onDelete?: () => void;
  className?: string;
}) {
  return (
    <SwipeableCard
      onSwipeRight={onMarkOutOfStock}
      onSwipeLeft={onDelete}
      rightAction={{
        icon: <XCircle className="w-6 h-6 text-white" />,
        color: "bg-amber-500",
        label: "Sin Stock",
      }}
      leftAction={{
        icon: <Trash2 className="w-6 h-6 text-white" />,
        color: "bg-red-500",
        label: "Eliminar",
      }}
      className={className}
    >
      {children}
    </SwipeableCard>
  );
}
