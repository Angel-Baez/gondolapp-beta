"use client";

import { motion as m, useMotionValue, useTransform } from "framer-motion";
import { ArrowDown, RefreshCw } from "lucide-react";
import React, { useCallback, useState } from "react";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  /** Threshold to trigger refresh (in pixels) */
  threshold?: number;
  /** Show loading indicator */
  isRefreshing?: boolean;
  className?: string;
}

const PULL_THRESHOLD = 80;

/**
 * PullToRefresh - Native-like pull-to-refresh wrapper
 *
 * Native-like features:
 * - Smooth pull gesture
 * - Animated refresh indicator
 * - Spring physics
 * - Touch optimized
 */
export function PullToRefresh({
  children,
  onRefresh,
  threshold = PULL_THRESHOLD,
  isRefreshing = false,
  className = "",
}: PullToRefreshProps) {
  // Local refreshing state for internal pull gesture triggers
  // isRefreshing prop allows parent components to control the refresh state externally
  // (e.g., when data is fetched from an API and parent wants to show loading)
  const [refreshing, setRefreshing] = useState(false);
  const y = useMotionValue(0);

  // Combine both states - active when either internal or external refresh is happening
  const isActive = refreshing || isRefreshing;

  // Transform for indicator
  const indicatorOpacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const indicatorRotate = useTransform(y, [0, threshold], [0, 180]);
  const indicatorScale = useTransform(y, [0, threshold], [0.5, 1]);

  const handleDragEnd = useCallback(async () => {
    const currentY = y.get();

    // Only trigger if not already refreshing (either locally or externally)
    if (currentY >= threshold && !refreshing && !isRefreshing) {
      setRefreshing(true);

      // Trigger haptic feedback if available
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }

      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  }, [y, threshold, refreshing, isRefreshing, onRefresh]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Pull indicator */}
      <m.div
        style={{ opacity: indicatorOpacity }}
        className="absolute top-0 left-0 right-0 flex justify-center py-3 z-10 pointer-events-none"
      >
        <m.div
          style={{
            rotate: isActive ? 0 : indicatorRotate,
            scale: isActive ? 1 : indicatorScale,
          }}
          animate={
            isActive
              ? { rotate: 360 }
              : undefined
          }
          transition={
            isActive
              ? { duration: 1, repeat: Infinity, ease: "linear" }
              : undefined
          }
          className={`p-2 rounded-full ${
            isActive
              ? "bg-cyan-500"
              : "bg-gray-200 dark:bg-dark-card"
          }`}
        >
          {isActive ? (
            <RefreshCw
              size={20}
              className="text-white"
              strokeWidth={2.5}
            />
          ) : (
            <ArrowDown
              size={20}
              className="text-gray-500 dark:text-gray-400"
              strokeWidth={2.5}
            />
          )}
        </m.div>
      </m.div>

      {/* Refreshing state message */}
      {isActive && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-12 left-0 right-0 flex justify-center z-10 pointer-events-none"
        >
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Actualizando...
          </span>
        </m.div>
      )}

      {/* Main content */}
      <m.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.4, bottom: 0 }}
        style={{ y }}
        onDragEnd={handleDragEnd}
        animate={isActive ? { y: 60 } : { y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="min-h-full touch-pan-y"
      >
        {children}
      </m.div>
    </div>
  );
}
