import { AlertaNivel } from "@/types";

/**
 * Calcula el nivel de alerta basado en la fecha de vencimiento
 */
export function calcularNivelAlerta(fechaVencimiento: Date): AlertaNivel {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaVenc = new Date(fechaVencimiento);
  fechaVenc.setHours(0, 0, 0, 0);

  const diasRestantes = Math.floor(
    (fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diasRestantes < 0) return "critico"; // Vencido
  if (diasRestantes <= 15) return "critico"; // Rojo
  if (diasRestantes <= 30) return "advertencia"; // Amarillo
  if (diasRestantes <= 60) return "precaucion"; // Naranja
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
