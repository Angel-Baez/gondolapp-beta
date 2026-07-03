import { createStore } from "idb-keyval";

/**
 * Store de IndexedDB dedicado a la cola offline, separado del cache de
 * React Query (que vive solo en memoria y no sobrevive a un reload).
 */
export const outboxStore =
  typeof indexedDB !== "undefined"
    ? createStore("gondolapp-outbox", "operaciones")
    : undefined;
