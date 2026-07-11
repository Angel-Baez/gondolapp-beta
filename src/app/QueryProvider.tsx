"use client";

import { useAuth } from "@/components/AuthProvider";
import {
  esQueryPersistible,
  MAX_AGE_CACHE_MS,
  queryPersister,
} from "@/lib/queryPersister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useMemo } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const { user, tiendaActiva, cargando } = useAuth();

  // Identidad del cache: cambiar de usuario o de tienda descarta el cache
  // restaurado (buster) y arranca un QueryClient limpio (key del provider).
  const identidad = `${user?.id ?? "anon"}:${tiendaActiva ?? "sin-tienda"}`;

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // El GC en memoria no debe tirar antes lo que el persister
            // guarda: gcTime >= maxAge (recomendación de TanStack).
            gcTime: MAX_AGE_CACHE_MS,
          },
        },
      }),
    [identidad]
  );

  // La sesión inicial se resuelve desde la cookie local (milisegundos,
  // también offline); no montar el persister con la identidad equivocada.
  if (cargando) return null;

  return (
    <PersistQueryClientProvider
      key={identidad}
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: MAX_AGE_CACHE_MS,
        // v4: cache aislado por identidad (multi-tienda, spec §4.2).
        // (v3 descartaba el shape viejo de atributos; v2 los Map de v1.)
        buster: `v4:${identidad}`,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" &&
            esQueryPersistible(query.queryKey),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
