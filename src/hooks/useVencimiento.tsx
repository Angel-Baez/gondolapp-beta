"use client";

import * as vencimientoService from "@/services/vencimiento";
import { ItemVencimientoConAlerta } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const ITEMS_KEY = ["vencimiento", "items"] as const;
const HISTORIAL_KEY = ["vencimiento", "historial"] as const;
const ESTADISTICAS_KEY = ["vencimiento", "estadisticas"] as const;

export function useVencimientoItems() {
  return useQuery({ queryKey: ITEMS_KEY, queryFn: vencimientoService.listarItems });
}

export function useAgregarVencimientoItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      varianteId,
      fechaVencimiento,
      cantidad,
      lote,
    }: {
      varianteId: string;
      fechaVencimiento: Date;
      cantidad?: number;
      lote?: string;
    }) => vencimientoService.agregarItem(varianteId, fechaVencimiento, cantidad, lote),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useActualizarFechaVencimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fechaVencimiento }: { id: string; fechaVencimiento: Date }) =>
      vencimientoService.actualizarFecha(id, fechaVencimiento),
    onMutate: async ({ id, fechaVencimiento }) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = queryClient.getQueryData<ItemVencimientoConAlerta[]>(ITEMS_KEY);
      queryClient.setQueryData<ItemVencimientoConAlerta[]>(ITEMS_KEY, (items) =>
        (items ?? []).map((item) => (item.id === id ? { ...item, fechaVencimiento } : item))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(ITEMS_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useActualizarCantidadVencimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cantidad }: { id: string; cantidad: number }) =>
      vencimientoService.actualizarCantidad(id, cantidad),
    onMutate: async ({ id, cantidad }) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = queryClient.getQueryData<ItemVencimientoConAlerta[]>(ITEMS_KEY);
      queryClient.setQueryData<ItemVencimientoConAlerta[]>(ITEMS_KEY, (items) =>
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

export function useEliminarVencimientoItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vencimientoService.eliminarItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = queryClient.getQueryData<ItemVencimientoConAlerta[]>(ITEMS_KEY);
      queryClient.setQueryData<ItemVencimientoConAlerta[]>(ITEMS_KEY, (items) =>
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

/** Retira el item de la góndola: lo archiva en el historial y lo saca de la lista activa. */
export function useRetirarVencimientoItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vencimientoService.retirarItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = queryClient.getQueryData<ItemVencimientoConAlerta[]>(ITEMS_KEY);
      queryClient.setQueryData<ItemVencimientoConAlerta[]>(ITEMS_KEY, (items) =>
        (items ?? []).filter((item) => item.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(ITEMS_KEY, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
      queryClient.invalidateQueries({ queryKey: HISTORIAL_KEY });
      queryClient.invalidateQueries({ queryKey: ESTADISTICAS_KEY });
    },
  });
}

export function useHistorialVencimiento(filtros?: {
  desde?: Date;
  hasta?: Date;
  limite?: number;
}) {
  return useQuery({
    queryKey: [...HISTORIAL_KEY, filtros],
    queryFn: () => vencimientoService.obtenerHistorial(filtros),
  });
}

export function useEstadisticasVencimiento(periodo: "semana" | "mes" | "año") {
  return useQuery({
    queryKey: [...ESTADISTICAS_KEY, periodo],
    queryFn: () => vencimientoService.obtenerEstadisticas(periodo),
  });
}
