"use client";

import { motion } from "framer-motion";
import React from "react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  form?: string;
  title?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled,
  onClick,
  type = "button",
  ...props
}: ButtonProps) {
  const baseClasses =
    "font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 select-none touch-manipulation min-h-[48px]";

  const variantClasses = {
    primary:
      "bg-gradient-to-br from-cyan-400 to-cyan-600 text-white hover:from-cyan-500 hover:to-cyan-700 shadow-native active:shadow-native-sm",
    secondary:
      "border-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20",
    destructive:
      "bg-gradient-to-br from-red-400 to-red-600 text-white hover:from-red-500 hover:to-red-700 shadow-native active:shadow-native-sm",
    ghost: "bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-dark-border",
    outline:
      "border-2 border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-card",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.97 } : {}}
      transition={{ type: "tween", duration: 0.1 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
      {...props}
    >
      {children}
    </motion.button>
  );
}

interface IconButtonProps {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  title?: string;
  disabled?: boolean;
}

export function IconButton({
  variant = "ghost",
  children,
  className = "",
  onClick,
  type = "button",
  disabled,
  ...props
}: IconButtonProps) {
  const variantClasses = {
    primary: "bg-gradient-to-br from-cyan-400 to-cyan-600 text-white hover:from-cyan-500 hover:to-cyan-700",
    secondary: "bg-gradient-to-br from-red-400 to-red-600 text-white hover:from-red-500 hover:to-red-700",
    destructive: "bg-gradient-to-br from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800",
    ghost: "bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-border",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.9 } : {}}
      transition={{ type: "tween", duration: 0.1 }}
      className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center flex-shrink-0 min-w-[44px] min-h-[44px] select-none touch-manipulation ${variantClasses[variant]} ${disabledClasses} ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
