"use client";

import { motion as m, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ReactNode, useState, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

const DEFAULT_THRESHOLD = 80;
const INDICATOR_SIZE = 40;

/**
 * PullToRefresh - Native-like pull-to-refresh implementation
 * 
 * ✅ Features:
 * - Smooth spring physics
 * - Progress-based rotation
 * - Haptic feedback at threshold
 * - Loading state animation
 * - Works with scrollable content
 */
export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = DEFAULT_THRESHOLD,
  className = "",
}: PullToRefreshProps) {
  const { haptic } = useHaptics();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const hasTriggeredHaptic = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const y = useMotionValue(0);
  
  // Rotation for the refresh icon
  const rotation = useTransform(y, [0, threshold], [0, 180]);
  
  // Opacity for the indicator
  const indicatorOpacity = useTransform(y, [0, threshold / 4], [0, 1]);
  
  // Scale for the indicator
  const indicatorScale = useTransform(y, [0, threshold], [0.5, 1]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setIsAtTop(target.scrollTop <= 0);
  }, []);

  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!isAtTop || disabled || isRefreshing) return;

      // Only allow pull down
      if (info.offset.y < 0) {
        y.set(0);
        return;
      }

      // Trigger haptic at threshold
      if (info.offset.y >= threshold && !hasTriggeredHaptic.current) {
        haptic(25);
        hasTriggeredHaptic.current = true;
      } else if (info.offset.y < threshold) {
        hasTriggeredHaptic.current = false;
      }
    },
    [isAtTop, disabled, isRefreshing, threshold, haptic, y]
  );

  const handleDragEnd = useCallback(
    async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!isAtTop || disabled || isRefreshing) return;

      hasTriggeredHaptic.current = false;

      if (info.offset.y >= threshold) {
        setIsRefreshing(true);
        haptic([20, 40, 20]); // Confirmation pattern

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
    },
    [isAtTop, disabled, isRefreshing, threshold, haptic, onRefresh]
  );

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`} ref={containerRef}>
      {/* Pull indicator */}
      <m.div
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
        style={{
          top: -INDICATOR_SIZE - 10,
          width: INDICATOR_SIZE,
          height: INDICATOR_SIZE,
          y,
          opacity: indicatorOpacity,
          scale: indicatorScale,
        }}
      >
        <div className="w-10 h-10 rounded-full bg-white dark:bg-dark-card shadow-lg flex items-center justify-center">
          <m.div
            style={{ rotate: isRefreshing ? undefined : rotation }}
            animate={isRefreshing ? { rotate: 360 } : undefined}
            transition={
              isRefreshing
                ? { duration: 1, repeat: Infinity, ease: "linear" }
                : undefined
            }
          >
            <RefreshCw className="w-5 h-5 text-accent-primary" />
          </m.div>
        </div>
      </m.div>

      {/* Scrollable content */}
      <m.div
        drag={isAtTop && !isRefreshing ? "y" : false}
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.4, bottom: 0 }}
        style={{ y: isRefreshing ? threshold / 2 : y }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overscroll-contain"
        animate={isRefreshing ? { y: threshold / 2 } : { y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {children}
      </m.div>
    </div>
  );
}

/**
 * Simple Refresh Button - For use in headers
 */
export function RefreshButton({
  onRefresh,
  isRefreshing = false,
  className = "",
}: {
  onRefresh: () => void;
  isRefreshing?: boolean;
  className?: string;
}) {
  const { haptic } = useHaptics();

  const handleClick = () => {
    if (!isRefreshing) {
      haptic(15);
      onRefresh();
    }
  };

  return (
    <m.button
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      disabled={isRefreshing}
      className={`p-2 rounded-lg bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-dark-border transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation ${className}`}
      aria-label="Actualizar"
    >
      <m.div
        animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
        transition={
          isRefreshing
            ? { duration: 1, repeat: Infinity, ease: "linear" }
            : { duration: 0 }
        }
      >
        <RefreshCw
          className={`w-5 h-5 ${
            isRefreshing
              ? "text-accent-primary"
              : "text-gray-600 dark:text-gray-400"
          }`}
        />
      </m.div>
    </m.button>
  );
}
