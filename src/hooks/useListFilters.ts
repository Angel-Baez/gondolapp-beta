"use client";

import { ActiveView, useUiStore } from "@/store/ui";
import { useMemo } from "react";

export interface OpcionOrden {
  value: string;
  label: string;
}

/**
 * Búsqueda por texto + orden, aplicados client-side sobre listas ya cargadas
 * (chicas por diseño). El estado vive en el store de UI por vista, así
 * cambiar de tab no pierde lo tipeado.
 */
export function useListFilters(view: ActiveView, ordenInicial: string) {
  const filtros = useUiStore((s) => s.filters[view]);
  const setFilter = useUiStore((s) => s.setFilter);

  const busqueda = filtros.busqueda;
  const orden = filtros.orden || ordenInicial;

  const coincide = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return (nombre: string, marca?: string) =>
      termino === "" ||
      nombre.toLowerCase().includes(termino) ||
      (marca ?? "").toLowerCase().includes(termino);
  }, [busqueda]);

  return {
    busqueda,
    setBusqueda: (v: string) => setFilter(view, { busqueda: v }),
    orden,
    setOrden: (v: string) => setFilter(view, { orden: v }),
    coincide,
  };
}
