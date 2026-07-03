"use client";

import { useQuery } from "@tanstack/react-query";

export interface MarcasCategorias {
  marcas: string[];
  categorias: string[];
}

export const MARCAS_CATEGORIAS_KEY = ["catalogo", "marcas-categorias"] as const;

export async function fetchMarcasCategorias(): Promise<MarcasCategorias> {
  const res = await fetch("/api/productos/crear-manual");
  const data = await res.json();
  return { marcas: data.marcas ?? [], categorias: data.categorias ?? [] };
}

/** Marcas/categorías existentes, para el autocompletado del alta manual. */
export function useMarcasCategorias(enabled: boolean) {
  return useQuery({
    queryKey: MARCAS_CATEGORIAS_KEY,
    queryFn: fetchMarcasCategorias,
    enabled,
    staleTime: 5 * 60_000,
  });
}
