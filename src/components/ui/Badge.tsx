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
      vencido: "bg-alert-vencido text-white font-semibold",
      critico: "bg-alert-critico text-white font-semibold",
      advertencia: "bg-alert-advertencia text-white font-semibold",
      precaucion: "bg-alert-precaucion text-fg font-semibold",
      normal: "bg-alert-normal text-white",
    };
    variantClasses = alertClasses[alert];
  } else {
    const variants = {
      default: "bg-surface-2 text-fg-secondary",
      primary: "bg-accent text-on-accent",
      secondary: "bg-estado-sin-stock text-white",
      success: "bg-estado-repuesto text-white",
      warning: "bg-alert-advertencia text-white",
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
