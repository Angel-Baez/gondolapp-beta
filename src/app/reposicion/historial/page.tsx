"use client";

import { HistorialList } from "@/components/reposicion/HistorialList";
import { Calendar } from "lucide-react";
import { Header } from "@/components/HistorialPage/Header";
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
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-lg mx-auto bg-white min-h-screen sm:rounded-3xl sm:my-4 shadow-2xl overflow-hidden flex flex-col">
        <Header />

        {/* Filtros */}
        <div className="p-4 bg-gray-50">
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-600" />
              <span className="font-semibold text-gray-900">Filtrar por fecha</span>
            </div>
            <span className="text-gray-500 text-sm">
              {showFiltros ? "Ocultar" : "Mostrar"}
            </span>
          </button>

          {showFiltros && (
            <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={limpiarFiltros}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Lista de historial */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <HistorialList filtros={filtros} />
        </div>
      </div>
    </div>
  );
}
