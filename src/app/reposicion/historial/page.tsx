"use client";

import { HistorialList } from "@/components/reposicion/HistorialList";
import { ArrowLeft, Calendar, History } from "lucide-react";
import Link from "next/link";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={24} />
              <span className="font-semibold">Volver</span>
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-3 rounded-xl">
              <History size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Historial de Listas
              </h1>
              <p className="text-sm text-gray-600">
                Revisa todas tus listas guardadas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="container mx-auto px-4 py-4">
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
      <div className="container mx-auto px-4 pb-8">
        <HistorialList filtros={filtros} />
      </div>
    </div>
  );
}
