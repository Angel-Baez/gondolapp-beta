"use client";

import { useCallback, useState } from "react";

export interface ProductoEscaneado {
  base: { id: string; nombre: string; marca?: string; categoria?: string };
  variante: { id: string; nombreCompleto: string; tamano?: string };
}

export function useScanProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanProduct = useCallback(
    async (
      barcode: string
    ): Promise<{ success: boolean; producto?: ProductoEscaneado; error?: string }> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/productos/buscar?ean=${encodeURIComponent(barcode)}`);
        const data = await response.json();

        if (!data.success || !data.producto) {
          const errorMsg = data.message || `Producto con código ${barcode} no encontrado.`;
          setError(errorMsg);
          setLoading(false);
          return { success: false, error: errorMsg };
        }

        setLoading(false);
        return { success: true, producto: data.producto };
      } catch {
        const errorMsg = "Error al buscar producto";
        setError(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return { scanProduct, loading, error, clearError };
}
