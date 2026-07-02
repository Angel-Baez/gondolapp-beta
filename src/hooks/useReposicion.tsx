"use client";

import * as reposicionService from "@/services/reposicion";
import { EstadoReposicion, ItemReposicion } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import toast from "react-hot-toast";

const ITEMS_KEY = ["reposicion", "items"] as const;
const HISTORIAL_KEY = ["reposicion", "historial"] as const;
const ESTADISTICAS_KEY = ["reposicion", "estadisticas"] as const;

export function useReposicionItems() {
  return useQuery({ queryKey: ITEMS_KEY, queryFn: reposicionService.listarItems });
}

export function useAgregarReposicionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ varianteId, cantidad }: { varianteId: string; cantidad: number }) =>
      reposicionService.agregarItem(varianteId, cantidad),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useActualizarCantidadReposicion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cantidad }: { id: string; cantidad: number }) =>
      reposicionService.actualizarCantidad(id, cantidad),
    onMutate: async ({ id, cantidad }) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = queryClient.getQueryData<ItemReposicion[]>(ITEMS_KEY);
      queryClient.setQueryData<ItemReposicion[]>(ITEMS_KEY, (items) =>
        (items ?? []).map((item) => (item.id === id ? { ...item, cantidad } : item))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(ITEMS_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useCambiarEstadoReposicion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoReposicion }) =>
      reposicionService.cambiarEstado(id, estado),
    onMutate: async ({ id, estado }) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = queryClient.getQueryData<ItemReposicion[]>(ITEMS_KEY);
      queryClient.setQueryData<ItemReposicion[]>(ITEMS_KEY, (items) =>
        (items ?? []).map((item) => (item.id === id ? { ...item, estado } : item))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(ITEMS_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

function useEliminarReposicionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reposicionService.eliminarItem(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

/**
 * Decrementa la cantidad de un item. Si llega a 0, lo saca de la lista al
 * toque (optimista) y muestra un toast con "Deshacer" por 4s antes de
 * confirmar el borrado contra la base — así el botón "-" puede llegar a
 * cero sin que un toque de más borre algo sin aviso.
 */
export function useDecrementarReposicion() {
  const queryClient = useQueryClient();
  const actualizarCantidad = useActualizarCantidadReposicion();
  const eliminarItem = useEliminarReposicionItem();

  return useCallback(
    (item: Pick<ItemReposicion, "id" | "cantidad">) => {
      if (item.cantidad > 1) {
        actualizarCantidad.mutate({ id: item.id, cantidad: item.cantidad - 1 });
        return;
      }

      const previous = queryClient.getQueryData<ItemReposicion[]>(ITEMS_KEY);
      queryClient.setQueryData<ItemReposicion[]>(ITEMS_KEY, (items) =>
        (items ?? []).filter((i) => i.id !== item.id)
      );

      let deshecho = false;
      const timeoutId = setTimeout(() => {
        if (!deshecho) eliminarItem.mutate(item.id);
      }, 4000);

      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span>Producto eliminado</span>
            <button
              onClick={() => {
                deshecho = true;
                clearTimeout(timeoutId);
                queryClient.setQueryData(ITEMS_KEY, previous);
                toast.dismiss(t.id);
              }}
              className="font-bold underline underline-offset-2"
            >
              Deshacer
            </button>
          </div>
        ),
        { duration: 4000 }
      );
    },
    [queryClient, actualizarCantidad, eliminarItem]
  );
}

/** Borrado directo (sin pasar por el flujo de deshacer), para el ícono de basura. */
export function useEliminarReposicionItemDirecto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reposicionService.eliminarItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = queryClient.getQueryData<ItemReposicion[]>(ITEMS_KEY);
      queryClient.setQueryData<ItemReposicion[]>(ITEMS_KEY, (items) =>
        (items ?? []).filter((item) => item.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(ITEMS_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useGuardarListaReposicion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reposicionService.guardarListaActual(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
      queryClient.invalidateQueries({ queryKey: HISTORIAL_KEY });
      queryClient.invalidateQueries({ queryKey: ESTADISTICAS_KEY });
    },
  });
}

export function useHistorialReposicion(filtros?: {
  desde?: Date;
  hasta?: Date;
  limite?: number;
}) {
  return useQuery({
    queryKey: [...HISTORIAL_KEY, filtros],
    queryFn: () => reposicionService.obtenerHistorial(filtros),
  });
}

export function useEliminarListaHistorial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reposicionService.eliminarListaHistorial(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HISTORIAL_KEY }),
  });
}

export function useEstadisticasReposicion(periodo: "semana" | "mes" | "año") {
  return useQuery({
    queryKey: [...ESTADISTICAS_KEY, periodo],
    queryFn: () => reposicionService.obtenerEstadisticas(periodo),
  });
}
