/**
 * FeedbackStatsCards - Componente para mostrar estadísticas de feedback
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de mostrar las tarjetas de estadísticas
 * - OCP: Fácil de extender agregando nuevas estadísticas
 */

import { FeedbackStats } from "@/hooks/useFeedbackApi";

interface FeedbackStatsCardsProps {
  stats: FeedbackStats;
}

/**
 * Tarjetas de estadísticas del panel de feedback
 */
export function FeedbackStatsCards({ stats }: FeedbackStatsCardsProps) {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg transition-colors">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
        <StatCard label="Total" value={stats.total} variant="default" />
        <StatCard label="Pendientes" value={stats.pendientes} variant="yellow" />
        <StatCard label="En Progreso" value={stats.enProgreso} variant="blue" />
        <StatCard label="Resueltos" value={stats.resueltos} variant="green" />
        <StatCard label="Descartados" value={stats.descartados} variant="gray" />
        <StatCard label="Críticos" value={stats.criticos} variant="red" />
        <StatCard label="Altos" value={stats.altos} variant="orange" />
      </div>
    </div>
  );
}

// Tipos de variantes de color
type StatVariant = "default" | "yellow" | "blue" | "green" | "gray" | "red" | "orange";

// Estilos por variante (light mode)
const VARIANT_STYLES: Record<StatVariant, { bg: string; text: string; border: string }> = {
  default: { bg: "bg-white dark:bg-dark-surface", text: "text-gray-900 dark:text-gray-100", border: "border-gray-100 dark:border-dark-border" },
  yellow: { bg: "bg-yellow-50 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-100 dark:border-yellow-800" },
  blue: { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-100 dark:border-blue-800" },
  green: { bg: "bg-green-50 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", border: "border-green-100 dark:border-green-800" },
  gray: { bg: "bg-gray-50 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-700" },
  red: { bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", border: "border-red-100 dark:border-red-800" },
  orange: { bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-100 dark:border-orange-800" },
};

const LABEL_COLORS: Record<StatVariant, string> = {
  default: "text-gray-500 dark:text-gray-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  gray: "text-gray-500 dark:text-gray-400",
  red: "text-red-600 dark:text-red-400",
  orange: "text-orange-600 dark:text-orange-400",
};

interface StatCardProps {
  label: string;
  value: number;
  variant: StatVariant;
}

function StatCard({ label, value, variant }: StatCardProps) {
  const styles = VARIANT_STYLES[variant];
  const labelColor = LABEL_COLORS[variant];

  return (
    <div className={`${styles.bg} p-3 rounded-xl shadow-sm border ${styles.border}`}>
      <p className={`text-xs ${labelColor} uppercase`}>{label}</p>
      <p className={`text-2xl font-bold ${styles.text}`}>{value}</p>
    </div>
  );
}
