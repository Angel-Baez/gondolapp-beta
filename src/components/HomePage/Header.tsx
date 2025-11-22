import { Archive, Settings } from "lucide-react";
import Link from "next/link";
import { motion as m } from "framer-motion";

/**
 * Header component para HomePage
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de mostrar el header
 * - OCP: Extensible sin modificar código
 */
export function Header() {
  return (
    <header className="bg-gray-900 text-white p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            {/* ✨ Icono con animación de bounce */}
            <m.div
              animate={{
                y: [0, -5, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Archive size={28} className="text-accent-primary" />
            </m.div>
            GondolApp
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gestor de Inventario Inteligente
          </p>
        </div>
        <Link
          href="/admin"
          className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
        >
          {/* ✨ Icono de settings con rotación en hover */}
          <m.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}>
            <Settings size={20} />
          </m.div>
          <span className="hidden sm:inline">Admin</span>
        </Link>
      </div>
    </header>
  );
}
