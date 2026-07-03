"use client";

import { springSnappy } from "@/lib/motion";
import { ADJUST_TIMEOUT_MS } from "@/components/scanner/scanFlowMachine";
import { AnimatePresence, motion as m, useAnimationFrame } from "framer-motion";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useRef } from "react";

export interface QuickAdjustCardProps {
  nombre: string;
  tamano?: string;
  cantidad: number;
  deadline: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetCantidad: (n: number) => void;
  onUndo: () => void;
}

const CHIPS = [2, 3, 6, 12];

/**
 * Card flotante sobre la cámara para ajustar la cantidad de un producto
 * recién auto-agregado. Posición absoluta (no reflow del video) y
 * auto-descarte via `deadline`, re-armado por el padre en cada interacción.
 */
export function QuickAdjustCard({
  nombre,
  tamano,
  cantidad,
  deadline,
  onIncrement,
  onDecrement,
  onSetCantidad,
  onUndo,
}: QuickAdjustCardProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useAnimationFrame(() => {
    if (!barRef.current) return;
    const restante = Math.max(0, deadline - Date.now());
    const pct = Math.min(100, Math.max(0, (restante / ADJUST_TIMEOUT_MS) * 100));
    barRef.current.style.width = `${pct}%`;
  });

  return (
    <AnimatePresence>
      <m.div
        key="quick-adjust"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={springSnappy}
        className="absolute left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-sm"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}
      >
        <div className="glass rounded-card shadow-float overflow-hidden">
          <div className="h-1 bg-white/10">
            <div ref={barRef} className="h-full bg-accent" style={{ width: "100%" }} />
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <p className="text-headline text-fg truncate">{nombre}</p>
                {tamano && <p className="text-footnote text-fg-secondary">{tamano}</p>}
              </div>
              <button
                onClick={onUndo}
                className="tap-compact flex items-center gap-1 px-2.5 rounded-full bg-surface-2 text-fg-secondary text-caption font-semibold flex-shrink-0"
              >
                <RotateCcw size={13} />
                Deshacer
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 mb-3">
              <m.button
                whileTap={{ scale: 0.88 }}
                transition={springSnappy}
                onClick={onDecrement}
                aria-label="Restar uno"
                className="w-14 h-14 rounded-full bg-surface-2 text-fg flex items-center justify-center"
              >
                <Minus size={22} />
              </m.button>
              <span className="text-title1 text-fg w-14 text-center tabular-nums">
                {cantidad}
              </span>
              <m.button
                whileTap={{ scale: 0.88 }}
                transition={springSnappy}
                onClick={onIncrement}
                aria-label="Sumar uno"
                className="w-14 h-14 rounded-full bg-accent text-on-accent flex items-center justify-center"
              >
                <Plus size={22} />
              </m.button>
            </div>

            <div className="flex items-center justify-center gap-2">
              {CHIPS.map((n) => (
                <button
                  key={n}
                  onClick={() => onSetCantidad(n)}
                  className={`tap-compact px-3.5 rounded-chip text-subhead font-semibold transition-colors ${
                    cantidad === n
                      ? "bg-accent text-on-accent"
                      : "bg-surface-2 text-fg-secondary"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
