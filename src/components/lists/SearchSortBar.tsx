"use client";

import { OpcionOrden } from "@/hooks/useListFilters";
import { Search } from "lucide-react";

interface SearchSortBarProps {
  busqueda: string;
  onBusquedaChange: (value: string) => void;
  orden: string;
  onOrdenChange: (value: string) => void;
  opcionesOrden: OpcionOrden[];
  placeholder?: string;
}

export function SearchSortBar({
  busqueda,
  onBusquedaChange,
  orden,
  onOrdenChange,
  opcionesOrden,
  placeholder = "Buscar producto...",
}: SearchSortBarProps) {
  return (
    <div className="flex gap-2 mb-4 px-4 sm:px-0">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>
      <select
        value={orden}
        onChange={(e) => onOrdenChange(e.target.value)}
        className="px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        {opcionesOrden.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
    </div>
  );
}
