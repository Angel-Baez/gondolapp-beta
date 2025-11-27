// Tipo de alertas de vencimiento
export type AlertaNivel = "critico" | "advertencia" | "precaucion" | "normal";

// Estado de los items de reposición
export type ItemStatus = "PENDING" | "RESTOCKED" | "OUT_OF_STOCK";

// Modo de escaneo
export type ScanMode = "reposicion" | "vencimiento";

// Producto Base
export interface ProductoBase {
  id: string; // UUID
  nombre: string;
  categoria?: string;
  marca?: string;
  imagen?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Variante de Producto
export interface ProductoVariante {
  id: string; // UUID
  productoBaseId: string; // FK a ProductoBase
  codigoBarras: string;
  nombreCompleto: string;
  tipo?: string; // "Original", "Sin Lactosa", etc.
  tamano?: string; // "1000g", "1400g", etc.
  sabor?: string;
  unidadMedida?: string; // "g", "ml", "unidad"
  imagen?: string;
  createdAt: Date;
}

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
// ESQUEMAS MONGODB
// ============================================

// Producto Base en MongoDB
export interface ProductoBaseMongo {
  _id?: string; // ObjectId como string
  nombre: string;
  marca: string;
  categoria: string;
  imagen?: string;
  createdAt: Date;
}

// Variante de Producto en MongoDB
export interface ProductoVarianteMongo {
  _id?: string; // ObjectId como string
  productoBaseId: string; // FK a ProductoBaseMongo
  ean: string; // Código de barras
  nombreCompleto: string; // Generado automáticamente
  tipo?: string; // "Crecimiento", "Sin Lactosa", etc.
  tamano?: string; // "360g", "1L", etc.
  volumen?: number; // Número extraído (360, 1)
  unidad?: string; // "G", "L", "ML", "KG"
  sabor?: string;
  imagen?: string;
  createdAt: Date;
}

// DTO para crear producto desde formulario
export interface CrearProductoDTO {
  ean: string;
  productoBase: {
    nombre: string;
    marca: string;
    categoria: string;
    imagen?: string;
  };
  variante: {
    tipo?: string;
    tamano: string;
    sabor?: string;
    imagen?: string;
  };
}

// Resultado de importación desde Excel
export interface ResultadoImportacion {
  success: boolean;
  contadores: {
    productosBase: number;
    variantes: number;
    duplicados: number;
    errores: number;
  };
  errores?: Array<{
    fila: number;
    error: string;
  }>;
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

// ============================================
// SISTEMA DE FEEDBACK PARA BETA-TESTERS
// ============================================

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
