"use client";

import { Button } from "@/components/ui";
import { AnimatePresence, motion as m } from "framer-motion";
import { LucideIcon, X } from "lucide-react";

export interface SelectionAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "outline";
  disabled?: boolean;
}

export interface SelectionActionBarProps {
  cantidad: number;
  onCancelar: () => void;
  onSeleccionarTodos: () => void;
  todosSeleccionados: boolean;
  acciones: SelectionAction[];
}

/**
 * Barra flotante de acciones masivas para el modo selección múltiple.
 * Reusable por reposición y vencimiento: cada lista define sus propias
 * acciones (marcar repuesto, eliminar, retirar, etc).
 */
export function SelectionActionBar({
  cantidad,
  onCancelar,
  onSeleccionarTodos,
  todosSeleccionados,
  acciones,
}: SelectionActionBarProps) {
  return (
    <AnimatePresence>
      <m.div
        key="selection-bar"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        style={{ bottom: "var(--tabbar-clearance)" }}
        className="fixed left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-lg glass rounded-card shadow-float p-3 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-subhead font-semibold text-fg">
            {cantidad} seleccionado{cantidad === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onSeleccionarTodos}
              className="text-footnote font-semibold text-accent"
            >
              {todosSeleccionados ? "Ninguno" : "Todos"}
            </button>
            <button
              onClick={onCancelar}
              aria-label="Cancelar selección"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 text-fg-secondary flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {acciones.map((accion) => (
            <Button
              key={accion.label}
              variant={accion.variant ?? "secondary"}
              size="sm"
              disabled={accion.disabled || cantidad === 0}
              onClick={accion.onClick}
              className="flex-1"
            >
              <accion.icon size={16} />
              {accion.label}
            </Button>
          ))}
        </div>
      </m.div>
    </AnimatePresence>
  );
}
