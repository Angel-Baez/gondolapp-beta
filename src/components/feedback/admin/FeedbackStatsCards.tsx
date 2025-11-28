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
    <div className="p-4 border-b border-gray-200 bg-gray-50">
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

// Estilos por variante
const VARIANT_STYLES: Record<StatVariant, { bg: string; text: string; border: string }> = {
  default: { bg: "bg-white", text: "text-gray-900", border: "border-gray-100" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-100" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
  green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-100" },
  gray: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-100" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100" },
};

const LABEL_COLORS: Record<StatVariant, string> = {
  default: "text-gray-500",
  yellow: "text-yellow-600",
  blue: "text-blue-600",
  green: "text-green-600",
  gray: "text-gray-500",
  red: "text-red-600",
  orange: "text-orange-600",
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
