import { mensajeVencimiento } from "@/lib/utils";
import { AlertaNivel } from "@/types";

/**
 * Notificaciones locales de vencimientos urgentes.
 *
 * Sin backend de push: se dispara desde la app (abierta o instalada como PWA)
 * cuando un item entra en nivel urgente. El registro de "ya notificado" vive
 * en localStorage para no repetir la misma alerta en cada refetch; pasar de
 * crítico a vencido cuenta como alerta nueva.
 */

const STORAGE_KEY = "gondolapp-vencimientos-notificados";

/** URL que abre el service worker al tocar la notificación (ver sw.js). */
const URL_VENCIMIENTOS = "/?view=vencimiento";

export interface ItemNotificable {
  id: string;
  nombre: string;
  alertaNivel: AlertaNivel;
  fechaVencimiento: Date;
}

/** Map itemId → nivel por el que ya se notificó. */
export type RegistroNotificados = Record<string, string>;

export function esUrgente(nivel: AlertaNivel): boolean {
  return nivel === "vencido" || nivel === "critico";
}

/**
 * Items urgentes que todavía no se notificaron en su nivel actual.
 * Un item notificado como crítico que pasa a vencido vuelve a salir.
 */
export function seleccionarItemsANotificar(
  items: ItemNotificable[],
  notificados: RegistroNotificados
): ItemNotificable[] {
  return items.filter(
    (item) => esUrgente(item.alertaNivel) && notificados[item.id] !== item.alertaNivel
  );
}

/**
 * Depura el registro: conserva solo los items que siguen urgentes. Los
 * retirados/eliminados (o con fecha corregida) salen, así pueden volver a
 * notificar si algún día re-entran en urgencia.
 */
export function podarNotificados(
  notificados: RegistroNotificados,
  items: ItemNotificable[]
): RegistroNotificados {
  const urgentesActuales = new Set(
    items.filter((item) => esUrgente(item.alertaNivel)).map((item) => item.id)
  );
  return Object.fromEntries(
    Object.entries(notificados).filter(([id]) => urgentesActuales.has(id))
  );
}

/** Arma título y cuerpo de la notificación para uno o varios items. */
export function construirMensaje(items: ItemNotificable[]): {
  titulo: string;
  cuerpo: string;
} {
  if (items.length === 1) {
    const item = items[0];
    return {
      titulo: item.nombre,
      cuerpo: `${mensajeVencimiento(item.fechaVencimiento)} — revisá la góndola.`,
    };
  }
  const nombres = items.map((item) => item.nombre);
  const visibles = nombres.slice(0, 4);
  const resto = nombres.length - visibles.length;
  return {
    titulo: `${items.length} productos urgentes por vencimiento`,
    cuerpo: resto > 0 ? `${visibles.join(", ")} y ${resto} más` : visibles.join(", "),
  };
}

// Registro por tienda (Fase 2): al cambiar de tienda, la poda del registro
// de una no debe pisar el de la otra.
function claveDeTienda(tiendaId: string): string {
  return `${STORAGE_KEY}:${tiendaId}`;
}

export function leerNotificados(tiendaId: string): RegistroNotificados {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(claveDeTienda(tiendaId)) ?? "{}");
  } catch {
    return {};
  }
}

export function guardarNotificados(
  tiendaId: string,
  registro: RegistroNotificados
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(claveDeTienda(tiendaId), JSON.stringify(registro));
  } catch {
    // Almacenamiento lleno o bloqueado: se reintenta en el próximo ciclo.
  }
}

/** Borra el registro de notificados de TODAS las tiendas (logout, spec §3.2). */
export function limpiarNotificados(): void {
  if (typeof window === "undefined") return;
  try {
    const aBorrar: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const clave = window.localStorage.key(i);
      if (clave?.startsWith(STORAGE_KEY)) aBorrar.push(clave);
    }
    aBorrar.forEach((clave) => window.localStorage.removeItem(clave));
  } catch {
    // sin acceso a storage: nada que borrar
  }
}

/** iOS Safari solo expone Notification con la PWA instalada (16.4+). */
export function soportaNotificaciones(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function tienePermiso(): boolean {
  return soportaNotificaciones() && Notification.permission === "granted";
}

export async function solicitarPermiso(): Promise<NotificationPermission> {
  if (!soportaNotificaciones()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

/**
 * Muestra la notificación vía service worker (necesario en Android; permite
 * que el tap abra la vista de vencimientos aunque la app esté cerrada) con
 * fallback a Notification directa en desktop sin SW activo.
 */
export async function mostrarNotificacionVencimientos(
  items: ItemNotificable[]
): Promise<void> {
  if (!tienePermiso() || items.length === 0) return;
  const { titulo, cuerpo } = construirMensaje(items);
  const opciones: NotificationOptions = {
    body: cuerpo,
    icon: "/icon-192x192.png",
    badge: "/icon-calendar-96x96.png",
    // Un solo aviso vivo: la alerta nueva reemplaza a la anterior.
    tag: "vencimientos-urgentes",
    data: { url: URL_VENCIMIENTOS },
  };
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(titulo, opciones);
      return;
    }
  } catch {
    // Sin SW registrado (dev, o navegador sin soporte): probar directo.
  }
  try {
    new Notification(titulo, opciones);
  } catch {
    // Android exige SW para notificar; sin él no hay nada que hacer.
  }
}

/** Contador en el ícono de la app instalada (Badging API, si existe). */
export function actualizarAppBadge(count: number): void {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & {
    setAppBadge?: (contents?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  if (count > 0) nav.setAppBadge?.(count).catch(() => {});
  else nav.clearAppBadge?.().catch(() => {});
}
