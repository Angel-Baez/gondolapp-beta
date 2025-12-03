"use client";

import { HistorialList } from "@/components/reposicion/HistorialList";
import { Calendar, History } from "lucide-react";
import { NativeHeader } from "@/components/ui";
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

  const handleDesdeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fecha = e.target.value ? new Date(e.target.value) : undefined;
    setFiltros({ ...filtros, desde: fecha });
  };

  const handleHastaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fecha = e.target.value ? new Date(e.target.value) : undefined;
    setFiltros({ ...filtros, hasta: fecha });
  };

  const limpiarFiltros = () => {
    setFiltros({ limite: 100 });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg font-sans transition-colors">
      <div className="max-w-lg mx-auto bg-white dark:bg-dark-surface min-h-screen sm:rounded-3xl sm:my-4 shadow-2xl overflow-hidden flex flex-col transition-colors">
        <NativeHeader
          title="Historial de Listas"
          subtitle="Revisa todas tus listas guardadas"
          icon={History}
          backHref="/"
          accentColor="cyan"
        />

        {/* Filtros */}
        <div className="p-4 bg-gray-50 dark:bg-dark-bg transition-colors">
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className="w-full bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-gray-200 dark:border-dark-border flex items-center justify-between hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-600 dark:text-gray-400" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">Filtrar por fecha</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {showFiltros ? "Ocultar" : "Mostrar"}
            </span>
          </button>

          {showFiltros && (
            <div className="mt-4 bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-gray-200 dark:border-dark-border space-y-4 transition-colors">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Desde
                </label>
                <input
                  type="date"
                  onChange={handleDesdeChange}
                  value={
                    filtros.desde
                      ? new Date(filtros.desde).toISOString().split("T")[0]
                      : ""
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Hasta
                </label>
                <input
                  type="date"
                  onChange={handleHastaChange}
                  value={
                    filtros.hasta
                      ? new Date(filtros.hasta).toISOString().split("T")[0]
                      : ""
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                />
              </div>
              <button
                onClick={limpiarFiltros}
                className="w-full bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-dark-border text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Lista de historial */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-dark-bg transition-colors">
          <HistorialList filtros={filtros} />
        </div>
      </div>
    </div>
  );
}
