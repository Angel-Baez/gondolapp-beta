"use client";

import { CATALOGO_COMPLETO_KEY } from "@/hooks/useCatalogoCompleto";
import { buscarPorCodigoBarrasLocal } from "@/lib/catalogoLocal";
import { buscarPorCodigoBarras, CatalogoCompleto, ProductoCompleto } from "@/services/catalogo";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export interface ProductoEscaneado {
  base: { id: string; nombre: string; marca?: string; categoria?: string };
  variante: { id: string; nombreCompleto: string; tamano?: string };
}

function aProductoEscaneado(resultado: ProductoCompleto): ProductoEscaneado {
  return {
    base: {
      id: resultado.base.id,
      nombre: resultado.base.nombre,
      marca: resultado.base.marca,
      categoria: resultado.base.categoria,
    },
    variante: {
      id: resultado.variante.id,
      nombreCompleto: resultado.variante.nombreCompleto,
      tamano: resultado.variante.atributos["tamano"],
    },
  };
}

/**
 * Resultado del lookup con tres estados: "error" (red caída, timeout) es
 * distinto de "not_found" — un fallo de red NO debe abrir el alta manual
 * para un producto que sí existe en el catálogo.
 */
export type ScanLookupResult =
  | { status: "found"; producto: ProductoEscaneado }
  | { status: "not_found" }
  | { status: "error" };

/** Diez minutos: suficiente para que re-escanear el mismo producto en la
 * sesión actual (encadenando varios ítems) no pague otro round-trip. */
const EAN_STALE_TIME = 10 * 60_000;

export function eanQueryKey(ean: string) {
  return ["producto", "ean", ean] as const;
}

export function useScanProduct() {
  const queryClient = useQueryClient();

  const scanProduct = useCallback(
    async (barcode: string): Promise<ScanLookupResult> => {
      // Cachea por EAN: sólo "no encontrado" no se cachea, para no
      // bloquear el alta manual del mismo código en la misma sesión.
      const cached = queryClient.getQueryData<ProductoEscaneado>(eanQueryKey(barcode));
      if (cached) return { status: "found", producto: cached };

      try {
        // Directo a Supabase: antes pasaba por /api/productos/buscar
        // (función de Vercel), un hop extra de latencia en el camino
        // crítico del escaneo que además convertía cualquier caída de
        // red en un falso "no encontrado".
        const resultado = await buscarPorCodigoBarras(barcode);
        if (!resultado) return { status: "not_found" };

        const producto = aProductoEscaneado(resultado);
        queryClient.setQueryData(eanQueryKey(barcode), producto, {
          updatedAt: Date.now(),
        });
        queryClient.setQueryDefaults(eanQueryKey(barcode), {
          staleTime: EAN_STALE_TIME,
        });
        return { status: "found", producto };
      } catch {
        // Red caída (o cualquier error real: maybeSingle() ya devuelve null
        // para "no existe", nunca throwea por ausencia). Antes de rendirse,
        // probar el catálogo local ya sincronizado — prioriza exactitud
        // online (por eso este fallback vive en el catch, no reemplaza la
        // llamada de red) pero evita bloquear un escaneo offline de un
        // producto que sí está en el catálogo cacheado.
        const catalogo = queryClient.getQueryData<CatalogoCompleto>(CATALOGO_COMPLETO_KEY);
        if (catalogo) {
          const resultadoLocal = buscarPorCodigoBarrasLocal(catalogo, barcode);
          if (resultadoLocal) {
            const producto = aProductoEscaneado(resultadoLocal);
            queryClient.setQueryData(eanQueryKey(barcode), producto, {
              updatedAt: Date.now(),
            });
            queryClient.setQueryDefaults(eanQueryKey(barcode), {
              staleTime: EAN_STALE_TIME,
            });
            return { status: "found", producto };
          }
        }
        return { status: "error" };
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
