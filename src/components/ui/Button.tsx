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
    "font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2";

  const variantClasses = {
    primary:
      "bg-accent-primary text-white hover:bg-accent-primary/90 active:scale-95 shadow-md",
    secondary:
      "border-2 border-accent-primary text-accent-primary hover:bg-accent-primary/10 active:scale-95",
    destructive:
      "bg-alert-critico text-white hover:bg-alert-critico/90 active:scale-95 shadow-md",
    ghost: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95",
    outline:
      "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-95",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.95 } : {}}
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
    primary: "bg-accent-primary text-white hover:bg-accent-primary/90",
    secondary: "bg-accent-secondary text-white hover:bg-accent-secondary/90",
    destructive: "bg-alert-critico text-white hover:bg-alert-critico/90",
    ghost: "bg-gray-100 text-gray-600 hover:bg-gray-200",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.9 } : {}}
      className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center flex-shrink-0 min-w-[44px] min-h-[44px] ${variantClasses[variant]} ${disabledClasses} ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
