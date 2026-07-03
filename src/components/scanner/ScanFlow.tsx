"use client";

import { useHaptics } from "@/hooks/useHaptics";
import { fetchMarcasCategorias, MARCAS_CATEGORIAS_KEY } from "@/hooks/useMarcasCategorias";
import { ProductoEscaneado, useScanProduct } from "@/hooks/useScanProduct";
import {
  useActualizarCantidadReposicion,
  useAgregarReposicionItem,
  useEliminarReposicionItemDirecto,
} from "@/hooks/useReposicion";
import { useAgregarVencimientoItem } from "@/hooks/useVencimiento";
import { useRecentsStore } from "@/store/recents";
import { ScanMode } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ExpiryQuickSheet } from "./ExpiryQuickSheet";
import { ManualProductSheet } from "./ManualProductSheet";
import { QuickAdjustCard } from "./QuickAdjustCard";
import {
  ScanFlowEffect,
  ScanFlowEvent,
  ScanFlowState,
  initialScanFlowState,
  scanFlowReduce,
} from "./scanFlowMachine";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="glass rounded-card p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-accent mx-auto" />
        <p className="mt-4 text-sm text-white/80">Cargando escáner...</p>
      </div>
    </div>
  ),
});

export interface ScanFlowProps {
  scanMode: ScanMode;
  onClose: () => void;
  /** Si se provee, ofrece "buscar por nombre" desde la entrada manual del escáner. */
  onRequestSearch?: () => void;
}

const MODE_LABEL: Record<ScanMode, string> = {
  reposicion: "Reposición",
  vencimiento: "Vencimientos",
};

/**
 * Orquesta la sesión de escaneo completa: cámara + auto-agregado (reposición)
 * o alta de fecha (vencimiento) + alta manual para EAN desconocido.
 * La lógica de transición vive en scanFlowMachine.ts (reducer puro); acá
 * sólo se ejecutan los efectos (red, mutaciones) y se renderiza según `mode`.
 */
