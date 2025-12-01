/**
 * FeedbackSearchAndFilters - Componente para búsqueda y filtros
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de la búsqueda y filtros
 * - OCP: Fácil de extender agregando nuevos filtros
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui";
import { FeedbackEstado, FeedbackPrioridad, FeedbackTipo } from "@/types";
import { ESTADO_OPTIONS, PRIORIDAD_OPTIONS, TIPO_OPTIONS } from "./constants";

interface FeedbackSearchAndFiltersProps {
  busqueda: string;
  filtroEstado: FeedbackEstado | "";
  filtroPrioridad: FeedbackPrioridad | "";
  filtroTipo: FeedbackTipo | "";
  onBusquedaChange: (value: string) => void;
  onEstadoChange: (value: FeedbackEstado | "") => void;
  onPrioridadChange: (value: FeedbackPrioridad | "") => void;
  onTipoChange: (value: FeedbackTipo | "") => void;
}

/**
 * Barra de búsqueda y filtros expandibles
 */
export function FeedbackSearchAndFilters({
  busqueda,
  filtroEstado,
  filtroPrioridad,
  filtroTipo,
  onBusquedaChange,
  onEstadoChange,
  onPrioridadChange,
  onTipoChange,
}: FeedbackSearchAndFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="p-4 border-b border-gray-200 dark:border-dark-border space-y-3 transition-colors">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Buscar por título o descripción..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 rounded-xl focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
          />
        </div>
        <Button
          variant={showFilters ? "primary" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>

      {/* Filtros expandidos */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <FilterSelect
                label="Estado"
                value={filtroEstado}
                onChange={(v) => onEstadoChange(v as FeedbackEstado | "")}
                options={ESTADO_OPTIONS}
                allLabel="Todos"
              />
              <FilterSelect
                label="Prioridad"
                value={filtroPrioridad}
                onChange={(v) => onPrioridadChange(v as FeedbackPrioridad | "")}
                options={PRIORIDAD_OPTIONS}
                allLabel="Todas"
              />
              <FilterSelect
                label="Tipo"
                value={filtroTipo}
                onChange={(v) => onTipoChange(v as FeedbackTipo | "")}
                options={TIPO_OPTIONS}
                allLabel="Todos"
                optionLabels={{
                  Bug: "Bug/Defecto",
                  Mejora: "Sugerencia",
                  Pregunta: "Duda/Consulta",
                  Otro: "Otro",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel: string;
  optionLabels?: Record<string, string>;
}

function FilterSelect({ label, value, onChange, options, allLabel, optionLabels }: FilterSelectProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 rounded-xl focus:border-accent-primary focus:outline-none transition-colors"
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {optionLabels?.[opt] || opt}
          </option>
        ))}
      </select>
    </div>
  );
}
