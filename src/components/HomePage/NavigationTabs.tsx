import { ListChecks, Clock } from "lucide-react";
import { motion as m } from "framer-motion";

type ActiveView = "reposicion" | "vencimiento";

interface NavigationTabsProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

/**
 * NavigationTabs component para HomePage
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de mostrar y manejar tabs de navegación
 * - ISP: Interface específica con props claras
 */
export function NavigationTabs({ activeView, onViewChange }: NavigationTabsProps) {
  return (
    <nav className="p-4 bg-white border-b border-gray-100">
      <div className="flex justify-around bg-gray-100 p-1 rounded-full shadow-inner">
        <m.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onViewChange("reposicion")}
          className={`flex-1 py-2 rounded-full font-bold transition-all flex items-center justify-center ${
            activeView === "reposicion"
              ? "bg-accent-primary text-white shadow-md"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          {/* ✨ Icono con animación cuando está activo */}
          <m.div
            animate={
              activeView === "reposicion"
                ? {
                    y: [0, -3, 0],
                    rotate: [0, -5, 5, 0],
                  }
                : { y: 0, rotate: 0 }
            }
            transition={{
              duration: 1.5,
              ease: "easeInOut",
            }}
          >
            <ListChecks size={20} className="mr-2" />
          </m.div>
          Reposición
        </m.button>
        <m.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onViewChange("vencimiento")}
          className={`flex-1 py-2 rounded-full font-bold transition-all flex items-center justify-center ${
            activeView === "vencimiento"
              ? "bg-accent-secondary text-white shadow-md"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          {/* ✨ Icono con animación de reloj cuando está activo */}
          <m.div
            animate={
              activeView === "vencimiento"
                ? {
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.1, 1],
                  }
                : { rotate: 0, scale: 1 }
            }
            transition={{
              duration: 2,
              ease: "easeInOut",
            }}
          >
            <Clock size={20} className="mr-2" />
          </m.div>
          Vencimientos
        </m.button>
      </div>
    </nav>
  );
}
