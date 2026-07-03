"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export interface ProductoEscaneado {
  base: { id: string; nombre: string; marca?: string; categoria?: string };
  variante: { id: string; nombreCompleto: string; tamano?: string };
}

/** Diez minutos: suficiente para que re-escanear el mismo producto en la
 * sesión actual (encadenando varios ítems) no pague otro round-trip. */
const EAN_STALE_TIME = 10 * 60_000;

export function eanQueryKey(ean: string) {
  return ["producto", "ean", ean] as const;
}

async function fetchPorEan(
  ean: string
): Promise<{ success: boolean; producto?: ProductoEscaneado; error?: string }> {
  const response = await fetch(`/api/productos/buscar?ean=${encodeURIComponent(ean)}`);
  const data = await response.json();

  if (!data.success || !data.producto) {
    return {
      success: false,
      error: data.message || `Producto con código ${ean} no encontrado.`,
    };
  }
  return { success: true, producto: data.producto };
}

export function useScanProduct() {
  const queryClient = useQueryClient();

  const scanProduct = useCallback(
    async (
      barcode: string
    ): Promise<{ success: boolean; producto?: ProductoEscaneado; error?: string }> => {
      try {
        // Cachea por EAN: sólo "no encontrado" no se cachea, para no
        // bloquear el alta manual del mismo código en la misma sesión.
        const cached = queryClient.getQueryData<ProductoEscaneado>(eanQueryKey(barcode));
        if (cached) return { success: true, producto: cached };

        const result = await fetchPorEan(barcode);
        if (result.success && result.producto) {
          queryClient.setQueryData(eanQueryKey(barcode), result.producto, {
            updatedAt: Date.now(),
          });
          queryClient.setQueryDefaults(eanQueryKey(barcode), {
            staleTime: EAN_STALE_TIME,
          });
        }
        return result;
      } catch {
        return { success: false, error: "Error al buscar producto" };
      }
    },
    [queryClient]
  );

  /** Sembrar el cache tras un alta manual, para que el próximo escaneo del
   * mismo EAN en la sesión no dispare otra consulta. */
  const seedProducto = useCallback(
    (ean: string, producto: ProductoEscaneado) => {
      queryClient.setQueryData(eanQueryKey(ean), producto);
    },
    [queryClient]
  );

  return { scanProduct, seedProducto };
}
