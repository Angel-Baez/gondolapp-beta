"use client";

import { AlertaNivel } from "@/types";
import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  alert?: AlertaNivel;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  alert,
  className = "",
}: BadgeProps) {
  let variantClasses = "";

  if (alert) {
    const alertClasses = {
      critico: "bg-alert-critico text-white font-bold shadow-md",
      advertencia: "bg-alert-advertencia text-gray-900 font-bold shadow-md",
      precaucion: "bg-alert-precaucion text-white font-bold shadow-md",
      normal: "bg-alert-normal text-white",
    };
    variantClasses = alertClasses[alert];
  } else {
    const variants = {
      default: "bg-gray-200 dark:bg-dark-card text-gray-700 dark:text-gray-200",
      primary: "bg-accent-primary text-white",
      secondary: "bg-accent-secondary text-white",
      success: "bg-accent-tertiary text-white",
      warning: "bg-alert-advertencia text-gray-900",
      danger: "bg-alert-critico text-white",
    };
    variantClasses = variants[variant];
  }

  return (
    <span
      className={`inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-full leading-none ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
}
