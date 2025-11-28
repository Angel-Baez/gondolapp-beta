/**
 * Utilidades para el sistema de feedback admin
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de funciones de utilidad
 */

/**
 * Formatear fecha en español
 */
export function formatearFecha(fecha: Date | string): string {
  const d = new Date(fecha);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
