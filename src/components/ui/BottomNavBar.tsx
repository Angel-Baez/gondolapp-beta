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

// SVG path for curved notch - more visible cutout
const NOTCH_WIDTH = 76;
const NOTCH_DEPTH = 28;
const NOTCH_CURVE_RADIUS = 20;
// Height for the nav bar content area (below the notch)
export const NAV_CONTENT_HEIGHT = 56;
// Total height including notch area
const TOTAL_NAV_HEIGHT = NAV_CONTENT_HEIGHT + NOTCH_DEPTH;

/**
 * BottomNavBar - iOS/Android style bottom tab bar with FAB notch
 *
 * Native-like features:
 * - Fixed at bottom with safe area insets
 * - Curved notch/cutout for FAB integration
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
    >
      {/* SVG Background with notch cutout */}
      <div className="absolute inset-0 overflow-hidden" style={{ height: `${TOTAL_NAV_HEIGHT}px` }}>
        <svg
          className="absolute bottom-0 left-0 right-0 w-full"
          style={{ height: `${TOTAL_NAV_HEIGHT}px` }}
          preserveAspectRatio="none"
          viewBox={`0 0 400 ${TOTAL_NAV_HEIGHT}`}
        >
          <defs>
            {/* Shadow filter for depth */}
            <filter id="notchShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="-2" stdDeviation="4" floodOpacity="0.15" />
            </filter>
          </defs>
          {/* Background shape with notch cutout */}
          <path
            d={`
              M 0,${NOTCH_DEPTH}
              L ${200 - NOTCH_WIDTH / 2 - NOTCH_CURVE_RADIUS},${NOTCH_DEPTH}
              Q ${200 - NOTCH_WIDTH / 2},${NOTCH_DEPTH} ${200 - NOTCH_WIDTH / 2},${NOTCH_DEPTH - NOTCH_CURVE_RADIUS / 2}
              Q ${200 - NOTCH_WIDTH / 2},0 ${200 - NOTCH_WIDTH / 4},0
              Q 200,0 ${200 + NOTCH_WIDTH / 4},0
              Q ${200 + NOTCH_WIDTH / 2},0 ${200 + NOTCH_WIDTH / 2},${NOTCH_DEPTH - NOTCH_CURVE_RADIUS / 2}
              Q ${200 + NOTCH_WIDTH / 2},${NOTCH_DEPTH} ${200 + NOTCH_WIDTH / 2 + NOTCH_CURVE_RADIUS},${NOTCH_DEPTH}
              L 400,${NOTCH_DEPTH}
              L 400,${TOTAL_NAV_HEIGHT}
              L 0,${TOTAL_NAV_HEIGHT}
              Z
            `}
            className="fill-white/95 dark:fill-dark-surface/95"
            filter="url(#notchShadow)"
          />
          {/* Top border following the notch curve */}
          <path
            d={`
              M 0,${NOTCH_DEPTH}
              L ${200 - NOTCH_WIDTH / 2 - NOTCH_CURVE_RADIUS},${NOTCH_DEPTH}
              Q ${200 - NOTCH_WIDTH / 2},${NOTCH_DEPTH} ${200 - NOTCH_WIDTH / 2},${NOTCH_DEPTH - NOTCH_CURVE_RADIUS / 2}
              Q ${200 - NOTCH_WIDTH / 2},0 ${200 - NOTCH_WIDTH / 4},0
              Q 200,0 ${200 + NOTCH_WIDTH / 4},0
              Q ${200 + NOTCH_WIDTH / 2},0 ${200 + NOTCH_WIDTH / 2},${NOTCH_DEPTH - NOTCH_CURVE_RADIUS / 2}
              Q ${200 + NOTCH_WIDTH / 2},${NOTCH_DEPTH} ${200 + NOTCH_WIDTH / 2 + NOTCH_CURVE_RADIUS},${NOTCH_DEPTH}
              L 400,${NOTCH_DEPTH}
            `}
            fill="none"
            className="stroke-gray-200 dark:stroke-dark-border"
            strokeWidth="1"
          />
        </svg>
        {/* Backdrop blur layer */}
        <div 
          className="absolute bottom-0 left-0 right-0 backdrop-blur-xl" 
          style={{ height: `${NAV_CONTENT_HEIGHT}px` }}
        />
      </div>

      {/* Navigation items */}
      <div className="relative z-10 max-w-lg mx-auto flex items-stretch" style={{ paddingTop: `${NOTCH_DEPTH}px` }}>
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
              className={`flex-1 flex flex-col items-center justify-center py-2 px-4 min-h-[56px] relative select-none touch-manipulation transition-colors ${
                isLeft ? "mr-10" : "ml-10"
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
