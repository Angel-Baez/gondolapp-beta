/**
 * Feedback Types - Sistema de feedback para beta-testers
 */

// Tipos de feedback
export type FeedbackTipo = "Bug" | "Mejora" | "Pregunta" | "Otro";

// Estados del reporte de feedback
export type FeedbackEstado = "Pendiente" | "En progreso" | "Resuelto" | "Descartado";

// Prioridades del reporte
export type FeedbackPrioridad = "Baja" | "Media" | "Alta" | "Critica";

// Categorías/Áreas del producto afectadas
export type FeedbackCategoria =
  | "escaneo"
  | "inventario"
  | "vencimientos"
  | "ui/ux"
  | "rendimiento"
  | "otro"
  | "seguridad"
  | "notificaciones"
  | "integraciones"
  | "reportes"
  | "configuracion";

// Metadata técnica capturada automáticamente
export interface FeedbackMetadata {
  navegador: string;
  dispositivo: string;
  versionApp: string;
  url: string;
  userAgent: string;
  sistemaOperativo?: string;
  resolucionPantalla?: string;
}

// Nota interna del equipo de administración
export interface FeedbackNota {
  texto: string;
  fecha: Date;
  autor: string;
}

// Entrada del historial de cambios
export interface FeedbackHistorialEntry {
  fecha: Date;
  mensaje: string;
}

// Reporte de feedback completo
export interface FeedbackReporte {
  _id?: string;
  tipo: FeedbackTipo[];
  titulo: string;
  descripcion: string;
  estado: FeedbackEstado;
  prioridad: FeedbackPrioridad;
  categorias: FeedbackCategoria[];
  metadata: FeedbackMetadata;
  screenshots: string[];
  userEmail?: string;
  userId?: string;
  notas: FeedbackNota[];
  respuesta?: string;
  creadoAt: Date;
  resolvedAt?: Date;
  actualizadoEn: Date;
  leidoEn?: Date;
  historial: FeedbackHistorialEntry[];
  // Integración con GitHub
  githubIssueUrl?: string;
  githubIssueNumber?: number;
}

// DTO para crear un nuevo feedback
export interface CrearFeedbackDTO {
  tipo: FeedbackTipo[];
  titulo: string;
  descripcion: string;
  prioridad?: FeedbackPrioridad;
  categorias: FeedbackCategoria[];
  screenshots?: string[];
  userEmail?: string;
  metadata?: Partial<FeedbackMetadata>;
}

// Filtros para consultar feedbacks
export interface FeedbackFiltros {
  tipo?: FeedbackTipo;
  estado?: FeedbackEstado;
  prioridad?: FeedbackPrioridad;
  categoria?: FeedbackCategoria;
  desde?: Date;
  hasta?: Date;
  busqueda?: string;
}
