"use client";

import { motion } from "framer-motion";
import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "elevated" | "flat";
  animate?: boolean;
}

export function Card({ 
  children, 
  className = "", 
  onClick,
  variant = "default",
  animate = true 
}: CardProps) {
  const variantClasses = {
    default: "bg-white dark:bg-dark-surface shadow-native dark:shadow-none",
    elevated: "bg-white dark:bg-dark-surface shadow-native-md dark:shadow-none",
    flat: "bg-gray-50 dark:bg-dark-card",
  };

  if (!animate) {
    return (
      <div
        onClick={onClick}
        className={`rounded-2xl overflow-hidden transition-colors ${variantClasses[variant]} ${onClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""} ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={onClick}
      className={`rounded-2xl overflow-hidden transition-colors ${variantClasses[variant]} ${onClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div className={`p-4 border-b border-gray-100 dark:border-dark-border ${className}`}>
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
