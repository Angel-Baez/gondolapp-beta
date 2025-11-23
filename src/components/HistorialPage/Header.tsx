import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";

/**
 * Header component para HistorialPage
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de mostrar el header del historial
 */
export function Header() {
  return (
    <header className="bg-gray-900 text-white p-6 shadow-lg">
      <Link
        href="/"
        className="inline-flex items-center text-accent-primary hover:text-cyan-400 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Inventario
      </Link>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent-primary/20 rounded-lg">
          <History className="w-8 h-8 text-accent-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Historial de Listas</h1>
          <p className="text-sm text-gray-400 mt-1">
            Revisa todas tus listas guardadas
          </p>
        </div>
      </div>
    </header>
  );
}
