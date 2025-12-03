import { History, Save } from "lucide-react";
import Link from "next/link";
import { motion as m } from "framer-motion";

interface ReposicionHeaderProps {
  showSaveButton?: boolean;
  onSaveClick?: () => void;
}

export function ReposicionHeader({ showSaveButton, onSaveClick }: ReposicionHeaderProps) {
  return (
    <m.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-4"
    >
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
        Lista de Reposición
      </h2>
      <div className="flex items-center gap-2">
        {/* Save button - only shown when there are items */}
        {showSaveButton && onSaveClick && (
          <m.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSaveClick}
            className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 min-h-[44px]"
            aria-label="Guardar lista"
          >
            <Save size={18} />
            <span>Guardar</span>
          </m.button>
        )}
        <Link
          href="/reposicion/historial"
          className="flex items-center gap-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium transition-colors bg-cyan-50 dark:bg-cyan-900/30 px-3 py-2 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-900/50 min-h-[44px]"
        >
          <History size={18} />
          <span>Historial</span>
        </Link>
      </div>
    </m.div>
  );
}
