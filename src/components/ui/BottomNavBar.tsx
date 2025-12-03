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

// SVG path for curved notch (40px radius cutout in center)
const NOTCH_WIDTH = 80;
const NOTCH_HEIGHT = 40;
const NOTCH_RADIUS = 8;
// Height for the nav bar content area (below the notch)
export const NAV_CONTENT_HEIGHT = 56;

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
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute bottom-0 left-0 right-0 h-20 w-full"
          preserveAspectRatio="none"
          viewBox="0 0 400 80"
        >
          <defs>
            <clipPath id="navNotch">
              <path
                d={`
                  M 0,${NOTCH_HEIGHT}
                  L ${200 - NOTCH_WIDTH / 2 - NOTCH_RADIUS},${NOTCH_HEIGHT}
                  Q ${200 - NOTCH_WIDTH / 2},${NOTCH_HEIGHT} ${200 - NOTCH_WIDTH / 2},${NOTCH_HEIGHT - NOTCH_RADIUS}
                  C ${200 - NOTCH_WIDTH / 2},0 ${200 + NOTCH_WIDTH / 2},0 ${200 + NOTCH_WIDTH / 2},${NOTCH_HEIGHT - NOTCH_RADIUS}
                  Q ${200 + NOTCH_WIDTH / 2},${NOTCH_HEIGHT} ${200 + NOTCH_WIDTH / 2 + NOTCH_RADIUS},${NOTCH_HEIGHT}
                  L 400,${NOTCH_HEIGHT}
                  L 400,80
                  L 0,80
                  Z
                `}
              />
            </clipPath>
          </defs>
          <rect
            x="0"
            y="0"
            width="400"
            height="80"
            className="fill-white/80 dark:fill-dark-surface/90"
            clipPath="url(#navNotch)"
          />
          {/* Top border following the notch curve */}
          <path
            d={`
              M 0,${NOTCH_HEIGHT}
              L ${200 - NOTCH_WIDTH / 2 - NOTCH_RADIUS},${NOTCH_HEIGHT}
              Q ${200 - NOTCH_WIDTH / 2},${NOTCH_HEIGHT} ${200 - NOTCH_WIDTH / 2},${NOTCH_HEIGHT - NOTCH_RADIUS}
              C ${200 - NOTCH_WIDTH / 2},0 ${200 + NOTCH_WIDTH / 2},0 ${200 + NOTCH_WIDTH / 2},${NOTCH_HEIGHT - NOTCH_RADIUS}
              Q ${200 + NOTCH_WIDTH / 2},${NOTCH_HEIGHT} ${200 + NOTCH_WIDTH / 2 + NOTCH_RADIUS},${NOTCH_HEIGHT}
              L 400,${NOTCH_HEIGHT}
            `}
            fill="none"
            className="stroke-gray-200/50 dark:stroke-dark-border/50"
            strokeWidth="1"
          />
        </svg>
        {/* Backdrop blur layer - matches nav content height */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-white/80 dark:bg-dark-surface/90 backdrop-blur-xl" 
          style={{ height: `${NAV_CONTENT_HEIGHT}px` }}
        />
      </div>

      {/* Navigation items */}
      <div className="relative z-10 max-w-lg mx-auto flex items-stretch pt-10">
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
