"use client";

import { motion } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";
import { springs } from "@/lib/animations";

export interface TabItemProps {
  /**
   * Identificador único del tab
   */
  id: string;
  
  /**
   * Icono del tab (React component)
   */
  icon: React.ReactNode;
  
  /**
   * Label del tab
   */
  label: string;
  
  /**
   * Si el tab está activo
   */
  isActive: boolean;
  
  /**
   * Handler al presionar el tab
   */
  onPress: () => void;
  
  /**
   * Badge (número de notificaciones)
   */
  badge?: number;
  
  /**
   * Feedback háptico habilitado
   */
  hapticFeedback?: boolean;
}

/**
 * TabItem - Item individual del BottomTabBar
 * 
 * Representa un tab con icono, label y estado activo.
 */
export function TabItem({
  id,
  icon,
  label,
  isActive,
  onPress,
  badge,
  hapticFeedback = true,
}: TabItemProps) {
  const { trigger } = useHaptics();

  const handlePress = () => {
    if (hapticFeedback && !isActive) {
      trigger("selection");
    }
    onPress();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      transition={springs.snappy}
      onClick={handlePress}
      className={`
        flex-1 
        flex flex-col items-center justify-center 
        gap-1
        min-w-16
        py-2
        touch-manipulation
        touch-target
        relative
        transition-colors duration-200
        ${
          isActive
            ? "text-cyan-500 dark:text-cyan-400"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        }
      `}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      type="button"
    >
      {/* Icono */}
      <div className="relative">
        {icon}
        
        {/* Badge de notificaciones */}
        {badge !== undefined && badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={springs.snappy}
            className="
              absolute -top-1 -right-1
              bg-red-500 text-white
              text-xs font-bold
              min-w-5 h-5
              flex items-center justify-center
              rounded-full
              px-1
            "
            aria-label={`${badge} notificaciones`}
          >
            {badge > 99 ? "99+" : badge}
          </motion.span>
        )}
      </div>

      {/* Label */}
      <span className="text-xs font-medium">{label}</span>

      {/* Indicador de tab activo */}
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 dark:bg-cyan-400"
          transition={springs.native}
        />
      )}
    </motion.button>
  );
}
