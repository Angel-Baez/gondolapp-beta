import { AlertaNivel } from "@/types";

// Orden de armado cuando la categoría no tiene definición propia en
// categoria_atributos. Debe coincidir con el seed global de la migración 0008.
export const ORDEN_ATRIBUTOS_DEFAULT = ["tipo", "sabor", "tamano"] as const;

/**
 * Ordena las claves de un objeto de atributos: primero las conocidas en el
 * orden dado, después las desconocidas en orden alfabético. Espeja el
 * criterio de armar_nombre_completo() en BD para que el display client-side
 * coincida con el nombre_completo derivado por el trigger.
 */
export function ordenarClavesAtributos(
  atributos: Record<string, string | null | undefined>,
  orden: readonly string[] = ORDEN_ATRIBUTOS_DEFAULT
): string[] {
  const conocidas = orden.filter((clave) => clave in atributos);
  const desconocidas = Object.keys(atributos)
    .filter((clave) => !orden.includes(clave))
    .sort();
  return [...conocidas, ...desconocidas];
}

/**
 * Arma el nombre completo mostrado en pantalla para una variante: nombre de
 * la base + valores de atributos en el orden de la categoría. Solo para
 * display/optimistic UI: el nombre_completo persistido lo deriva el trigger
 * de BD (migración 0008), nunca el cliente.
 */
export function construirNombreCompleto(
  nombreBase: string,
  atributos: Record<string, string | null | undefined>,
  orden: readonly string[] = ORDEN_ATRIBUTOS_DEFAULT
): string {
  return [
    nombreBase,
    ...ordenarClavesAtributos(atributos, orden).map((clave) => atributos[clave]),
  ]
    .filter((parte): parte is string => Boolean(parte && parte.trim()))
    .join(" ");
}

/**
 * Calcula el nivel de alerta basado en la fecha de vencimiento.
 * Se recalcula siempre al leer (nunca se persiste), así que no hay
 * riesgo de que quede desactualizado si la app queda abierta mucho tiempo.
 */
export function calcularNivelAlerta(fechaVencimiento: Date): AlertaNivel {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaVenc = new Date(fechaVencimiento);
  fechaVenc.setHours(0, 0, 0, 0);

  const diasRestantes = Math.floor(
    (fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diasRestantes < 0) return "vencido"; // Ya pasó la fecha, sin retirar
  if (diasRestantes <= 15) return "critico"; // Rojo
  if (diasRestantes <= 30) return "advertencia"; // Naranja (antes amarillo: fix severidad)
  if (diasRestantes <= 60) return "precaucion"; // Amarillo (antes naranja: fix severidad)
  return "normal"; // Verde/Gris
}

/**
 * Formatea una fecha a string legible
 */
export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(fecha));
}

/**
 * Calcula días restantes hasta una fecha
 */
export function calcularDiasRestantes(fechaVencimiento: Date): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaVenc = new Date(fechaVencimiento);
  fechaVenc.setHours(0, 0, 0, 0);

  return Math.floor(
    (fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/** Mensaje corto de urgencia: "Venció hace 3 días", "¡Vence hoy!", "Vence en 5 días". */
export function mensajeVencimiento(fechaVencimiento: Date): string {
  const dias = calcularDiasRestantes(fechaVencimiento);
  if (dias < 0) {
    const abs = Math.abs(dias);
    return `Venció hace ${abs} día${abs === 1 ? "" : "s"}`;
  }
  if (dias === 0) return "¡Vence hoy!";
  if (dias === 1) return "Vence mañana";
  return `Vence en ${dias} días`;
}

/** Suma `dias` a hoy y devuelve la fecha resultante (para presets de vencimiento). */
export function sumarDias(dias: number, base: Date = new Date()): Date {
  const fecha = new Date(base);
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

/** Formatea una fecha como YYYY-MM-DD para <input type="date">. */
export function toDateInputValue(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Genera un UUID v4
 */
export function generarUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
