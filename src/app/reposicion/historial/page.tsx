"use client";

import { DateRangeFilterSheet } from "@/components/lists/DateRangeFilterSheet";
import { HistorialList } from "@/components/reposicion/HistorialList";
import { ReposicionEstadisticas } from "@/components/reposicion/ReposicionEstadisticas";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { Calendar } from "lucide-react";
import { useState } from "react";

export default function HistorialPage() {
  const [filtros, setFiltros] = useState<{
    desde?: Date;
    hasta?: Date;
    limite?: number;
  }>({
    limite: 100, // Limitar a últimas 100 listas por defecto
  });

  const [showFiltros, setShowFiltros] = useState(false);
  const filtroActivo = !!(filtros.desde || filtros.hasta);

  const limpiarFiltros = () => {
    setFiltros({ limite: 100 });
    setShowFiltros(false);
  };

  return (
    <AppShell
      renderHeader={() => (
        <PageHeader title="Historial de reposición" subtitle="Tus listas guardadas" />
      )}
    >
      <div className="pb-8">
        <ReposicionEstadisticas />

        <button
          onClick={() => setShowFiltros(true)}
          className="w-full island p-4 flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-fg-secondary" />
            <span className="text-headline text-fg">Filtrar por fecha</span>
          </div>
          {filtroActivo && (
            <span className="text-caption font-semibold text-accent bg-accent-soft px-2.5 py-1 rounded-chip">
              Activo
            </span>
          )}
        </button>

        <HistorialList filtros={filtros} />
      </div>

      <DateRangeFilterSheet
        isOpen={showFiltros}
        onClose={() => setShowFiltros(false)}
        desde={filtros.desde}
        hasta={filtros.hasta}
        onDesdeChange={(fecha) => setFiltros((f) => ({ ...f, desde: fecha }))}
        onHastaChange={(fecha) => setFiltros((f) => ({ ...f, hasta: fecha }))}
        onLimpiar={limpiarFiltros}
      />
    </AppShell>
  );
}
