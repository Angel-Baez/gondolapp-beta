import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { createStore, del, get, set } from "idb-keyval";

/**
 * Persistencia del cache de React Query en IndexedDB, para que las listas
 * sobrevivan a un arranque en frío sin conexión. Sin esto, offline la app
 * mostraba "Tu lista está vacía" aunque la base tuviera items: el outbox
 * cubría las escrituras pero las lecturas vivían solo en memoria.
 *
 * Store de IDB dedicado, separado del de la cola offline (ver outbox/db.ts).
 */
const store =
  typeof indexedDB !== "undefined"
    ? createStore("gondolapp-query-cache", "cache")
    : undefined;

const idbStorage = {
  getItem: async (key: string) =>
    store ? (await get<string>(key, store)) ?? null : null,
  setItem: async (key: string, value: string) => {
    if (store) await set(key, value, store);
  },
  removeItem: async (key: string) => {
    if (store) await del(key, store);
  },
};

/** Solo timestamps ISO completos (con hora), que es como JSON serializa los
 * campos Date de los items. Fechas planas tipo "2026-01-01" no se tocan. */
const ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Reviver del cache restaurado: los items tienen campos Date
 * (fechaVencimiento, agregadoAt, ...) que JSON aplana a string y romperían
 * `.getTime()` al rehidratar.
 */
export function deserializarConFechas(cached: string) {
  return JSON.parse(cached, (_key, value) =>
    typeof value === "string" && ISO_TIMESTAMP.test(value)
      ? new Date(value)
      : value
  );
}

/**
 * Se persisten solo las lecturas que el gondolero necesita en el pasillo
 * sin señal: las dos listas activas, el catálogo completo (bases +
 * variantes + definiciones, ver useCatalogoCompleto) y los EAN ya
 * resueltos. Historial y estadísticas se consultan con calma y online.
 */
export function esQueryPersistible(queryKey: readonly unknown[]): boolean {
  return (
    (queryKey[0] === "reposicion" && queryKey[1] === "items") ||
    (queryKey[0] === "vencimiento" && queryKey[1] === "items") ||
    (queryKey[0] === "catalogo" && queryKey[1] === "completo") ||
    (queryKey[0] === "producto" && queryKey[1] === "ean")
  );
}

export const MAX_AGE_CACHE_MS = 24 * 60 * 60 * 1000;

export const queryPersister = createAsyncStoragePersister({
  storage: idbStorage,
  deserialize: deserializarConFechas,
});
