/**
 * Inventory Types - Tipos para reposición, vencimientos e historial
 */

import { AlertaNivel } from "./common.types";

// Item de Reposición
export interface ItemReposicion {
  id: string; // UUID
  varianteId: string; // FK a ProductoVariante
  cantidad: number;
  repuesto: boolean;
  sinStock: boolean;
  agregadoAt: Date;
  actualizadoAt: Date;
}

// Item de Vencimiento
export interface ItemVencimiento {
  id: string; // UUID
  varianteId: string; // FK a ProductoVariante
  fechaVencimiento: Date;
  cantidad?: number;
  lote?: string;
  agregadoAt: Date;
  alertaNivel: AlertaNivel;
}

// ============================================
// HISTORIAL DE LISTAS
// ============================================

// Item guardado en el historial
export interface ItemHistorial {
  varianteId: string;
  productoNombre: string;
  productoMarca?: string;
  varianteNombre: string;
  cantidad: number;
  estado: "repuesto" | "sinStock" | "pendiente";
}

// Lista de reposición guardada en historial
export interface ListaReposicionHistorial {
  id: string; // UUID único
  fechaCreacion: Date; // Timestamp de creación de la lista
  fechaGuardado: Date; // Timestamp de guardado
  usuarioId?: string; // Opcional para multi-usuario
  resumen: {
    totalProductos: number;
    totalRepuestos: number;
    totalSinStock: number;
    totalPendientes: number;
  };
  items: ItemHistorial[];
  metadata: {
    duracionMinutos?: number; // Tiempo que tomó completar la lista
    ubicacion?: string; // Opcional: góndola/sección
  };
}

// Estadísticas de reposición
export interface EstadisticasReposicion {
  periodo: "semana" | "mes" | "año";
  totalListas: number;
  promedioProductosPorLista: number;
  totalProductosRepuestos: number;
  totalProductosSinStock: number;
  productosMasRepuestos: Array<{
    productoNombre: string;
    cantidad: number;
  }>;
}
