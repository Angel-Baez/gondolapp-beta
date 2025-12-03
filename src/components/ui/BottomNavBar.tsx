"use client";

import { motion as m } from "framer-motion";
import { Clock, ListChecks, LucideIcon } from "lucide-react";
import { ActiveView } from "@/types";

interface NavItem {
  id: ActiveView;
  label: string;
  icon: LucideIcon;
  activeColor: string;
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
  },
  {
    id: "vencimiento",
    label: "Vencimientos",
    icon: Clock,
    activeColor: "text-red-500",
  },
];

// Height for the nav bar content area
export const NAV_CONTENT_HEIGHT = 64;

/**
 * BottomNavBar - Glassmorphic style bottom tab bar
 *
 * Native-like features:
 * - Fixed at bottom with safe area insets
 * - Glassmorphism with backdrop-blur (content blurs behind)
 * - CSS Grid for perfect alignment (3 columns: nav | FAB space | nav)
 * - Animated indicator line on active tab
 * - Haptic-ready tap animations
 * - Large touch targets (48px+)
 */
export function BottomNavBar({ activeView, onViewChange }: BottomNavBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 safe-area-bottom bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-dark-border/50"
      role="navigation"
      aria-label="Navegación principal"
      style={{ height: `${NAV_CONTENT_HEIGHT}px` }}
    >
      {/* Navigation items using CSS Grid - 3 columns with center space for FAB */}
      <div 
        className="h-full max-w-lg mx-auto grid grid-cols-[1fr_80px_1fr] items-center"
      >
        {navItems.map((item, index) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeView === item.id}
            onClick={() => onViewChange(item.id)}
            position={index === 0 ? "left" : "right"}
          />
        ))}
      </div>
    </nav>
  );
}

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  position: "left" | "right";
}

function NavButton({ item, isActive, onClick, position }: NavButtonProps) {
  const Icon = item.icon;
  
  // Grid order: left button first, then skip center (FAB space), then right button
  const gridOrder = position === "left" ? "order-1" : "order-3";
  
  return (
    <m.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "tween", duration: 0.1 }}
      className={`${gridOrder} flex flex-col items-center justify-center py-2 px-4 relative select-none touch-manipulation h-full`}
      aria-current={isActive ? "page" : undefined}
      aria-label={item.label}
    >
      {/* Active indicator line at top */}
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

      {/* Icon with subtle scale animation */}
      <m.div
        animate={{
          scale: isActive ? 1.1 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Icon
          size={24}
          className={`transition-colors duration-200 ${
            isActive
              ? item.activeColor
              : "text-gray-400 dark:text-gray-500"
          }`}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </m.div>

      {/* Label */}
      <span
        className={`text-xs font-medium mt-1 transition-colors duration-200 ${
          isActive
            ? item.activeColor
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {item.label}
      </span>
    </m.button>
  );
}
