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
    <div className="flex gap-2 mb-4">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-tertiary"
        />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 pl-9 pr-3 text-subhead bg-surface-2 rounded-field text-fg placeholder:text-fg-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>
      <select
        value={orden}
        onChange={(e) => onOrdenChange(e.target.value)}
        className="h-11 px-3 text-subhead bg-surface-2 rounded-field text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
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
