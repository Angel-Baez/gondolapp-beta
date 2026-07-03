import { isNetworkError, isOnline } from "./outbox";
import { esTempId } from "./types";

/**
 * Ejecuta una mutación contra Supabase; si el item es offline (tempId, todavía
 * no sincronizado) o no hay red, encola la operación en su lugar y devuelve
 * `valorOffline` sin lanzar error — el `onMutate` optimista del hook ya deja
 * la UI en el estado correcto, así que no hace falta esperar la red.
 */
export async function ejecutarOEncolar<T>(
  id: string,
  ejecutar: () => Promise<T>,
  encolar: () => Promise<void>,
  valorOffline: T
): Promise<T> {
  if (esTempId(id) || !isOnline()) {
    await encolar();
    return valorOffline;
  }
  try {
    return await ejecutar();
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    await encolar();
    return valorOffline;
  }
}
