/**
 * FeedbackReporteListItem - Componente para mostrar un item de reporte en la lista
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de renderizar un item de la lista
 * - OCP: Fácil de extender con nuevos campos o estilos
 */

import { motion } from "framer-motion";
import { Monitor } from "lucide-react";
import { FeedbackReporte } from "@/types";
import { TIPO_ICONS, ESTADO_COLORS, ESTADO_ICONS, PRIORIDAD_COLORS, DISPOSITIVO_ICONS } from "./constants";
import { formatearFecha } from "./utils";

interface FeedbackReporteListItemProps {
  reporte: FeedbackReporte;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Item individual de la lista de reportes
 */
export function FeedbackReporteListItem({ reporte, isSelected, onClick }: FeedbackReporteListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`p-4 hover:bg-gray-50 dark:hover:bg-dark-card cursor-pointer transition-colors ${
        isSelected ? "bg-accent-primary/5 dark:bg-accent-primary/10" : ""
      } ${!reporte.leidoEn ? "border-l-4 border-l-accent-primary" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Tipos */}
          <div className="flex flex-wrap gap-1 mb-2">
            {reporte.tipo.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300"
              >
                {TIPO_ICONS[t]}
                {t}
              </span>
            ))}
          </div>
          {/* Título */}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{reporte.titulo}</h3>
          {/* Descripción truncada */}
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
            {reporte.descripcion}
          </p>
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400 dark:text-gray-500">
            <span>{formatearFecha(reporte.creadoAt)}</span>
            {reporte.userEmail && (
              <>
                <span>•</span>
                <span>{reporte.userEmail}</span>
              </>
            )}
            {reporte.metadata?.dispositivo && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  {DISPOSITIVO_ICONS[reporte.metadata.dispositivo] || <Monitor size={12} />}
                  {reporte.metadata.dispositivo}
                </span>
              </>
            )}
          </div>
        </div>
        {/* Estado y Prioridad */}
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${ESTADO_COLORS[reporte.estado]}`}>
            {ESTADO_ICONS[reporte.estado]}
            {reporte.estado}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORIDAD_COLORS[reporte.prioridad]}`}>
            {reporte.prioridad}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
