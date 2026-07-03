"use client";

import { PeriodoSelector } from "@/components/lists/PeriodoSelector";
import { StatTile } from "@/components/lists/StatTile";
import { useEstadisticasVencimiento } from "@/hooks/useVencimiento";
import { BarChart3 } from "lucide-react";
import { useState } from "react";

export function VencimientoEstadisticas() {
  const [periodo, setPeriodo] = useState<"semana" | "mes" | "año">("mes");
  const { data: stats, isLoading } = useEstadisticasVencimiento(periodo);

  return (
    <div className="island p-4 mb-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-accent" />
          <h3 className="text-headline text-fg">Estadísticas</h3>
        </div>
        <PeriodoSelector periodo={periodo} onChange={setPeriodo} />
      </div>

      {isLoading || !stats ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-2 rounded-field animate-pulse" />
          ))}
        </div>
      ) : stats.totalRetirados === 0 ? (
        <p className="text-subhead text-fg-secondary py-4 text-center">
          No hay productos retirados en este período
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <StatTile label="Productos retirados" value={stats.totalRetirados} />
            <StatTile
              label="Promedio días vs. vencimiento"
              value={
                stats.promedioDiasARetiro > 0
                  ? `+${stats.promedioDiasARetiro.toFixed(1)}`
                  : stats.promedioDiasARetiro.toFixed(1)
              }
              colorClass={
                stats.promedioDiasARetiro > 0 ? "text-alert-vencido" : "text-estado-repuesto"
              }
            />
          </div>

          {stats.productosMasRetirados.length > 0 && (
            <div>
              <p className="text-footnote font-semibold text-fg-tertiary uppercase tracking-wide mb-2">
                Top productos retirados
              </p>
              <div className="space-y-1.5">
                {stats.productosMasRetirados.slice(0, 5).map((p) => (
                  <div
                    key={p.productoNombre}
                    className="flex items-center justify-between text-subhead bg-surface-2 px-3 py-2 rounded-field"
                  >
                    <span className="text-fg-secondary truncate">{p.productoNombre}</span>
                    <span className="font-semibold text-fg ml-2">x{p.cantidad}</span>
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
