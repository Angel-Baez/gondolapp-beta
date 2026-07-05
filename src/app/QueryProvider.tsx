"use client";

import {
  esQueryPersistible,
  MAX_AGE_CACHE_MS,
  queryPersister,
} from "@/lib/queryPersister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
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
      })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: MAX_AGE_CACHE_MS,
        // v3: ProductoVariante pasó de tipo/tamano/sabor a atributos jsonb;
        // el bump descarta caches con el shape viejo (la rehidratación no
        // pasa por el mapper, así que el `?? {}` defensivo no alcanza).
        // (v2 había descartado los Map serializados como {} de v1.)
        buster: "v3",
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
