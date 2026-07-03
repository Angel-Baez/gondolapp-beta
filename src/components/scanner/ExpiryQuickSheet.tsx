"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { sumarDias, toDateInputValue } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export interface ExpiryQuickSheetProps {
  isOpen: boolean;
  producto: { nombre: string } | null;
  onSubmit: (v: { fecha: Date; cantidad?: number; lote?: string }) => void;
  onClose: () => void;
  isPending: boolean;
}

const PRESETS = [7, 15, 30, 60, 90];

/** Entrada de fecha de vencimiento más rápida posible: preset (1 tap) + confirmar. */
export function ExpiryQuickSheet({
  isOpen,
  producto,
  onSubmit,
  onClose,
  isPending,
}: ExpiryQuickSheetProps) {
  const [fecha, setFecha] = useState("");
  const [presetActivo, setPresetActivo] = useState<number | null>(null);
  const [detallesAbiertos, setDetallesAbiertos] = useState(false);
  const [cantidad, setCantidad] = useState("");
  const [lote, setLote] = useState("");

  const reset = () => {
    setFecha("");
    setPresetActivo(null);
    setDetallesAbiertos(false);
    setCantidad("");
    setLote("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const elegirPreset = (dias: number) => {
    setPresetActivo(dias);
    setFecha(toDateInputValue(sumarDias(dias)));
  };

  const handleSubmit = () => {
    if (!fecha) return;
    onSubmit({
      fecha: new Date(fecha),
      cantidad: cantidad ? parseInt(cantidad, 10) : undefined,
      lote: lote || undefined,
    });
    reset();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Registrar vencimiento">
      <div className="space-y-4">
        {producto && (
          <div className="p-3 rounded-field bg-surface-2">
            <p className="text-headline text-fg">{producto.nombre}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((dias) => (
            <button
              key={dias}
              onClick={() => elegirPreset(dias)}
              className={`tap-compact px-3.5 rounded-chip text-subhead font-semibold transition-colors ${
                presetActivo === dias
                  ? "bg-accent text-on-accent"
                  : "bg-surface-2 text-fg-secondary"
              }`}
            >
              +{dias}d
            </button>
          ))}
        </div>

        <div>
          <label className="block text-footnote font-semibold text-fg-secondary mb-1.5">
            Fecha de vencimiento
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setPresetActivo(null);
            }}
            className="w-full h-14 px-4 rounded-field bg-surface-2 text-headline text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
            autoFocus
          />
        </div>

        <button
          onClick={() => setDetallesAbiertos((v) => !v)}
          className="w-full flex items-center justify-between text-subhead font-semibold text-fg-secondary py-1"
        >
          Más opciones (cantidad, lote)
          <ChevronDown
            size={18}
            className={`transition-transform ${detallesAbiertos ? "rotate-180" : ""}`}
          />
        </button>

        {detallesAbiertos && (
          <div className="space-y-3">
            <input
              type="number"
              min={1}
              placeholder="Cantidad (opcional)"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full h-12 px-4 rounded-field bg-surface-2 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <input
              type="text"
              placeholder="Lote (opcional, ej: L12345)"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              className="w-full h-12 px-4 rounded-field bg-surface-2 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!fecha || isPending}
          className="w-full h-14 rounded-field bg-accent text-on-accent text-headline font-semibold disabled:opacity-40 transition-opacity"
        >
          {isPending ? "Registrando..." : "Registrar"}
        </button>
      </div>
    </BottomSheet>
  );
}
