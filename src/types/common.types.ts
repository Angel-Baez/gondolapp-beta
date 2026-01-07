/**
 * Common Types - Tipos genéricos usados en toda la aplicación
 */

// Tipo de alertas de vencimiento
export type AlertaNivel = "critico" | "advertencia" | "precaucion" | "normal";

// Estado de los items de reposición
export type ItemStatus = "PENDING" | "RESTOCKED" | "OUT_OF_STOCK";

// Modo de escaneo
export type ScanMode = "reposicion" | "vencimiento";