export function ScanFlow({ scanMode, onClose, onRequestSearch }: ScanFlowProps) {
  const [state, setState] = useState<ScanFlowState>(initialScanFlowState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const { scanProduct, seedProducto } = useScanProduct();
  const agregarReposicion = useAgregarReposicionItem();
  const actualizarCantidad = useActualizarCantidadReposicion();
  const eliminarItem = useEliminarReposicionItemDirecto();
  const agregarVencimiento = useAgregarVencimientoItem();
  const { haptic } = useHaptics();
  const registrarUso = useRecentsStore((s) => s.registrarUso);
  const queryClient = useQueryClient();

  // Precargar marcas/categorías al abrir la cámara: si el código escaneado
  // no está en el catálogo, el ManualProductSheet abre con el autocompletado
  // ya listo en vez de esperar el round-trip.
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: MARCAS_CATEGORIAS_KEY,
      queryFn: fetchMarcasCategorias,
      staleTime: 5 * 60_000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runEffect = useCallback(
    (effect: ScanFlowEffect) => {
      if (!effect) return;
      switch (effect.kind) {
        case "lookup": {
          scanProduct(effect.ean).then((result) => {
            if (result.success && result.producto) {
              dispatch({ type: "FOUND", ean: effect.ean, producto: result.producto });
            } else {
              dispatch({ type: "NOT_FOUND", ean: effect.ean });
            }
          });
          return;
        }
        case "autoAdd": {
          agregarReposicion
            .mutateAsync({ varianteId: effect.producto.variante.id, cantidad: 1 })
            .then((item) => {
              haptic(30);
              registrarUso({
                varianteId: effect.producto.variante.id,
                nombre: effect.producto.variante.nombreCompleto,
                marca: effect.producto.base.marca,
                tamano: effect.producto.variante.tamano,
              });
              dispatch({ type: "ADDED", item, producto: effect.producto, ean: effect.ean });
            })
            .catch(() => {
              toast.error("No se pudo agregar el producto");
              dispatch({ type: "ADD_FAILED" });
            });
          return;
        }
        case "updateCantidad":
          actualizarCantidad.mutate({ id: effect.itemId, cantidad: effect.cantidad });
          return;
        case "restoreCantidad":
          actualizarCantidad.mutate({ id: effect.itemId, cantidad: effect.cantidad });
          return;
        case "deleteItem":
          eliminarItem.mutate(effect.itemId);
          return;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scanProduct, agregarReposicion, actualizarCantidad, eliminarItem, haptic, registrarUso]
  );

  const dispatch = useCallback(
    (event: ScanFlowEvent) => {
      const { state: next, effect } = scanFlowReduce(stateRef.current, event, {
        scanMode,
        now: () => Date.now(),
      });
      stateRef.current = next;
      setState(next);
      if (effect) runEffect(effect);
    },
    [scanMode, runEffect]
  );

  // Timer de auto-descarte de la card de ajuste, re-armado en cada interacción
  useEffect(() => {
    if (state.mode !== "adjusting") return;
    const delay = Math.max(0, state.card.deadline - Date.now());
    const timer = setTimeout(() => dispatch({ type: "TIMEOUT" }), delay);
    return () => clearTimeout(timer);
  }, [state, dispatch]);

  const handleScan = useCallback((ean: string) => dispatch({ type: "SCAN", ean }), [dispatch]);

  const handleVencimientoSubmit = async (v: {
    fecha: Date;
    cantidad?: number;
    lote?: string;
  }) => {
    if (state.mode !== "dating") return;
    try {
      await agregarVencimiento.mutateAsync({
        varianteId: state.producto.variante.id,
        fechaVencimiento: v.fecha,
        cantidad: v.cantidad,
        lote: v.lote,
      });
      toast.success(`${state.producto.variante.nombreCompleto} agregado`, { duration: 1500 });
      registrarUso({
        varianteId: state.producto.variante.id,
        nombre: state.producto.variante.nombreCompleto,
        marca: state.producto.base.marca,
        tamano: state.producto.variante.tamano,
      });
      dispatch({ type: "SHEET_DONE" });
    } catch {
      toast.error("No se pudo registrar el vencimiento");
    }
  };

  const handleProductoCreado = (producto: ProductoEscaneado) => {
    if (state.mode !== "unknown") return;
    seedProducto(state.ean, producto);
    dispatch({ type: "CREATED", producto });
  };

  const paused = state.mode === "dating" || state.mode === "unknown";

  return (
    <>
      <BarcodeScanner
        isOpen
        paused={paused}
        modeLabel={MODE_LABEL[scanMode]}
        onScan={handleScan}
        onClose={onClose}
        onSearchInstead={onRequestSearch}
        overlay={
          state.mode === "adjusting" ? (
            <QuickAdjustCard
              nombre={state.card.nombre}
              tamano={state.card.tamano}
              cantidad={state.card.cantidad}
              deadline={state.card.deadline}
              onIncrement={() => dispatch({ type: "SET_QTY", cantidad: state.card.cantidad + 1 })}
              onDecrement={() => dispatch({ type: "SET_QTY", cantidad: state.card.cantidad - 1 })}
              onSetCantidad={(n) => dispatch({ type: "SET_QTY", cantidad: n })}
              onUndo={() => dispatch({ type: "UNDO" })}
            />
          ) : undefined
        }
      />

      <ExpiryQuickSheet
        isOpen={state.mode === "dating"}
        producto={
          state.mode === "dating"
            ? {
                nombre: state.producto.variante.nombreCompleto,
                tamano: state.producto.variante.tamano,
              }
            : null
        }
        onSubmit={handleVencimientoSubmit}
        onClose={() => dispatch({ type: "SHEET_CANCEL" })}
        isPending={agregarVencimiento.isPending}
      />

      {state.mode === "unknown" && (
        <ManualProductSheet
          ean={state.ean}
          isOpen
          onCreated={handleProductoCreado}
          onClose={() => dispatch({ type: "SHEET_CANCEL" })}
        />
      )}
    </>
  );
}
