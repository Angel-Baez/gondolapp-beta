"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { sumarDias } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export interface ExpiryQuickSheetProps {
  isOpen: boolean;
  producto: { nombre: string } | null;
  /** Última fecha registrada en la sesión: habilita el chip "Misma fecha"
   * para registrar lotes enteros con 1 tap por producto. */
  ultimaFecha?: Date | null;
  onSubmit: (v: { fecha: Date; cantidad?: number; lote?: string }) => void;
  onClose: () => void;
  isPending: boolean;
}

const PRESETS = [7, 15, 30, 60, 90];

const formatearFechaCorta = (fecha: Date) =>
  new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(fecha);

/** Entrada de fecha de vencimiento más rápida posible: preset o "misma fecha"
 * registran directo en 1 tap; el input + botón quedan para fechas manuales. */
export function ExpiryQuickSheet({
  isOpen,
  producto,
  ultimaFecha,
  onSubmit,
  onClose,
  isPending,
}: ExpiryQuickSheetProps) {
  const [fecha, setFecha] = useState("");
  const [detallesAbiertos, setDetallesAbiertos] = useState(false);
  const [cantidad, setCantidad] = useState("");
  const [lote, setLote] = useState("");

  const reset = () => {
    setFecha("");
    setDetallesAbiertos(false);
    setCantidad("");
    setLote("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const confirmarFecha = (fechaElegida: Date) => {
    if (isPending) return;
    onSubmit({
      fecha: fechaElegida,
      cantidad: cantidad ? parseInt(cantidad, 10) : undefined,
      lote: lote || undefined,
    });
    reset();
  };

  const handleSubmitManual = () => {
    if (!fecha) return;
    confirmarFecha(new Date(`${fecha}T00:00:00`));
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
          {ultimaFecha && (
            <button
              onClick={() => confirmarFecha(ultimaFecha)}
              disabled={isPending}
              className="tap-compact px-3.5 rounded-chip text-subhead font-semibold bg-accent text-on-accent disabled:opacity-40 transition-opacity"
            >
              Misma fecha ({formatearFechaCorta(ultimaFecha)})
            </button>
          )}
          {PRESETS.map((dias) => (
            <button
              key={dias}
              onClick={() => confirmarFecha(sumarDias(dias))}
              disabled={isPending}
              className="tap-compact px-3.5 rounded-chip text-subhead font-semibold bg-surface-2 text-fg-secondary disabled:opacity-40 transition-colors"
            >
              +{dias}d
            </button>
          ))}
        </div>

        <div>
          <label className="block text-footnote font-semibold text-fg-secondary mb-1.5">
            Fecha de vencimiento
          </label>
          {/* Sin autoFocus: en Android abriría el picker nativo tapando los presets */}
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full h-14 px-4 rounded-field bg-surface-2 text-headline text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
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
          onClick={handleSubmitManual}
          disabled={!fecha || isPending}
          className="w-full h-14 rounded-field bg-accent text-on-accent text-headline font-semibold disabled:opacity-40 transition-opacity"
        >
          {isPending ? "Registrando..." : "Registrar"}
        </button>
      </div>
    </BottomSheet>
  );
}
