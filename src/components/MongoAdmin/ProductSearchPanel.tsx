"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ProductSearchPanelProps {
  onSearch: (filters: {
    query: string;
    marca: string;
    categoria: string;
  }) => void;
}

/**
 * Panel de búsqueda con filtros para productos
 * Single Responsibility: Solo maneja la UI de búsqueda y filtros
 */
export function ProductSearchPanel({ onSearch }: ProductSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch({ query, marca, categoria });
  };

  const handleClear = () => {
    setQuery("");
    setMarca("");
    setCategoria("");
    onSearch({ query: "", marca: "", categoria: "" });
  };

  const hasActiveFilters = marca || categoria;

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda principal */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar por nombre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="pl-10"
          />
        </div>
        <Button
          variant={hasActiveFilters ? "primary" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-2 bg-cyan-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {(marca ? 1 : 0) + (categoria ? 1 : 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca
            </label>
            <Input
              type="text"
              placeholder="Ej: Nestlé, Coca-Cola..."
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <Input
              type="text"
              placeholder="Ej: Lácteos, Bebidas..."
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSearch} className="flex-1">
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <X className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
