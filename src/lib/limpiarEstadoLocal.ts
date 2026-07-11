import {
  actualizarAppBadge,
  limpiarNotificados,
} from "@/lib/notificacionesVencimiento";
import { clearQueue } from "@/lib/outbox/outbox";
import { limpiarCachePersistido } from "@/lib/queryPersister";
import { useRecentsStore } from "@/store/recents";

/**
 * Limpieza local completa al cerrar sesión (docs/SPECMULTIUSER.md §3.2).
 * El dispositivo de la tienda es potencialmente compartido: es un requisito
 * de privacidad, no polish. Única fuente de la lista — logout y "cambio de
 * usuario detectado" deben pasar por acá.
 *
 * No borra preferencias de dispositivo sin datos (gondolapp-theme,
 * gondolapp-ui, flag de notificaciones).
 */
export async function limpiarEstadoLocal(): Promise<void> {
  // Datos en IndexedDB: cache de queries + cola offline.
  await Promise.all([limpiarCachePersistido(), clearQueue()]);

  // Recientes/frecuentes (nombres de productos de la tienda).
  useRecentsStore.setState({ entries: {} });
  useRecentsStore.persist.clearStorage();

  // Registro de vencimientos ya notificados + badge del ícono.
  limpiarNotificados();
  actualizarAppBadge(0);

  // Caches del service worker que guardan respuestas con datos (/api/*).
  // Los GETs de Supabase no entran al SW (ver public/sw.js), esto purga
  // lo que sí se cachea.
  if (typeof caches !== "undefined") {
    const claves = await caches.keys();
    await Promise.all(
      claves
        .filter(
          (clave) =>
            clave.startsWith("gondolapp-dynamic-") ||
            clave.startsWith("gondolapp-api-")
        )
        .map((clave) => caches.delete(clave))
    );
  }
}
