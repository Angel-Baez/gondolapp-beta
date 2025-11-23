import { History } from "lucide-react";
import Link from "next/link";

export function ReposicionHeader() {
  return (
    <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
        Lista de Reposición
      </h2>
      <Link
        href="/reposicion/historial"
        className="flex items-center gap-2 text-sm sm:text-base text-cyan-600 hover:text-cyan-700 font-semibold transition-colors bg-cyan-50 px-3 py-2 rounded-lg hover:bg-cyan-100"
      >
        <History size={20} />
        <span className="hidden sm:inline">Ver Historial</span>
        <span className="sm:hidden">Historial</span>
      </Link>
    </div>
  );
}
