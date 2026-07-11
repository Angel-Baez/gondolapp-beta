import { del, get, set } from "idb-keyval";
import { generarUUID } from "@/lib/utils";
import { useOutboxStore } from "@/store/outbox";
import { outboxStore } from "./db";
import { ejecutarOperacion } from "./executors";
import { OutboxOperation, OutboxOperationType, PayloadOf } from "./types";

const QUEUE_KEY = "queue";

async function readQueue(): Promise<OutboxOperation[]> {
  return (await get<OutboxOperation[]>(QUEUE_KEY, outboxStore)) ?? [];
}

async function writeQueue(queue: OutboxOperation[]): Promise<void> {
  await set(QUEUE_KEY, queue, outboxStore);
  useOutboxStore.getState().setPendingCount(queue.length);
}

/** Encola una operación para ejecutarla contra Supabase apenas haya conexión. */
export async function enqueueOperation<T extends OutboxOperationType>(
  type: T,
  payload: PayloadOf<T>
): Promise<void> {
  const queue = await readQueue();
  queue.push({
    id: generarUUID(),
    type,
    payload,
    createdAt: Date.now(),
  } as OutboxOperation);
  await writeQueue(queue);
}

export async function countPending(): Promise<number> {
  return (await readQueue()).length;
}

/** Vacía la cola sin ejecutar nada (logout vía limpiarEstadoLocal, tests). */
export async function clearQueue(): Promise<void> {
  await del(QUEUE_KEY, outboxStore);
  useOutboxStore.getState().setPendingCount(0);
}

export function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine;
}

export function isNetworkError(err: unknown): boolean {
  if (!isOnline()) return true;
  if (err instanceof TypeError) return true;
  if (err instanceof Error && /fetch|network/i.test(err.message)) return true;
  return false;
}

/**
 * Errores de autenticación transitorios: JWT vencido al volver online,
 * sesión todavía sin refrescar. La operación es válida y va a funcionar
 * tras el refresh de autoRefreshToken — debe cortar la corrida como un
 * error de red, NUNCA descartarse (perdería trabajo offline en silencio,
 * spec §4.3). Un 403 de RLS en cambio es error de datos: reintentar no
 * lo arregla y sí debe descartarse.
 */
export function esErrorDeAuthReintentable(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: unknown; status?: unknown; message?: unknown };
  if (e.code === "PGRST301") return true;
  if (e.status === 401) return true;
  return (
    typeof e.message === "string" &&
    /jwt (expired|invalid)|token (is )?expired/i.test(e.message)
  );
}

let procesando = false;

/**
 * Procesa la cola en orden (FIFO). Cuando una operación de creación se
 * sincroniza, su tempId se resuelve al id real de Supabase y se propaga a
 * las operaciones siguientes en la misma corrida que referencien ese mismo
 * item (por ejemplo: crear offline → cambiar cantidad offline, en ese orden).
 *
 * Si una operación falla por red o por sesión vencida (401/PGRST301), la
 * corrida se corta ahí (la cola queda intacta) para reintentar más tarde.
 * Si falla por otra razón (dato inválido, item ya no existe), se descarta
 * esa operación puntual para no bloquear el resto de la cola.
 */
export async function processQueue(): Promise<void> {
  if (procesando || !isOnline()) return;
  procesando = true;
  useOutboxStore.getState().setSyncing(true);
  try {
    const idMap = new Map<string, string>();
    for (;;) {
      const queue = await readQueue();
      if (queue.length === 0) break;
      const [op, ...resto] = queue;
      const resolveId = (id: string) => idMap.get(id) ?? id;
      try {
        const resultado = await ejecutarOperacion(op, resolveId);
        if (resultado?.tempId && resultado.realId) {
          idMap.set(resultado.tempId, resultado.realId);
        }
        await writeQueue(resto);
      } catch (err) {
        if (isNetworkError(err) || esErrorDeAuthReintentable(err)) break;
        // Error de datos (no de red ni de auth): se descarta para no
        // bloquear la cola.
        await writeQueue(resto);
      }
    }
  } finally {
    procesando = false;
    useOutboxStore.getState().setSyncing(false);
  }
}
