import { Scan } from "lucide-react";
import { GlassPill } from "../ui/GlassPill";

type ActiveView = "reposicion" | "vencimiento";

interface ScanButtonProps {
  activeView: ActiveView;
  onScanClick: () => void;
}

/**
 * ScanButton component para HomePage - Floating Action Button (FAB)
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de mostrar el botón de escaneo flotante
 * - ISP: Interface específica con props claras
 * 
 * ✨ Deep Glass Features:
 * - Floating action button with GlassPill
 * - Neon glow effect based on active view
 * - Touch optimized with smooth animations
 */
export function ScanButton({ activeView, onScanClick }: ScanButtonProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
      <GlassPill 
        onClick={onScanClick}
        variant={activeView === "reposicion" ? "cyan" : "purple"}
        icon={<Scan size={28} />}
      >
        Escanear Producto
      </GlassPill>
    </div>
  );
}
