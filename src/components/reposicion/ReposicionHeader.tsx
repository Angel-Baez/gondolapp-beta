import { History } from "lucide-react";
import Link from "next/link";

/**
 * ReposicionHeader - One UI 8.5 Design
 * 
 * Features:
 * - Large, bold typography for reachability
 * - Glass pill button for history link
 * - Neon cyan accent colors
 */
export function ReposicionHeader() {
  return (
    <div className="pt-12 pb-6 px-4">
      <h1 className="text-5xl font-bold text-white mb-8 text-glow-cyan">
        Lista de Reposición
      </h1>
      
      <Link href="/reposicion/historial">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full 
                      bg-white/5 backdrop-blur-xl border border-white/10
                      text-neon-cyan font-semibold
                      hover:bg-white/10 transition-all">
          <History size={20} />
          <span>Ver Historial</span>
        </div>
      </Link>
    </div>
  );
}
