"use client";

import { limpiarEstadoLocal } from "@/lib/limpiarEstadoLocal";
import { supabase } from "@/lib/supabase";
import { useOutboxStore } from "@/store/outbox";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

/**
 * Logout con limpieza local obligatoria (spec §3.2): aviso si hay cambios
 * sin sincronizar → signOut → limpiarEstadoLocal() → cache en memoria →
 * /login.
 */
export function useCerrarSesion() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [cerrando, setCerrando] = useState(false);

  const cerrarSesion = useCallback(async () => {
    const pendientes = useOutboxStore.getState().pendingCount;
    if (pendientes > 0) {
      const seguir = window.confirm(
        `Tenés ${pendientes} ${
          pendientes === 1 ? "cambio" : "cambios"
        } sin sincronizar que se van a perder. ¿Cerrar sesión igual?`
      );
      if (!seguir) return;
    }

    setCerrando(true);
    try {
      try {
        await supabase.auth.signOut();
      } catch {
        // Sin red no se puede revocar el token en el servidor, pero la
        // sesión local igual se elimina y la limpieza debe continuar.
      }
      await limpiarEstadoLocal();
      queryClient.clear();
      router.replace("/login");
    } finally {
      setCerrando(false);
    }
  }, [queryClient, router]);

  return { cerrarSesion, cerrando };
}
