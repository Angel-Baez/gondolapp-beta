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
    "font-semibold rounded-field transition-all duration-100 flex items-center justify-center gap-2 select-none touch-manipulation";

  const variantClasses = {
    primary: "bg-accent text-on-accent hover:bg-accent-strong",
    secondary: "border-2 border-accent text-accent hover:bg-accent-soft",
    destructive: "bg-alert-critico text-white hover:bg-alert-critico/90",
    ghost: "bg-surface-2 text-fg-secondary hover:bg-border",
    outline: "border-2 border-border text-fg-secondary hover:bg-surface-2",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
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
    primary: "bg-accent text-on-accent hover:bg-accent-strong",
    secondary: "bg-estado-sin-stock text-white hover:opacity-90",
    destructive: "bg-alert-critico text-white hover:bg-alert-critico/90",
    ghost: "bg-surface-2 text-fg-secondary hover:bg-border",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.92 } : {}}
      transition={{ type: "tween", duration: 0.1 }}
      className={`p-2.5 rounded-field transition-all duration-100 flex items-center justify-center flex-shrink-0 min-w-[44px] min-h-[44px] select-none touch-manipulation ${variantClasses[variant]} ${disabledClasses} ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
