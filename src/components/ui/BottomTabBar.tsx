"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import React from "react";

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  accentColor?: "cyan" | "red";
}

/**
 * BottomTabBar - Navegación inferior estilo iOS/Android
 * 
 * Características:
 * - Posicionamiento fijo en la parte inferior con safe-area
 * - Animación spring en el indicador activo
 * - Efecto de escala suave al tocar
 * - Soporte para badges de notificación
 * - Backdrop blur para efecto glassmorphism
 */
export function BottomTabBar({
  tabs,
  activeTab,
  onTabChange,
  accentColor = "cyan",
}: BottomTabBarProps) {
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  
  const accentColors = {
    cyan: {
      active: "text-cyan-500 dark:text-cyan-400",
      indicator: "bg-cyan-500 dark:bg-cyan-400",
      badge: "bg-cyan-500",
    },
    red: {
      active: "text-red-500 dark:text-red-400",
      indicator: "bg-red-500 dark:bg-red-400",
      badge: "bg-red-500",
    },
  };

  const colors = accentColors[accentColor];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-dark-surface/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-dark-border/50 transition-colors"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-lg mx-auto relative">
        {/* Animated indicator line */}
        <motion.div
          className={`absolute top-0 h-0.5 ${colors.indicator} rounded-full`}
          initial={false}
          animate={{
            left: `${(activeIndex / tabs.length) * 100}%`,
            width: `${100 / tabs.length}%`,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
          }}
        />

        <div className="flex justify-around items-center pt-2 pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;

            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-4 min-w-[72px] rounded-xl transition-colors duration-150 select-none touch-manipulation ${
                  isActive
                    ? colors.active
                    : "text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-dark-card"
                }`}
              >
                <div className="relative">
                  <motion.div
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Icon
                      size={24}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </motion.div>
                  
                  {/* Badge */}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`absolute -top-1 -right-1 ${colors.badge} text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1`}
                    >
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </motion.span>
                  )}
                </div>
                
                <motion.span
                  animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.8, y: 0 }}
                  className={`text-[11px] mt-1 font-medium ${
                    isActive ? "font-semibold" : ""
                  }`}
                >
                  {tab.label}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
