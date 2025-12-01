import { ListChecks, Clock } from "lucide-react";
import { motion as m } from "framer-motion";

type ActiveView = "reposicion" | "vencimiento";

interface NavigationTabsProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

// Tab indicator positioning - matches container padding
const TAB_INDICATOR_OFFSET = "4px";

/**
 * NavigationTabs component para HomePage
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de mostrar y manejar tabs de navegación
 * - ISP: Interface específica con props claras
 * 
 * ✨ Native-like Features:
 * - Animated indicator with layoutId (iOS segment control feel)
 * - Smooth transitions with spring physics
 * - Touch optimized with manipulation
 */
export function NavigationTabs({ activeView, onViewChange }: NavigationTabsProps) {
  return (
    <nav className="p-4 bg-white border-b border-gray-100">
      <div className="relative flex justify-around bg-gray-100 p-1 rounded-full shadow-inner">
        {/* Animated background indicator */}
        <m.div
          layoutId="tab-indicator"
          className={`absolute inset-y-1 rounded-full shadow-md ${
            activeView === "reposicion" ? "bg-accent-primary" : "bg-accent-secondary"
          }`}
          style={{
            left: activeView === "reposicion" ? TAB_INDICATOR_OFFSET : "50%",
            right: activeView === "reposicion" ? "50%" : TAB_INDICATOR_OFFSET,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        />
        
        {/* Reposición Tab */}
        <m.button
          whileTap={{ scale: 0.98 }}
          transition={{ type: "tween", duration: 0.1 }}
          onClick={() => onViewChange("reposicion")}
          className={`relative flex-1 py-2 rounded-full font-bold flex items-center justify-center z-10 transition-colors duration-150 select-none touch-manipulation ${
            activeView === "reposicion"
              ? "text-white"
              : "text-gray-600"
          }`}
        >
          <ListChecks size={20} className="mr-2" />
          Reposición
        </m.button>
        
        {/* Vencimientos Tab */}
        <m.button
          whileTap={{ scale: 0.98 }}
          transition={{ type: "tween", duration: 0.1 }}
          onClick={() => onViewChange("vencimiento")}
          className={`relative flex-1 py-2 rounded-full font-bold flex items-center justify-center z-10 transition-colors duration-150 select-none touch-manipulation ${
            activeView === "vencimiento"
              ? "text-white"
              : "text-gray-600"
          }`}
        >
          <Clock size={20} className="mr-2" />
          Vencimientos
        </m.button>
      </div>
    </nav>
  );
}
