"use client";

import { PeriodoSelector } from "@/components/lists/PeriodoSelector";
import { StatTile } from "@/components/lists/StatTile";
import { useEstadisticasReposicion } from "@/hooks/useReposicion";
import { BarChart3 } from "lucide-react";
import { useState } from "react";

export function ReposicionEstadisticas() {
  const [periodo, setPeriodo] = useState<"semana" | "mes" | "año">("mes");
  const { data: stats, isLoading } = useEstadisticasReposicion(periodo);

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-gray-200 dark:border-dark-border mb-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-cyan-600 dark:text-cyan-400" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Estadísticas</h3>
        </div>
        <PeriodoSelector periodo={periodo} onChange={setPeriodo} />
      </div>

      {isLoading || !stats ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-dark-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : stats.totalListas === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          No hay listas guardadas en este período
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <StatTile label="Listas guardadas" value={stats.totalListas} />
            <StatTile
              label="Promedio productos/lista"
              value={stats.promedioProductosPorLista.toFixed(1)}
            />
            <StatTile
              label="Total repuestos"
              value={stats.totalProductosRepuestos}
              colorClass="text-emerald-600 dark:text-emerald-400"
            />
            <StatTile
              label="Total sin stock"
              value={stats.totalProductosSinStock}
              colorClass="text-red-600 dark:text-red-400"
            />
          </div>

          {stats.productosMasRepuestos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Top productos repuestos
              </p>
              <div className="space-y-1.5">
                {stats.productosMasRepuestos.slice(0, 5).map((p) => (
                  <div
                    key={p.productoNombre}
                    className="flex items-center justify-between text-sm bg-gray-50 dark:bg-dark-card px-3 py-2 rounded-lg"
                  >
                    <span className="text-gray-700 dark:text-gray-200 truncate">
                      {p.productoNombre}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-gray-100 ml-2">
                      x{p.cantidad}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
