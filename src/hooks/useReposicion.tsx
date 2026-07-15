"use client";

import { useAuth } from "@/components/AuthProvider";
import { enqueueOperation, isNetworkError, isOnline } from "@/lib/outbox/outbox";
import { ejecutarMasivoOEncolar, ejecutarOEncolar } from "@/lib/outbox/mutationHelpers";
import { crearTempId } from "@/lib/outbox/types";
import {
  reposicionEstadisticasKey,
  reposicionHistorialKey,
  reposicionItemsKey,
  SIN_TIENDA,
} from "@/lib/queryKeys";
import * as reposicionService from "@/services/reposicion";
import { EstadoReposicion, ItemReposicion } from "@/types";
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import toast from "react-hot-toast";

/** Keys y tienda activa compartidas por todos los hooks del módulo. */
function useReposicionScope() {
  const { tiendaActiva } = useAuth();
  const tiendaId = tiendaActiva ?? SIN_TIENDA;
  return {
    tiendaActiva,
    ITEMS_KEY: reposicionItemsKey(tiendaId),
    HISTORIAL_KEY: reposicionHistorialKey(tiendaId),
    ESTADISTICAS_KEY: reposicionEstadisticasKey(tiendaId),
  };
}

export function useReposicionItems() {
  const { tiendaActiva, ITEMS_KEY } = useReposicionScope();
  return useQuery({
    queryKey: ITEMS_KEY,
    queryFn: () => reposicionService.listarItems(tiendaActiva!),
    enabled: !!tiendaActiva,
    // Colaboración en vivo (Fase 4, §7): la lista es privada por usuario,
    // así que esto sirve al caso multi-dispositivo con la misma cuenta.
    // refetchIntervalInBackground default false → solo con pestaña visible.
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
}

/**
 * Reproduce localmente el merge-on-add del servicio (mismo criterio: cualquier
 * estado de la misma variante se reabre a pendiente) cuando no hay red, y
 * encola la operación real para cuando vuelva la conexión.
 */
async function agregarOffline(
  queryClient: QueryClient,
  itemsKey: readonly unknown[],
  varianteId: string,
  cantidad: number
): Promise<ItemReposicion> {
  const actuales = queryClient.getQueryData<ItemReposicion[]>(itemsKey) ?? [];
  const existente = actuales.find((i) => i.varianteId === varianteId);
  const ahora = new Date();

  if (existente) {
    const actualizado: ItemReposicion = {
      ...existente,
      cantidad: existente.cantidad + cantidad,
      estado: "pendiente",
      actualizadoAt: ahora,
    };
    await enqueueOperation("reposicion.actualizarCantidad", {
      id: existente.id,
      cantidad: actualizado.cantidad,
    });
    if (existente.estado !== "pendiente") {
      await enqueueOperation("reposicion.cambiarEstado", {
        id: existente.id,
        estado: "pendiente",
      });
    }
    return actualizado;
  }

  const tempId = crearTempId();
  const nuevo: ItemReposicion = {
    id: tempId,
    varianteId,
    cantidad,
    estado: "pendiente",
    agregadoAt: ahora,
    actualizadoAt: ahora,
  };
  await enqueueOperation("reposicion.agregarItem", { tempId, varianteId, cantidad });
  return nuevo;
}

export function useAgregarReposicionItem() {
  const queryClient = useQueryClient();
  const { ITEMS_KEY } = useReposicionScope();
  return useMutation({
    networkMode: "always",
    mutationFn: async ({
      varianteId,
      cantidad,
    }: {
      varianteId: string;
      cantidad: number;
    }): Promise<ItemReposicion> => {
      if (isOnline()) {
        try {
          return await reposicionService.agregarItem(varianteId, cantidad);
        } catch (err) {
          if (!isNetworkError(err)) throw err;
        }
      }
      return agregarOffline(queryClient, ITEMS_KEY, varianteId, cantidad);
    },
    onSuccess: (item) => {
      queryClient.setQueryData<ItemReposicion[]>(ITEMS_KEY, (items) => {
        const actuales = items ?? [];
        const yaEstaba = actuales.some((i) => i.id === item.id);
        return yaEstaba
          ? actuales.map((i) => (i.id === item.id ? item : i))
          : [item, ...actuales];
      });
    },
  });
}

export function useActualizarCantidadReposicion() {
  const queryClient = useQueryClient();
  const { ITEMS_KEY } = useReposicionScope();
  return useMutation({
    networkMode: "always",
    mutationFn: ({ id, cantidad }: { id: string; cantidad: number }) =>
      ejecutarOEncolar(
        id,
        () => reposicionService.actualizarCantidad(id, cantidad),
        () => enqueueOperation("reposicion.actualizarCantidad", { id, cantidad }),
        null as ItemReposicion | null
      ),
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
  });
}

export function useCambiarEstadoReposicion() {
  const queryClient = useQueryClient();
  const { ITEMS_KEY } = useReposicionScope();
  return useMutation({
    networkMode: "always",
    mutationFn: ({ id, estado }: { id: string; estado: EstadoReposicion }) =>
      ejecutarOEncolar(
        id,
        () => reposicionService.cambiarEstado(id, estado),
        () => enqueueOperation("reposicion.cambiarEstado", { id, estado }),
        null as ItemReposicion | null
      ),
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
  });
}

/** Cambia el estado de varios items a la vez (acción masiva del modo selección). */
export function useCambiarEstadoMasivo() {
  const queryClient = useQueryClient();
  const { ITEMS_KEY } = useReposicionScope();
  return useMutation({
    networkMode: "always",
    mutationFn: ({ ids, estado }: { ids: string[]; estado: EstadoReposicion }) =>
      ejecutarMasivoOEncolar(
        ids,
        (idsReales) => reposicionService.cambiarEstadoMasivo(idsReales, estado),
        (id) => enqueueOperation("reposicion.cambiarEstado", { id, estado })
      ),
    onMutate: async ({ ids, estado }) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = queryClient.getQueryData<ItemReposicion[]>(ITEMS_KEY);
      const idSet = new Set(ids);
      queryClient.setQueryData<ItemReposicion[]>(ITEMS_KEY, (items) =>
        (items ?? []).map((item) => (idSet.has(item.id) ? { ...item, estado } : item))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(ITEMS_KEY, context.previous);
    },
  });
}

/** Elimina varios items a la vez (acción masiva del modo selección). */
export function useEliminarItemsMasivo() {
  const queryClient = useQueryClient();
  const { ITEMS_KEY } = useReposicionScope();
  return useMutation({
    networkMode: "always",
    mutationFn: (ids: string[]) =>
      ejecutarMasivoOEncolar(
        ids,
        (idsReales) => reposicionService.eliminarItemsMasivo(idsReales),
        (id) => enqueueOperation("reposicion.eliminarItem", { id })
      ),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = queryClient.getQueryData<ItemReposicion[]>(ITEMS_KEY);
      const idSet = new Set(ids);
      queryClient.setQueryData<ItemReposicion[]>(ITEMS_KEY, (items) =>
        (items ?? []).filter((item) => !idSet.has(item.id))
      );
      return { previous };
    },
    onError: (_err, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(ITEMS_KEY, context.previous);
    },
  });
}

function useEliminarReposicionItem() {
  return useMutation({
    networkMode: "always",
    mutationFn: (id: string) =>
      ejecutarOEncolar(
        id,
        () => reposicionService.eliminarItem(id),
        () => enqueueOperation("reposicion.eliminarItem", { id }),
        undefined as void
      ),
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
  const { ITEMS_KEY } = useReposicionScope();
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
    [queryClient, ITEMS_KEY, actualizarCantidad, eliminarItem]
  );
}

/** Borrado directo (sin pasar por el flujo de deshacer), para el ícono de basura. */
export function useEliminarReposicionItemDirecto() {
  const queryClient = useQueryClient();
  const { ITEMS_KEY } = useReposicionScope();
  return useMutation({
    networkMode: "always",
    mutationFn: (id: string) =>
      ejecutarOEncolar(
        id,
        () => reposicionService.eliminarItem(id),
        () => enqueueOperation("reposicion.eliminarItem", { id }),
        undefined as void
      ),
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
  });
}

export function useGuardarListaReposicion() {
  const queryClient = useQueryClient();
  const { tiendaActiva, ITEMS_KEY, HISTORIAL_KEY, ESTADISTICAS_KEY } =
    useReposicionScope();
  return useMutation({
    networkMode: "always",
    mutationFn: async () => {
      if (!isOnline()) {
        throw new Error(
          "Necesitás conexión a internet para guardar la lista y cerrar el turno."
        );
      }
      if (!tiendaActiva) {
        throw new Error("No hay una tienda activa.");
      }
      return reposicionService.guardarListaActual(tiendaActiva);
    },
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
  const { tiendaActiva, HISTORIAL_KEY } = useReposicionScope();
  return useQuery({
    queryKey: [...HISTORIAL_KEY, filtros],
    queryFn: () => reposicionService.obtenerHistorial(tiendaActiva!, filtros),
    enabled: !!tiendaActiva,
  });
}

export function useEliminarListaHistorial() {
  const queryClient = useQueryClient();
  const { HISTORIAL_KEY } = useReposicionScope();
  return useMutation({
    mutationFn: (id: string) => reposicionService.eliminarListaHistorial(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HISTORIAL_KEY }),
  });
}

export function useEstadisticasReposicion(periodo: "semana" | "mes" | "año") {
  const { tiendaActiva, ESTADISTICAS_KEY } = useReposicionScope();
  return useQuery({
    queryKey: [...ESTADISTICAS_KEY, periodo],
    queryFn: () => reposicionService.obtenerEstadisticas(tiendaActiva!, periodo),
    enabled: !!tiendaActiva,
  });
}
