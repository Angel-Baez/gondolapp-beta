"use client";

import Link from "next/link";
import { motion as m } from "framer-motion";
import { ArrowLeft, LucideIcon } from "lucide-react";
import React from "react";

interface NativeHeaderProps {
  /** Main title */
  title: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Icon to display */
  icon?: LucideIcon;
  /** Back navigation URL */
  backHref?: string;
  /** Right side content (buttons, etc) */
  rightContent?: React.ReactNode;
  /** Header style variant */
  variant?: "default" | "large" | "compact";
  /** Color scheme for accent elements */
  accentColor?: "cyan" | "red" | "emerald";
}

const accentColors = {
  cyan: {
    iconBg: "bg-cyan-500/15",
    iconColor: "text-cyan-500",
    gradient: "from-cyan-500/5 to-transparent",
  },
  red: {
    iconBg: "bg-red-500/15",
    iconColor: "text-red-500",
    gradient: "from-red-500/5 to-transparent",
  },
  emerald: {
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-500",
    gradient: "from-emerald-500/5 to-transparent",
  },
};

/**
 * NativeHeader - iOS-style large title header
 *
 * Native-like features:
 * - Large prominent title
 * - Subtle gradient background
 * - Smooth animations
 * - Safe area aware
 * - Touch-optimized back button
 */
export function NativeHeader({
  title,
  subtitle,
  icon: Icon,
  backHref,
  rightContent,
  variant = "default",
  accentColor = "cyan",
}: NativeHeaderProps) {
  const colors = accentColors[accentColor];

  if (variant === "compact") {
    return (
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-dark-surface/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-dark-border/50 safe-area-top">
        <div className="flex items-center justify-between px-4 h-14">
          {backHref ? (
            <Link
              href={backHref}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 -ml-2 p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Volver"
            >
              <ArrowLeft size={20} />
            </Link>
          ) : (
            <div className="w-10" />
          )}

          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h1>

          <div className="w-10 flex justify-end">{rightContent}</div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`relative bg-white dark:bg-dark-surface pt-2 pb-4 px-5 safe-area-top transition-colors overflow-hidden`}
    >
      {/* Subtle gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${colors.gradient} pointer-events-none`}
      />

      <div className="relative z-10">
        {/* Top bar with back button and right content */}
        {(backHref || rightContent) && (
          <div className="flex items-center justify-between mb-3">
            {backHref ? (
              <Link
                href={backHref}
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 -ml-2 p-2 rounded-xl transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Volver"
              >
                <ArrowLeft size={20} />
                <span className="text-sm font-medium">Volver</span>
              </Link>
            ) : (
              <div />
            )}
            {rightContent}
          </div>
        )}

        {/* Main title area */}
        <div className="flex items-center gap-4">
          {Icon && (
            <m.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`${colors.iconBg} p-3 rounded-2xl`}
            >
              <Icon size={28} className={colors.iconColor} strokeWidth={2} />
            </m.div>
          )}

          <div className="flex-1 min-w-0">
            <m.h1
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`${
                variant === "large" ? "text-3xl" : "text-2xl"
              } font-bold text-gray-900 dark:text-gray-100 tracking-tight`}
            >
              {title}
            </m.h1>

            {subtitle && (
              <m.p
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-gray-500 dark:text-gray-400 mt-0.5"
              >
                {subtitle}
              </m.p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
