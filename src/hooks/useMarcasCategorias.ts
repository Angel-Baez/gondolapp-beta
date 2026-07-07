"use client";

import { obtenerMarcasYCategoriasLocal } from "@/lib/catalogoLocal";
import { CategoriaAtributo } from "@/types";
import { useMemo } from "react";
import { useCatalogoCompleto } from "./useCatalogoCompleto";

export interface MarcasCategorias {
  marcas: string[];
  categorias: string[];
  atributosDefault: CategoriaAtributo[];
  atributosPorCategoria: Record<string, CategoriaAtributo[]>;
}

/**
 * Marcas/categorías/atributos existentes, para el autocompletado del alta
 * manual. Deriva del catálogo completo ya cacheado (useCatalogoCompleto):
 * sin round-trip propio, funciona offline.
 */
export function useMarcasCategorias(enabled: boolean) {
  const { data: catalogo, isLoading } = useCatalogoCompleto();

  const data = useMemo<MarcasCategorias | undefined>(() => {
    if (!enabled || !catalogo) return undefined;
    const { marcas, categorias } = obtenerMarcasYCategoriasLocal(catalogo);
    return {
      marcas,
      categorias,
      atributosDefault: catalogo.definiciones.default,
      atributosPorCategoria: catalogo.definiciones.porCategoria,
    };
  }, [catalogo, enabled]);

  return { data, isLoading: enabled && isLoading };
}
