"use client";

import { useAuth } from "@/components/AuthProvider";
import { reposicionItemsKey, vencimientoItemsKey } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import { useOutboxStore } from "@/store/outbox";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Colaboración en vivo (docs/SPECMULTIUSER.md §7): un canal
 * `postgres_changes` por tienda que INVALIDA las listas activas cuando
 * cambian en el servidor. Complementa el refetch al foco / por intervalo
 * de los hooks con propagación casi inmediata entre dispositivos.
 *
 * Reglas del diseño (§7), para no chocar con optimistic updates + outbox:
 * - Solo invalida la query; nunca aplica el payload al cache (evita el eco
 *   de las propias mutaciones y los conflictos con lo optimista).
 * - Debounce (una ráfaga de N cambios = una sola invalidación).
 * - Suspende mientras el outbox sincroniza (su corrida ya invalida al
 *   final): así una tanda de escrituras propias no dispara refetches
 *   redundantes.
 *
 * RLS aplica al canal con el token authenticated: `items_vencimiento`
 * llega a toda la tienda; `items_reposicion` —privada por usuario desde la
 * 0017— solo al propio dueño (multi-dispositivo con la misma cuenta).
 */
const DEBOUNCE_MS = 400;

export default function RealtimeProvider() {
  const queryClient = useQueryClient();
  const { tiendaActiva } = useAuth();

  useEffect(() => {
    if (!tiendaActiva) return;

    const timers: Record<string, ReturnType<typeof setTimeout>> = {};

    const invalidarDebounced = (key: readonly unknown[]) => {
      const id = JSON.stringify(key);
      clearTimeout(timers[id]);
      timers[id] = setTimeout(() => {
        // El outbox invalida ["tienda"] al terminar su corrida; mientras
        // sincroniza, dejamos que él sea la fuente de verdad.
        if (useOutboxStore.getState().isSyncing) return;
        queryClient.invalidateQueries({ queryKey: key });
      }, DEBOUNCE_MS);
    };

    const filtro = `tienda_id=eq.${tiendaActiva}`;
    const canal = supabase
      .channel(`tienda:${tiendaActiva}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items_reposicion", filter: filtro },
        () => invalidarDebounced(reposicionItemsKey(tiendaActiva))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items_vencimiento", filter: filtro },
        () => invalidarDebounced(vencimientoItemsKey(tiendaActiva))
      );

    // El canal necesita el JWT del usuario para que RLS filtre lo que emite.
    // Se re-setea en cada refresh de token (si no, el canal se queda con un
    // access token vencido tras ~1 h y deja de recibir).
    let cancelado = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelado) return;
      if (data.session?.access_token) {
        supabase.realtime.setAuth(data.session.access_token);
      }
      canal.subscribe();
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);
    });

    return () => {
      cancelado = true;
      authSub.subscription.unsubscribe();
      Object.values(timers).forEach(clearTimeout);
      supabase.removeChannel(canal);
    };
  }, [queryClient, tiendaActiva]);

  return null;
}
