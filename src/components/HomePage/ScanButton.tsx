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
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onScanClick}
        className={`w-full py-4 rounded-xl text-white font-bold flex items-center justify-center ${
          activeView === "reposicion"
            ? "bg-accent-primary hover:bg-accent-primary/90"
            : "bg-accent-secondary hover:bg-accent-secondary/90"
        } transition shadow-md`}
      >
        {/* ✨ Icono de scanner con pulso */}
        <m.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Scan size={24} className="mr-2" />
        </m.div>
        Escanear Producto
      </m.button>
    </section>
  );
}
