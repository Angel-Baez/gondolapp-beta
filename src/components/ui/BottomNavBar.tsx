"use client";

import { motion as m } from "framer-motion";
import { Clock, ListChecks, LucideIcon } from "lucide-react";
import { ActiveView } from "@/types";

interface NavItem {
  id: ActiveView;
  label: string;
  icon: LucideIcon;
  activeColor: string;
  activeBg: string;
}

interface BottomNavBarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

const navItems: NavItem[] = [
  {
    id: "reposicion",
    label: "Reposición",
    icon: ListChecks,
    activeColor: "text-cyan-500",
    activeBg: "bg-cyan-500/10",
  },
  {
    id: "vencimiento",
    label: "Vencimientos",
    icon: Clock,
    activeColor: "text-red-500",
    activeBg: "bg-red-500/10",
  },
];

// Height for the nav bar content area
export const NAV_CONTENT_HEIGHT = 64;
// Notch dimensions - curve goes INWARD (concave)
const NOTCH_WIDTH = 80;
const NOTCH_DEPTH = 28;

/**
 * BottomNavBar - iOS/Android style bottom tab bar with FAB notch
 *
 * Native-like features:
 * - Fixed at bottom with safe area insets
 * - Curved notch/cutout for FAB integration (concave - curves inward)
 * - Animated indicator
 * - Haptic-ready tap animations
 * - Glassmorphism backdrop
 * - Large touch targets (48px+)
 */
export function BottomNavBar({ activeView, onViewChange }: BottomNavBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 safe-area-bottom"
      role="navigation"
      aria-label="Navegación principal"
      style={{ height: `${NAV_CONTENT_HEIGHT}px` }}
    >
      {/* SVG Background with INWARD (concave) notch cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 64"
      >
        <defs>
          <filter id="notchShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="-2" stdDeviation="3" floodColor="#000" floodOpacity="0.1" />
          </filter>
        </defs>
        {/* Main shape with INWARD curved notch - semicircle going INTO the nav bar */}
        <path
          d={`
            M 0,0
            L ${50 - NOTCH_WIDTH/2},0
            C ${50 - NOTCH_WIDTH/2},0 ${50 - NOTCH_WIDTH/2 + 5},${NOTCH_DEPTH} 50,${NOTCH_DEPTH}
            C ${50 + NOTCH_WIDTH/2 - 5},${NOTCH_DEPTH} ${50 + NOTCH_WIDTH/2},0 ${50 + NOTCH_WIDTH/2},0
            L 100,0
            L 100,64
            L 0,64
            Z
          `}
          className="fill-white dark:fill-dark-surface"
          filter="url(#notchShadow)"
        />
        {/* Border line following the inward notch curve */}
        <path
          d={`
            M 0,0
            L ${50 - NOTCH_WIDTH/2},0
            C ${50 - NOTCH_WIDTH/2},0 ${50 - NOTCH_WIDTH/2 + 5},${NOTCH_DEPTH} 50,${NOTCH_DEPTH}
            C ${50 + NOTCH_WIDTH/2 - 5},${NOTCH_DEPTH} ${50 + NOTCH_WIDTH/2},0 ${50 + NOTCH_WIDTH/2},0
            L 100,0
          `}
          fill="none"
          className="stroke-gray-200 dark:stroke-dark-border"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Navigation items */}
      <div 
        className="relative z-10 max-w-lg mx-auto flex items-stretch h-full"
      >
        {navItems.map((item, index) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          // Position items on left and right of the notch
          const isLeft = index === 0;

          return (
            <m.button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "tween", duration: 0.1 }}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-4 relative select-none touch-manipulation transition-colors ${
                isLeft ? "mr-12" : "ml-12"
              } ${isActive ? item.activeBg : ""}`}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              {/* Active indicator line */}
              {isActive && (
                <m.div
                  layoutId="nav-indicator"
                  className={`absolute top-0 left-4 right-4 h-0.5 rounded-full ${
                    item.id === "reposicion" ? "bg-cyan-500" : "bg-red-500"
                  }`}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}

              {/* Icon with animation */}
              <m.div
                animate={{
                  scale: isActive ? 1.15 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Icon
                  size={24}
                  className={`transition-colors ${
                    isActive
                      ? item.activeColor
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </m.div>

              {/* Label */}
              <span
                className={`text-xs font-semibold mt-1 transition-colors ${
                  isActive
                    ? item.activeColor
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </m.button>
          );
        })}
      </div>
    </nav>
  );
}
