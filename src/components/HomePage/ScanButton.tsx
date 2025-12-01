import { Scan } from "lucide-react";
import { motion as m } from "framer-motion";

type ActiveView = "reposicion" | "vencimiento";

interface ScanButtonProps {
  activeView: ActiveView;
  onScanClick: () => void;
}

/**
 * ScanButton component para HomePage
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de mostrar el botón de escaneo
 * - ISP: Interface específica con props claras
 * 
 * ✨ Native-like Features:
 * - Subtle press animation (no continuous animation to save CPU)
 * - Touch optimized with manipulation
 * - GPU accelerated transform
 */
export function ScanButton({ activeView, onScanClick }: ScanButtonProps) {
  return (
    <section
      className={`p-4 border-b-4 ${
        activeView === "reposicion"
          ? "border-accent-primary/20"
          : "border-accent-secondary/20"
      }`}
    >
      <m.button
        whileTap={{ scale: 0.97 }}
        transition={{ type: "tween", duration: 0.1 }}
        onClick={onScanClick}
        className={`w-full py-4 rounded-xl text-white font-bold flex items-center justify-center select-none touch-manipulation ${
          activeView === "reposicion"
            ? "bg-accent-primary hover:bg-accent-primary/90 active:bg-accent-primary/80"
            : "bg-accent-secondary hover:bg-accent-secondary/90 active:bg-accent-secondary/80"
        } transition-colors duration-100 shadow-md`}
        style={{ willChange: "transform" }}
      >
        <Scan size={24} className="mr-2" />
        Escanear Producto
      </m.button>
    </section>
  );
}
