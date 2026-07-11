"use client";

import { countPending, processQueue } from "@/lib/outbox/outbox";
import { supabase } from "@/lib/supabase";
import { useOutboxStore } from "@/store/outbox";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Sincroniza la cola offline apenas hay conexión: al montar (por si quedó
 * algo pendiente de una sesión anterior) y en cada evento `online`. No
 * renderiza nada — es lógica pura de ciclo de vida.
 */
export default function OutboxProvider() {
  const queryClient = useQueryClient();

  useEffect(() => {
    countPending().then((n) => useOutboxStore.getState().setPendingCount(n));

    const sincronizar = async () => {
      const antes = await countPending();
      if (antes === 0) return;
      // getSession refresca el access token si está por vencer; sin sesión
      // no se procesa (la cola queda intacta para el próximo login).
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      await processQueue();
      const despues = await countPending();
      // Prefijo ["tienda"]: invalida las listas de todas las tiendas (las
      // keys llevan tienda desde la Fase 2).
      queryClient.invalidateQueries({ queryKey: ["tienda"] });
      if (despues < antes) {
        toast.success(
          antes - despues === 1
            ? "1 cambio sincronizado"
            : `${antes - despues} cambios sincronizados`,
          { duration: 2500 }
        );
      }
    };

    if (navigator.onLine) sincronizar();
    window.addEventListener("online", sincronizar);
    return () => window.removeEventListener("online", sincronizar);
  }, [queryClient]);

  return null;
}
