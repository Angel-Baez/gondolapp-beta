"use client";

import { motion } from "framer-motion";
import { Scan, Plus, LucideIcon } from "lucide-react";
import React from "react";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: LucideIcon;
  label?: string;
  variant?: "primary" | "secondary";
  position?: "center" | "right";
  /**
   * Offset adicional desde el bottom (para evitar overlap con bottom tab)
   */
  bottomOffset?: number;
}

/**
 * FloatingActionButton - Botón de acción flotante estilo Material Design
 * 
 * Características:
 * - Posición flotante con safe-area support
 * - Animación de entrada/salida
 * - Efecto ripple al tocar
 * - Sombra elevada para profundidad
 * - Opcional label expandible
 */
export function FloatingActionButton({
  onClick,
  icon: Icon = Scan,
  label,
  variant = "primary",
  position = "center",
  bottomOffset = 80,
}: FloatingActionButtonProps) {
  const variantStyles = {
    primary: {
      bg: "bg-gradient-to-r from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700",
      shadow: "shadow-lg shadow-cyan-500/30 dark:shadow-cyan-500/20",
      text: "text-white",
    },
    secondary: {
      bg: "bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700",
      shadow: "shadow-lg shadow-red-500/30 dark:shadow-red-500/20",
      text: "text-white",
    },
  };

  const positionStyles = {
    center: "left-1/2 -translate-x-1/2",
    right: "right-4",
  };

  const styles = variantStyles[variant];

  return (
    <motion.button
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0, y: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
      }}
      onClick={onClick}
      className={`fixed z-50 ${positionStyles[position]} ${styles.bg} ${styles.shadow} ${styles.text} rounded-full flex items-center justify-center select-none touch-manipulation transition-colors`}
      style={{
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom))`,
        minWidth: label ? "auto" : "56px",
        minHeight: "56px",
        padding: label ? "0 20px" : "0",
      }}
    >
      <motion.div
        animate={{}}
        className="flex items-center gap-2"
      >
        <Icon size={24} strokeWidth={2.5} />
        {label && (
          <span className="font-semibold text-base pr-1">{label}</span>
        )}
      </motion.div>
    </motion.button>
  );
}

/**
 * FAB Mini - Versión más pequeña para acciones secundarias
 */
export function FABMini({
  onClick,
  icon: Icon = Plus,
  variant = "primary",
}: {
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "primary" | "secondary";
}) {
  const variantStyles = {
    primary: "bg-cyan-500 hover:bg-cyan-600 text-white shadow-md",
    secondary: "bg-red-500 hover:bg-red-600 text-white shadow-md",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      className={`w-12 h-12 rounded-full flex items-center justify-center ${variantStyles[variant]} select-none touch-manipulation`}
    >
      <Icon size={20} />
    </motion.button>
  );
}
