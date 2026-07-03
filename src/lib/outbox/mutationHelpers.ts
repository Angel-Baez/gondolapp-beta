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

/**
 * Variante masiva: separa los ids offline (tempId, todavía no sincronizados)
 * de los reales. Los offline siempre se encolan de a uno (no existen en
 * Supabase todavía). Para los reales, intenta un solo round-trip
 * (`ejecutarReal`) y cae a encolar de a uno ante un error de red.
 */
export async function ejecutarMasivoOEncolar(
  ids: string[],
  ejecutarReal: (ids: string[]) => Promise<void>,
  encolarUno: (id: string) => Promise<void>
): Promise<void> {
  const idsOffline = ids.filter(esTempId);
  const idsReales = ids.filter((id) => !esTempId(id));

  await Promise.all(idsOffline.map(encolarUno));
  if (idsReales.length === 0) return;

  if (!isOnline()) {
    await Promise.all(idsReales.map(encolarUno));
    return;
  }
  try {
    await ejecutarReal(idsReales);
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    await Promise.all(idsReales.map(encolarUno));
  }
}
