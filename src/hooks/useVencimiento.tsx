"use client";

import { useAuth } from "@/components/AuthProvider";
import { enqueueOperation, isNetworkError, isOnline } from "@/lib/outbox/outbox";
import { ejecutarMasivoOEncolar, ejecutarOEncolar } from "@/lib/outbox/mutationHelpers";
import { crearTempId } from "@/lib/outbox/types";
import {
  SIN_TIENDA,
  vencimientoEstadisticasKey,
  vencimientoHistorialKey,
  vencimientoItemsKey,
} from "@/lib/queryKeys";
import { calcularNivelAlerta, toDateInputValue } from "@/lib/utils";
import * as vencimientoService from "@/services/vencimiento";
import { ItemVencimientoConAlerta } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Keys y tienda activa compartidas por todos los hooks del módulo. */
function useVencimientoScope() {
  const { tiendaActiva } = useAuth();
  const tiendaId = tiendaActiva ?? SIN_TIENDA;
  return {
    tiendaActiva,
    ITEMS_KEY: vencimientoItemsKey(tiendaId),
    HISTORIAL_KEY: vencimientoHistorialKey(tiendaId),
    ESTADISTICAS_KEY: vencimientoEstadisticasKey(tiendaId),
  };
}

export function useVencimientoItems() {
  const { tiendaActiva, ITEMS_KEY } = useVencimientoScope();
  return useQuery({
    queryKey: ITEMS_KEY,
    queryFn: () => vencimientoService.listarItems(tiendaActiva!),
    enabled: !!tiendaActiva,
    // Re-deriva el nivel de alerta al leer: los datos pueden venir del
    // cache persistido (arranque offline) o de una app abierta toda la
    // noche, con un alertaNivel calculado días atrás.
    select: (items) =>
      items.map((item) => ({
        ...item,
        alertaNivel: calcularNivelAlerta(item.fechaVencimiento),
      })),
  });
}

export function useAgregarVencimientoItem() {
  const queryClient = useQueryClient();
  const { ITEMS_KEY } = useVencimientoScope();
  return useMutation({
    networkMode: "always",
    mutationFn: async ({
      varianteId,
      fechaVencimiento,
      cantidad,
      lote,
    }: {
      varianteId: string;
      fechaVencimiento: Date;
      cantidad?: number;
      lote?: string;
    }): Promise<ItemVencimientoConAlerta> => {
      if (isOnline()) {
        try {
          return await vencimientoService.agregarItem(
            varianteId,
            fechaVencimiento,
            cantidad,
            lote
          );
        } catch (err) {
          if (!isNetworkError(err)) throw err;
        }
      }

      const tempId = crearTempId();
      await enqueueOperation("vencimiento.agregarItem", {
        tempId,
        varianteId,
        // Serializar en horario local (no toISOString/UTC): la fecha es un
        // DATE sin hora y el executor la re-parsea a medianoche local.
        fechaVencimiento: toDateInputValue(fechaVencimiento),
        cantidad,
        lote,
      });
      return {
        id: tempId,
        varianteId,
        fechaVencimiento,
        cantidad,
        lote,
        estado: "pendiente",
        agregadoAt: new Date(),
        alertaNivel: calcularNivelAlerta(fechaVencimiento),
      };
    },
    onSuccess: (item) => {
      queryClient.setQueryData<ItemVencimientoConAlerta[]>(ITEMS_KEY, (items) => {
        const actuales = items ?? [];
        const yaEstaba = actuales.some((i) => i.id === item.id);
        return yaEstaba
          ? actuales.map((i) => (i.id === item.id ? item : i))
          : [item, ...actuales];
      });
    },
  });
}

