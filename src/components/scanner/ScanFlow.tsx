"use client";

import { CATALOGO_COMPLETO_KEY } from "@/hooks/useCatalogoCompleto";
import { useHaptics } from "@/hooks/useHaptics";
import { ProductoEscaneado, useScanProduct } from "@/hooks/useScanProduct";
import {
  useActualizarCantidadReposicion,
  useAgregarReposicionItem,
  useEliminarReposicionItemDirecto,
} from "@/hooks/useReposicion";
import { useAgregarVencimientoItem } from "@/hooks/useVencimiento";
import { obtenerCatalogoCompleto } from "@/services/catalogo";
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
  // Última fecha registrada en la sesión de escaneo: habilita el chip
  // "Misma fecha" del sheet para registrar lotes con 1 tap por producto.
  const [ultimaFecha, setUltimaFecha] = useState<Date | null>(null);
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

  // Precargar el catálogo completo al abrir la cámara: si el código
  // escaneado no está, el ManualProductSheet abre con el autocompletado
  // ya listo, y el lookup de EAN tiene un fallback local si falla la red.
  // Redundante con CatalogoSyncProvider (que ya lo hace al montar la app),
  // pero cubre el caso de abrir el escáner offline y recuperar señal recién
  // acá — React Query dedupe si ambos disparan casi simultáneo.
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: CATALOGO_COMPLETO_KEY,
      queryFn: obtenerCatalogoCompleto,
      staleTime: 30 * 60_000,
    });
  }, []);

  const runEffect = useCallback(
    (effect: ScanFlowEffect) => {
      if (!effect) return;
      switch (effect.kind) {
        case "lookup": {
          scanProduct(effect.ean).then((result) => {
            if (result.status === "found") {
              dispatch({ type: "FOUND", ean: effect.ean, producto: result.producto });
            } else if (result.status === "not_found") {
              dispatch({ type: "NOT_FOUND", ean: effect.ean });
            } else {
              // Fallo de red: volver a scanning para reintentar, sin abrir
              // el alta manual de un producto que sí puede existir.
              toast.error("No se pudo buscar el producto. Revisá tu conexión.", {
                duration: 2000,
              });
              dispatch({ type: "LOOKUP_FAILED", ean: effect.ean });
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
      setUltimaFecha(v.fecha);
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
    // La creación requiere red, así que el catálogo local quedó un producto
    // atrás: invalidar dispara un refetch inmediato en vez de esperar el
    // próximo sync. Más simple que mergear a mano (acá solo tenemos el
    // ProductoEscaneado reducido, no el ProductoCompleto completo).
    queryClient.invalidateQueries({ queryKey: CATALOGO_COMPLETO_KEY });
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
            ? { nombre: state.producto.variante.nombreCompleto }
            : null
        }
        ultimaFecha={ultimaFecha}
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
