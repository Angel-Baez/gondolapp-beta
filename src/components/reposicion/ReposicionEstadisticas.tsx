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
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-2 rounded-field animate-pulse" />
          ))}
        </div>
      ) : stats.totalListas === 0 ? (
        <p className="text-subhead text-fg-secondary py-4 text-center">
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
              colorClass="text-estado-repuesto"
            />
            <StatTile
              label="Total sin stock"
              value={stats.totalProductosSinStock}
              colorClass="text-estado-sin-stock"
            />
          </div>

          {stats.productosMasRepuestos.length > 0 && (
            <div>
              <p className="text-footnote font-semibold text-fg-tertiary uppercase tracking-wide mb-2">
                Top productos repuestos
              </p>
              <div className="space-y-1.5">
                {stats.productosMasRepuestos.slice(0, 5).map((p) => (
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
