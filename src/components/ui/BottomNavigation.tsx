"use client";

import { motion as m, AnimatePresence } from "framer-motion";
import {
  ListChecks,
  Clock,
  Scan,
  RefreshCw,
  Settings,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

type ActiveView = "reposicion" | "vencimiento";

// Color mapping for text to background conversion
const colorToBg: Record<string, string> = {
  "text-cyan-500": "bg-cyan-500",
  "text-red-500": "bg-red-500",
  "text-gray-400": "bg-gray-400",
  "text-gray-500": "bg-gray-500",
};

interface BottomNavigationProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onScanClick: () => void;
  onSyncClick?: () => void;
  onAdminClick?: () => void;
  isSyncing?: boolean;
}

/**
 * BottomNavigation - iOS/Android style bottom tab bar
 * 
 * ✅ Native-like Features:
 * - Fixed at bottom with safe-area-inset support
 * - Floating scan button (center)
 * - Spring animations for tab switches
 * - Haptic feedback on interactions
 * - Touch targets >= 44x44px
 */
export function BottomNavigation({
  activeView,
  onViewChange,
  onScanClick,
  onSyncClick,
  onAdminClick,
  isSyncing = false,
}: BottomNavigationProps) {
  const { haptic } = useHaptics();

  const handleTabPress = (view: ActiveView) => {
    if (view !== activeView) {
      haptic(10); // Light haptic for tab switch
      onViewChange(view);
    }
  };

  const handleScanPress = () => {
    haptic(25); // Medium haptic for primary action
    onScanClick();
  };

  const handleSyncPress = () => {
    if (onSyncClick && !isSyncing) {
      haptic(15);
      onSyncClick();
    }
  };

  const handleAdminPress = () => {
    if (onAdminClick) {
      haptic(10);
      onAdminClick();
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-lg border-t border-gray-200 dark:border-dark-border"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 pt-2">
        {/* Reposición Tab */}
        <NavTab
          isActive={activeView === "reposicion"}
          onClick={() => handleTabPress("reposicion")}
          icon={ListChecks}
          label="Reposición"
          activeColor="text-accent-primary"
        />

        {/* Vencimientos Tab */}
        <NavTab
          isActive={activeView === "vencimiento"}
          onClick={() => handleTabPress("vencimiento")}
          icon={Clock}
          label="Vencimientos"
          activeColor="text-accent-secondary"
        />

        {/* Central Scan FAB */}
        <div className="relative -mt-6">
          <m.button
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={handleScanPress}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg touch-manipulation select-none ${
              activeView === "reposicion"
                ? "bg-accent-primary"
                : "bg-accent-secondary"
            }`}
            aria-label="Escanear código de barras"
          >
            <Scan className="w-7 h-7 text-white" />
          </m.button>
          {/* Glow effect */}
          <m.div
            className={`absolute inset-0 rounded-full -z-10 blur-md ${
              activeView === "reposicion"
                ? "bg-accent-primary/40"
                : "bg-accent-secondary/40"
            }`}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Sync Tab */}
        <NavTab
          isActive={false}
          onClick={handleSyncPress}
          icon={RefreshCw}
          label="Sincronizar"
          activeColor="text-accent-tertiary"
          isLoading={isSyncing}
        />

        {/* Admin Tab */}
        <NavTab
          isActive={false}
          onClick={handleAdminPress}
          icon={Settings}
          label="Admin"
          activeColor="text-gray-600"
        />
      </div>
    </nav>
  );
}

interface NavTabProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  activeColor: string;
  isLoading?: boolean;
}

function NavTab({
  isActive,
  onClick,
  icon: Icon,
  label,
  activeColor,
  isLoading = false,
}: NavTabProps) {
  return (
    <m.button
      whileTap={{ scale: 0.95 }}
      transition={{ type: "tween", duration: 0.1 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-2 py-1 touch-manipulation select-none"
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="relative">
        <m.div
          animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
          transition={
            isLoading
              ? { duration: 1, repeat: Infinity, ease: "linear" }
              : { duration: 0 }
          }
        >
          <Icon
            className={`w-6 h-6 transition-colors duration-150 ${
              isActive ? activeColor : "text-gray-400 dark:text-gray-500"
            }`}
          />
        </m.div>
        <AnimatePresence>
          {isActive && (
            <m.div
              layoutId="nav-indicator"
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                colorToBg[activeColor] || "bg-cyan-500"
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </AnimatePresence>
      </div>
      <span
        className={`text-xs mt-1 font-medium transition-colors duration-150 ${
          isActive ? activeColor : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {label}
      </span>
    </m.button>
  );
}
