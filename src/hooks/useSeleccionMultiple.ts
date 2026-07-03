"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Estado de modo selección múltiple, reusable por cualquier lista con ids
 * de string (reposición, vencimiento). El modo se activa/desactiva
 * explícitamente (no long-press) para no chocar con gestos de swipe.
 */
export function useSeleccionMultiple() {
  const [activo, setActivo] = useState(false);
  const [seleccionadosSet, setSeleccionadosSet] = useState<Set<string>>(new Set());

  const activar = useCallback(() => setActivo(true), []);

  const cancelar = useCallback(() => {
    setActivo(false);
    setSeleccionadosSet(new Set());
  }, []);

  const toggle = useCallback((id: string) => {
    setSeleccionadosSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const seleccionarTodos = useCallback((ids: string[]) => {
    setSeleccionadosSet(new Set(ids));
  }, []);

  const limpiarSeleccion = useCallback(() => setSeleccionadosSet(new Set()), []);

  const estaSeleccionado = useCallback(
    (id: string) => seleccionadosSet.has(id),
    [seleccionadosSet]
  );

  const seleccionados = useMemo(() => Array.from(seleccionadosSet), [seleccionadosSet]);

  return {
    activo,
    seleccionados,
    cantidad: seleccionadosSet.size,
    activar,
    cancelar,
    toggle,
    seleccionarTodos,
    limpiarSeleccion,
    estaSeleccionado,
  };
}
