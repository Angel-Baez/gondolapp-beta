"use client";

import { useState } from "react";
import { Search, Filter, X, Hash, Barcode } from "lucide-react";
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
 * Detectar tipo de búsqueda para mostrar indicador visual
 */
function detectSearchType(query: string): "objectId" | "ean" | "text" {
  if (!query) return "text";
  
  // ObjectId: 24 caracteres hexadecimales
  if (/^[0-9a-fA-F]{24}$/.test(query)) {
    return "objectId";
  }
  
  // EAN: 8-14 dígitos numéricos
  if (/^\d{8,14}$/.test(query)) {
    return "ean";
  }
  
  return "text";
}

/**
 * Panel de búsqueda con filtros para productos
 * Single Responsibility: Solo maneja la UI de búsqueda y filtros
 * Soporta detección automática de búsqueda por ObjectId y EAN
 */
export function ProductSearchPanel({ onSearch }: ProductSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const searchType = detectSearchType(query);

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
          {searchType === "ean" ? (
            <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
          ) : searchType === "objectId" ? (
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5" />
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          )}
          <Input
            type="text"
            placeholder="Buscar por nombre, EAN o ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className={`pl-10 ${
              searchType === "ean" 
                ? "border-green-300 focus:border-green-500 focus:ring-green-500" 
                : searchType === "objectId"
                ? "border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                : ""
            }`}
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

      {/* Indicador de tipo de búsqueda */}
      {query && searchType !== "text" && (
        <div className={`text-xs px-3 py-1 rounded-full inline-flex items-center gap-1 ${
          searchType === "ean"
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
        }`}>
          {searchType === "ean" ? (
            <>
              <Barcode className="w-3 h-3" />
              Buscando por código de barras
            </>
          ) : (
            <>
              <Hash className="w-3 h-3" />
              Buscando por ObjectId
            </>
          )}
        </div>
      )}

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-dark-card rounded-lg p-4 space-y-3 transition-colors">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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
