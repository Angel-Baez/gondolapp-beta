import { History } from "lucide-react";
import Link from "next/link";
import { motion as m } from "framer-motion";

export function ReposicionHeader() {
  return (
    <m.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-4"
    >
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
        Lista de Reposición
      </h2>
      <Link
        href="/reposicion/historial"
        className="flex items-center gap-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium transition-colors bg-cyan-50 dark:bg-cyan-900/30 px-3 py-2 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-900/50 min-h-[44px]"
      >
        <History size={18} />
        <span>Historial</span>
      </Link>
    </m.div>
  );
}
