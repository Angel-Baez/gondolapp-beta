"use client";

import { useAuth } from "@/components/AuthProvider";
import { catalogoCompletoKey } from "@/lib/queryKeys";
import { obtenerCatalogoCompleto } from "@/services/catalogo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Mantiene el catálogo completo de la tienda activa (bases + variantes +
 * definiciones) fresco en cache: prefetch al montar (si hay conexión) y
 * refresh en cada evento `online`, para que escanear/buscar offline use
 * datos recientes en vez de esperar al primer miss de useCatalogoCompleto.
 *
 * Separado de OutboxProvider a propósito: ese sincroniza la cola de
 * mutaciones offline, esto sincroniza una lectura de catálogo —
 * responsabilidades distintas aunque el patrón (montar + evento online)
 * sea el mismo.
 */
export default function CatalogoSyncProvider() {
  const queryClient = useQueryClient();
  const { tiendaActiva } = useAuth();

  useEffect(() => {
    if (!tiendaActiva) return;
    const sincronizar = () =>
      queryClient.prefetchQuery({
        queryKey: catalogoCompletoKey(tiendaActiva),
        queryFn: () => obtenerCatalogoCompleto(tiendaActiva),
        staleTime: 30 * 60_000,
      });

    if (navigator.onLine) sincronizar();
    window.addEventListener("online", sincronizar);
    return () => window.removeEventListener("online", sincronizar);
  }, [queryClient, tiendaActiva]);

  return null;
}
