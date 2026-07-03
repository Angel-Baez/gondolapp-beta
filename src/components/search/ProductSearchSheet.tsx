"use client";

import { ExpiryQuickSheet } from "@/components/scanner/ExpiryQuickSheet";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useBuscarVariantes } from "@/hooks/useBuscarVariantes";
import {
  useActualizarCantidadReposicion,
  useAgregarReposicionItem,
  useEliminarReposicionItemDirecto,
} from "@/hooks/useReposicion";
import { useAgregarVencimientoItem } from "@/hooks/useVencimiento";
import { RecentEntry, useRecentsStore } from "@/store/recents";
import { ProductoCompleto } from "@/services/catalogo";
import { ScanMode } from "@/types";
import { Search } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ProductResultRow } from "./ProductResultRow";
import { RecentsRow } from "./RecentsRow";

export interface ProductSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ScanMode;
}

interface SearchItem {
  varianteId: string;
  nombre: string;
  marca?: string;
  tamano?: string;
}

interface AddedInfo {
  itemId: string;
  cantidad: number;
  prevCantidad: number;
}

const ADD_REVERT_MS = 3000;

function aSearchItem(producto: ProductoCompleto): SearchItem {
  return {
    varianteId: producto.variante.id,
    nombre: producto.variante.nombreCompleto,
    marca: producto.base.marca,
    tamano: producto.variante.tamano,
  };
}

/**
 * Buscar productos por nombre/marca sin cámara, con recientes/frecuentes
 * para agregar en 1 tap. En modo vencimiento, seleccionar un producto abre
 * el mismo ExpiryQuickSheet que usa el flujo de escaneo.
 */
export function ProductSearchSheet({ isOpen, onClose, mode }: ProductSearchSheetProps) {
  const [termino, setTermino] = useState("");
  const [addedMap, setAddedMap] = useState<Record<string, AddedInfo>>({});
  const [pendingVencimiento, setPendingVencimiento] = useState<SearchItem | null>(null);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const { data: resultados = [], isFetching } = useBuscarVariantes(termino);
  const agregarReposicion = useAgregarReposicionItem();
  const actualizarCantidad = useActualizarCantidadReposicion();
  const eliminarItem = useEliminarReposicionItemDirecto();
  const agregarVencimiento = useAgregarVencimientoItem();
  const registrarUso = useRecentsStore((s) => s.registrarUso);

  const items = useMemo(() => resultados.map(aSearchItem), [resultados]);

  const rearmTimer = useCallback((varianteId: string) => {
    clearTimeout(timersRef.current[varianteId]);
    timersRef.current[varianteId] = setTimeout(() => {
      setAddedMap((prev) => {
        const { [varianteId]: _quitado, ...resto } = prev;
        return resto;
      });
    }, ADD_REVERT_MS);
  }, []);

  const handleClose = () => {
    setTermino("");
    onClose();
  };

  const handleAddReposicion = async (item: SearchItem) => {
    try {
      const res = await agregarReposicion.mutateAsync({
        varianteId: item.varianteId,
        cantidad: 1,
      });
      registrarUso(item);
      setAddedMap((prev) => ({
        ...prev,
        [item.varianteId]: {
          itemId: res.id,
          cantidad: res.cantidad,
          prevCantidad: Math.max(0, res.cantidad - 1),
        },
      }));
      rearmTimer(item.varianteId);
    } catch {
      toast.error("No se pudo agregar el producto");
    }
  };

  const handleAdjust = (item: SearchItem, cantidad: number) => {
    const current = addedMap[item.varianteId];
    if (!current) return;
    const nueva = Math.max(1, cantidad);
    actualizarCantidad.mutate({ id: current.itemId, cantidad: nueva });
    setAddedMap((prev) => ({ ...prev, [item.varianteId]: { ...current, cantidad: nueva } }));
    rearmTimer(item.varianteId);
  };

  const handleUndo = (item: SearchItem) => {
    const current = addedMap[item.varianteId];
    if (!current) return;
    clearTimeout(timersRef.current[item.varianteId]);
    if (current.prevCantidad > 0) {
      actualizarCantidad.mutate({ id: current.itemId, cantidad: current.prevCantidad });
    } else {
      eliminarItem.mutate(current.itemId);
    }
    setAddedMap((prev) => {
      const { [item.varianteId]: _quitado, ...resto } = prev;
      return resto;
    });
  };

  const handleSelect = (item: SearchItem) => {
    if (mode === "vencimiento") {
      setPendingVencimiento(item);
      handleClose();
      return;
    }
    handleAddReposicion(item);
  };

  const handleVencimientoSubmit = async (v: {
    fecha: Date;
    cantidad?: number;
    lote?: string;
  }) => {
    if (!pendingVencimiento) return;
    try {
      await agregarVencimiento.mutateAsync({
        varianteId: pendingVencimiento.varianteId,
        fechaVencimiento: v.fecha,
        cantidad: v.cantidad,
        lote: v.lote,
      });
      toast.success(`${pendingVencimiento.nombre} agregado`, { duration: 1500 });
      registrarUso(pendingVencimiento);
      setPendingVencimiento(null);
    } catch {
      toast.error("No se pudo registrar el vencimiento");
    }
  };

  const mostrarVacio =
    termino.trim().length >= 2 && !isFetching && resultados.length === 0;

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={handleClose} title="Buscar producto">
        <div className="space-y-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-tertiary"
            />
            <input
              type="text"
              value={termino}
              onChange={(e) => setTermino(e.target.value)}
              placeholder="Nombre o marca del producto"
              autoFocus
              className="w-full h-12 pl-10 pr-4 rounded-field bg-surface-2 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          <RecentsRow onSelect={(entry: RecentEntry) => handleSelect(entry)} />

          {termino.trim().length < 2 ? (
            <p className="text-footnote text-fg-tertiary text-center py-4">
              Escribí al menos 2 letras para buscar
            </p>
          ) : mostrarVacio ? (
            <p className="text-footnote text-fg-tertiary text-center py-8">
              No se encontraron productos que coincidan
            </p>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <ProductResultRow
                  key={item.varianteId}
                  producto={item}
                  addedState={addedMap[item.varianteId] ?? null}
                  onAdd={() => handleSelect(item)}
                  onIncrement={() =>
                    handleAdjust(item, (addedMap[item.varianteId]?.cantidad ?? 1) + 1)
                  }
                  onDecrement={() =>
                    handleAdjust(item, (addedMap[item.varianteId]?.cantidad ?? 1) - 1)
                  }
                  onUndo={() => handleUndo(item)}
                />
              ))}
            </div>
          )}
        </div>
      </BottomSheet>

      <ExpiryQuickSheet
        isOpen={pendingVencimiento !== null}
        producto={pendingVencimiento ? { nombre: pendingVencimiento.nombre } : null}
        onSubmit={handleVencimientoSubmit}
        onClose={() => setPendingVencimiento(null)}
        isPending={agregarVencimiento.isPending}
      />
    </>
  );
}
