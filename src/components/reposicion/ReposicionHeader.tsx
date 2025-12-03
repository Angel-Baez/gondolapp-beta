import { History } from "lucide-react";
import Link from "next/link";
import { RefreshButton } from "@/components/ui";

interface ReposicionHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ReposicionHeader({ onRefresh, isRefreshing = false }: ReposicionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
      <div className="flex items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Lista de Reposición
        </h2>
        {onRefresh && (
          <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} />
        )}
      </div>
      <Link
        href="/reposicion/historial"
        className="flex items-center gap-2 text-sm sm:text-base text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold transition-colors bg-cyan-50 dark:bg-cyan-900/30 px-3 py-2 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/50"
      >
        <History size={20} />
        <span className="hidden sm:inline">Ver Historial</span>
        <span className="sm:hidden">Historial</span>
      </Link>
    </div>
  );
}
