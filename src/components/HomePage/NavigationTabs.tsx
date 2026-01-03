import { ListChecks, Clock } from "lucide-react";
import { motion as m } from "framer-motion";
import { GlassCard } from "../ui/GlassCard";

type ActiveView = "reposicion" | "vencimiento";

interface NavigationTabsProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

/**
 * NavigationTabs component para HomePage - Deep Glass Design
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de mostrar y manejar tabs de navegación
 * - ISP: Interface específica con props claras
 * 
 * ✨ Deep Glass Features:
 * - Floating glass pill with backdrop blur
 * - Animated indicator with neon glow
 * - Smooth transitions with spring physics
 */
export function NavigationTabs({ activeView, onViewChange }: NavigationTabsProps) {
  return (
    <nav className="p-4">
      <GlassCard variant="light" className="p-1">
        <div className="relative flex justify-around">
          {/* Indicador animado con glow */}
          <m.div
            layoutId="tab-indicator"
            className={`absolute inset-y-1 rounded-full ${
              activeView === "reposicion" 
                ? "bg-neon-cyan/30 shadow-[0_0_30px_rgba(0,240,255,0.5)]" 
                : "bg-neon-purple/30 shadow-[0_0_30px_rgba(180,122,255,0.5)]"
            }`}
            style={{
              left: activeView === "reposicion" ? "4px" : "50%",
              right: activeView === "reposicion" ? "50%" : "4px",
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
            className={`relative flex-1 py-3 rounded-full font-bold flex items-center justify-center z-10 transition-colors duration-150 select-none touch-manipulation ${
              activeView === "reposicion"
                ? "text-neon-cyan"
                : "text-white/50"
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
            className={`relative flex-1 py-3 rounded-full font-bold flex items-center justify-center z-10 transition-colors duration-150 select-none touch-manipulation ${
              activeView === "vencimiento"
                ? "text-neon-purple"
                : "text-white/50"
            }`}
          >
            <Clock size={20} className="mr-2" />
            Vencimientos
          </m.button>
        </div>
      </GlassCard>
    </nav>
  );
}
