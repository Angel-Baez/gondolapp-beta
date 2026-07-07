"use client";

import { CATALOGO_COMPLETO_KEY } from "@/hooks/useCatalogoCompleto";
import { obtenerCatalogoCompleto } from "@/services/catalogo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Mantiene el catálogo completo (bases + variantes + definiciones) fresco
 * en cache: prefetch al montar (si hay conexión) y refresh en cada evento
 * `online`, para que escanear/buscar offline use datos recientes en vez de
 * esperar al primer miss de useCatalogoCompleto.
 *
 * Separado de OutboxProvider a propósito: ese sincroniza la cola de
 * mutaciones offline, esto sincroniza una lectura de catálogo —
 * responsabilidades distintas aunque el patrón (montar + evento online)
 * sea el mismo.
 */
export default function CatalogoSyncProvider() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const sincronizar = () =>
      queryClient.prefetchQuery({
        queryKey: CATALOGO_COMPLETO_KEY,
        queryFn: obtenerCatalogoCompleto,
        staleTime: 30 * 60_000,
      });

    if (navigator.onLine) sincronizar();
    window.addEventListener("online", sincronizar);
    return () => window.removeEventListener("online", sincronizar);
  }, [queryClient]);

  return null;
}
