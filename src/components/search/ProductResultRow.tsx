"use client";

import { springSnappy } from "@/lib/motion";
import { motion as m } from "framer-motion";
import { Minus, Plus, Package, RotateCcw } from "lucide-react";
import { memo } from "react";

export interface ProductoRowData {
  varianteId: string;
  nombre: string;
  marca?: string;
}

export interface ProductResultRowProps {
  producto: ProductoRowData;
  /** Cuando el ítem recién se agregó, la fila muestra un stepper inline en vez del botón "Agregar". */
  addedState: { cantidad: number } | null;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onUndo: () => void;
}

function ProductResultRowImpl({
  producto,
  addedState,
  onAdd,
  onIncrement,
  onDecrement,
  onUndo,
}: ProductResultRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-1">
      <div className="w-10 h-10 rounded-field bg-surface-2 flex items-center justify-center flex-shrink-0">
        <Package size={18} className="text-fg-tertiary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-fg truncate">{producto.nombre}</p>
        {producto.marca && (
          <p className="text-footnote text-fg-secondary truncate">{producto.marca}</p>
        )}
      </div>

      {addedState ? (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onUndo}
            aria-label="Deshacer"
            className="tap-compact w-9 h-9 rounded-full bg-surface-2 text-fg-secondary flex items-center justify-center"
          >
            <RotateCcw size={14} />
          </button>
          <m.button
            whileTap={{ scale: 0.88 }}
            transition={springSnappy}
            onClick={onDecrement}
            aria-label="Restar uno"
            className="tap-compact w-9 h-9 rounded-full bg-surface-2 text-fg flex items-center justify-center"
          >
            <Minus size={16} />
          </m.button>
          <span className="text-headline text-fg w-6 text-center tabular-nums">
            {addedState.cantidad}
          </span>
          <m.button
            whileTap={{ scale: 0.88 }}
            transition={springSnappy}
            onClick={onIncrement}
            aria-label="Sumar uno"
            className="tap-compact w-9 h-9 rounded-full bg-accent text-on-accent flex items-center justify-center"
          >
            <Plus size={16} />
          </m.button>
        </div>
      ) : (
        <button
          onClick={onAdd}
          className="tap-compact px-4 rounded-full bg-accent-soft text-accent text-subhead font-semibold flex-shrink-0"
        >
          Agregar
        </button>
      )}
    </div>
  );
}

export const ProductResultRow = memo(ProductResultRowImpl);
