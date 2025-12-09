"use client";

import { TabItem } from "./TabItem";
import { TOUCH_TARGETS, Z_INDEX } from "@/lib/constants";

export interface TabConfig {
  /**
   * Identificador único del tab
   */
  id: string;
  
  /**
   * Label visible del tab
   */
  label: string;
  
  /**
   * Icono del tab (React component)
   */
  icon: React.ReactNode;
  
  /**
   * Href para navegación (opcional)
   */
  href?: string;
  
  /**
   * Acción a ejecutar al presionar (alternativa a href)
   */
  action?: () => void;
  
  /**
   * Badge de notificaciones
   */
  badge?: number;
}

export interface BottomTabBarProps {
  /**
   * Configuración de tabs
   */
  tabs: TabConfig[];
  
  /**
   * ID del tab actualmente activo
   */
  activeTab: string;
  
  /**
   * Handler cuando cambia el tab
   */
  onTabChange: (tabId: string) => void;
  
  /**
   * Mostrar labels bajo los iconos
   * @default true
   */
  showLabels?: boolean;
  
  /**
   * Habilitar feedback háptico
   * @default true
   */
  hapticFeedback?: boolean;
  
  /**
   * Clases CSS adicionales
   */
  className?: string;
}

/**
 * BottomTabBar - US-001
 * 
 * Navegación inferior para móviles siguiendo patrones nativos.
 * 
 * Características:
 * - Fijo en la parte inferior de la pantalla
 * - Altura de 56px (Material Design)
 * - Máximo 5 tabs visibles
 * - Indicador animado de tab activo (layoutId)
 * - Respeta safe areas (notch, home indicator)
 * - Feedback háptico al cambiar tabs
 * - Badges para notificaciones
 * 
 * @example
 * <BottomTabBar
 *   tabs={[
 *     { id: 'home', label: 'Inicio', icon: <Home />, href: '/' },
 *     { id: 'scan', label: 'Escanear', icon: <Camera />, action: openScanner },
 *   ]}
 *   activeTab="home"
 *   onTabChange={setActiveTab}
 * />
 */
export function BottomTabBar({
  tabs,
  activeTab,
  onTabChange,
  showLabels = true,
  hapticFeedback = true,
  className = "",
}: BottomTabBarProps) {
  // Validar máximo de tabs
  if (tabs.length > 5) {
    console.warn(
      "BottomTabBar: Se recomienda máximo 5 tabs para mejor UX móvil"
    );
  }

  const handleTabPress = (tab: TabConfig) => {
    // Si tiene acción, ejecutarla
    if (tab.action) {
      tab.action();
    }
    
    // Si tiene href, la navegación se maneja en el componente padre
    // a través de onTabChange
    onTabChange(tab.id);
  };

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0
        bg-white dark:bg-gray-900
        border-t border-gray-200 dark:border-gray-800
        safe-area-bottom
        transition-colors duration-200
        ${className}
      `}
      style={{
        height: `calc(${TOUCH_TARGETS.tabBarHeight}px + env(safe-area-inset-bottom))`,
        zIndex: Z_INDEX.tabBar,
      }}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div
        className="flex items-center justify-around h-14"
        style={{ height: TOUCH_TARGETS.tabBarHeight }}
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            id={tab.id}
            icon={tab.icon}
            label={showLabels ? tab.label : ""}
            isActive={activeTab === tab.id}
            onPress={() => handleTabPress(tab)}
            badge={tab.badge}
            hapticFeedback={hapticFeedback}
          />
        ))}
      </div>
    </nav>
  );
}
