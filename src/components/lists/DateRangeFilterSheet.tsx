"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";

export interface DateRangeFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  desde?: Date;
  hasta?: Date;
  onDesdeChange: (fecha: Date | undefined) => void;
  onHastaChange: (fecha: Date | undefined) => void;
  onLimpiar: () => void;
}

const aInputValue = (fecha?: Date) => (fecha ? new Date(fecha).toISOString().split("T")[0] : "");

/** Sheet de filtro por rango de fechas, compartido por los historiales de reposición y vencimiento. */
export function DateRangeFilterSheet({
  isOpen,
  onClose,
  desde,
  hasta,
  onDesdeChange,
  onHastaChange,
  onLimpiar,
}: DateRangeFilterSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filtrar por fecha">
      <div className="space-y-4">
        <div>
          <label className="block text-footnote font-semibold text-fg-secondary mb-1.5">Desde</label>
          <input
            type="date"
            value={aInputValue(desde)}
            onChange={(e) => onDesdeChange(e.target.value ? new Date(e.target.value) : undefined)}
            className="w-full h-12 px-4 rounded-field bg-surface-2 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <div>
          <label className="block text-footnote font-semibold text-fg-secondary mb-1.5">Hasta</label>
          <input
            type="date"
            value={aInputValue(hasta)}
            onChange={(e) => onHastaChange(e.target.value ? new Date(e.target.value) : undefined)}
            className="w-full h-12 px-4 rounded-field bg-surface-2 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <button
          onClick={onLimpiar}
          className="w-full h-12 bg-surface-2 hover:bg-border text-fg-secondary font-semibold rounded-field transition-colors"
        >
          Limpiar filtros
        </button>
      </div>
    </BottomSheet>
  );
}