export function useActualizarFechaVencimiento() {
  const queryClient = useQueryClient();
  const { ITEMS_KEY } = useVencimientoScope();
  return useMutation({
    networkMode: "always",
    mutationFn: ({ id, fechaVencimiento }: { id: string; fechaVencimiento: Date }) =>
      ejecutarOEncolar(
        id,
        () => vencimientoService.actualizarFecha(id, fechaVencimiento),
        () =>
          enqueueOperation("vencimiento.actualizarFecha", {
            id,
            fechaVencimiento: toDateInputValue(fechaVencimiento),
          }),
        null as ItemVencimientoConAlerta | null
      ),
    onMutate: async ({ id, fechaVencimiento }) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = queryClient.getQueryData<ItemVencimientoConAlerta[]>(ITEMS_KEY);
      queryClient.setQueryData<ItemVencimientoConAlerta[]>(ITEMS_KEY, (items) =>
        (items ?? []).map((item) =>
          item.id === id
            ? { ...item, fechaVencimiento, alertaNivel: calcularNivelAlerta(fechaVencimiento) }
            : item
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(ITEMS_KEY, context.previous);
    },
  });
}

export function useActualizarCantidadVencimiento() {
  const queryClient = useQueryClient();
  const { ITEMS_KEY } = useVencimientoScope();
  return useMutation({
    networkMode: "always",
    mutationFn: ({ id, cantidad }: { id: string; cantidad: number }) =>
      ejecutarOEncolar(
        id,
        () => vencimientoService.actualizarCantidad(id, cantidad),
        () => enqueueOperation("vencimiento.actualizarCantidad", { id, cantidad }),
        null as ItemVencimientoConAlerta | null
      ),
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
  });
}

export function useEliminarVencimientoItem() {
  const queryClient = useQueryClient();
  const { ITEMS_KEY } = useVencimientoScope();
  return useMutation({
    networkMode: "always",
    mutationFn: (id: string) =>
      ejecutarOEncolar(
        id,
        () => vencimientoService.eliminarItem(id),
        () => enqueueOperation("vencimiento.eliminarItem", { id }),
        undefined as void
      ),
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
  });
}

/** Retira el item de la góndola: lo archiva en el historial y lo saca de la lista activa. */
export function useRetirarVencimientoItem() {
  const queryClient = useQueryClient();
  const { ITEMS_KEY, HISTORIAL_KEY, ESTADISTICAS_KEY } = useVencimientoScope();
  return useMutation({
    networkMode: "always",
    mutationFn: (id: string) =>
      ejecutarOEncolar(
        id,
        () => vencimientoService.retirarItem(id),
        () => enqueueOperation("vencimiento.retirarItem", { id }),
        undefined as void
      ),
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

/** Retira varios items a la vez (acción masiva del modo selección). */
export function useRetirarItemsMasivo() {
  const queryClient = useQueryClient();
  const { ITEMS_KEY, HISTORIAL_KEY, ESTADISTICAS_KEY } = useVencimientoScope();
  return useMutation({
    networkMode: "always",
    mutationFn: (ids: string[]) =>
      ejecutarMasivoOEncolar(
        ids,
        (idsReales) => vencimientoService.retirarItemsMasivo(idsReales),
        (id) => enqueueOperation("vencimiento.retirarItem", { id })
      ),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = queryClient.getQueryData<ItemVencimientoConAlerta[]>(ITEMS_KEY);
      const idSet = new Set(ids);
      queryClient.setQueryData<ItemVencimientoConAlerta[]>(ITEMS_KEY, (items) =>
        (items ?? []).filter((item) => !idSet.has(item.id))
      );
      return { previous };
    },
    onError: (_err, _ids, context) => {
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
  const { tiendaActiva, HISTORIAL_KEY } = useVencimientoScope();
  return useQuery({
    queryKey: [...HISTORIAL_KEY, filtros],
    queryFn: () => vencimientoService.obtenerHistorial(tiendaActiva!, filtros),
    enabled: !!tiendaActiva,
  });
}

export function useEstadisticasVencimiento(periodo: "semana" | "mes" | "año") {
  const { tiendaActiva, ESTADISTICAS_KEY } = useVencimientoScope();
  return useQuery({
    queryKey: [...ESTADISTICAS_KEY, periodo],
    queryFn: () => vencimientoService.obtenerEstadisticas(tiendaActiva!, periodo),
    enabled: !!tiendaActiva,
  });
}
