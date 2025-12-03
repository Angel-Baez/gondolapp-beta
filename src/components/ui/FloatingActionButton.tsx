"use client";

import { motion as m } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ActiveView } from "@/types";

interface FloatingActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  label: string;
  variant?: "primary" | "secondary" | "success";
  size?: "md" | "lg";
  className?: string;
  disabled?: boolean;
}

const variantStyles = {
  primary:
    "bg-gradient-to-br from-cyan-400 to-cyan-600",
  secondary:
    "bg-gradient-to-br from-red-400 to-red-600",
  success:
    "bg-gradient-to-br from-emerald-400 to-emerald-600",
};

const sizeStyles = {
  md: "w-14 h-14",
  lg: "w-16 h-16",
};

const iconSizes = {
  md: 24,
  lg: 28,
};

/**
 * FloatingActionButton - Native-style FAB for primary actions
 *
 * Native-like features:
 * - Elevated with gradient and shadow
 * - Border matches background to create visual "cutout" effect
 * - Smooth press animation
 * - Positioned for thumb reach
 * - Touch target >= 48px
 * - Accessibility labels
 */
export function FloatingActionButton({
  icon: Icon,
  onClick,
  label,
  variant = "primary",
  size = "lg",
  className = "",
  disabled = false,
}: FloatingActionButtonProps) {
  return (
    <m.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        rounded-full text-white
        flex items-center justify-center
        shadow-lg
        transition-shadow duration-200
        select-none touch-manipulation
        disabled:opacity-50 disabled:cursor-not-allowed
        border-4 border-gray-50 dark:border-dark-bg
        ${className}
      `}
      aria-label={label}
      style={{ willChange: "transform" }}
    >
      <Icon size={iconSizes[size]} strokeWidth={2.5} />
    </m.button>
  );
}

/**
 * ScanFAB - Pre-configured FAB for scan action
 * Positioned fixed at bottom-center, floating above the bottom nav
 * The border creates a visual "cutout" effect against the nav bar
 */
interface ScanFABProps {
  icon: LucideIcon;
  onClick: () => void;
  activeView: ActiveView;
}

export function ScanFAB({ icon, onClick, activeView }: ScanFABProps) {
  // Position the FAB to float above the nav bar
  // NAV_CONTENT_HEIGHT is 64px, FAB is 64px (w-16 h-16)
  // bottom: 30px positions FAB so it overlaps the nav bar nicely
  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-40" style={{ bottom: '30px' }}>
      <FloatingActionButton
        icon={icon}
        onClick={onClick}
        label="Escanear producto"
        variant={activeView === "reposicion" ? "primary" : "secondary"}
        size="lg"
      />
    </div>
  );
}
