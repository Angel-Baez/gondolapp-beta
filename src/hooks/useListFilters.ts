"use client";

import { useMemo, useState } from "react";

export interface OpcionOrden {
  value: string;
  label: string;
}

/** Búsqueda por texto + orden, aplicados client-side sobre listas ya cargadas (chicas por diseño). */
export function useListFilters(ordenInicial: string) {
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState(ordenInicial);

  const coincide = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return (nombre: string, marca?: string) =>
      termino === "" ||
      nombre.toLowerCase().includes(termino) ||
      (marca ?? "").toLowerCase().includes(termino);
  }, [busqueda]);

  return { busqueda, setBusqueda, orden, setOrden, coincide };
}
