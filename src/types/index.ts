// Tipo de alertas de vencimiento, de más a menos urgente.
// "vencido" (ya pasó la fecha) es distinto de "critico" (todavía queda tiempo)
// aunque ambos requieren atención inmediata.
export type AlertaNivel =
  | "vencido"
  | "critico"
  | "advertencia"
  | "precaucion"
  | "normal";

// Estado de un item de reposición
export type EstadoReposicion = "pendiente" | "repuesto" | "sin_stock";

// Estado de un item de vencimiento: solo distingue si sigue activo en la
// lista o si ya fue retirado de la góndola. La urgencia (incluido si ya
// venció sin retirarse) se deriva de fechaVencimiento al leer, ver AlertaNivel.
export type EstadoVencimiento = "pendiente" | "retirado";

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

// Ejes de variación de una variante, clave->valor (ej: { tipo: "Sin
// Lactosa", sabor: "Vainilla", tamano: "1L" }). Las claves las define
// categoria_atributos por categoría; los valores son texto libre.
// Objeto plano a propósito: se persiste en IndexedDB vía JSON.stringify.
export type AtributosVariante = Record<string, string>;

// Definición de un atributo para una categoría (tabla categoria_atributos):
// guía el formulario dinámico y el orden de armado del nombre. Los valores
// reales viven en ProductoVariante.atributos.
export interface CategoriaAtributo {
  clave: string;
  etiqueta: string;
  orden: number;
  sugerencias?: string[];
}

// Variante de Producto
export interface ProductoVariante {
  id: string; // UUID
  productoBaseId: string; // FK a ProductoBase
  codigoBarras: string;
  // Derivado en BD (trigger): nombre base + atributos en el orden de la
  // categoría. Nunca escribirlo desde el cliente.
  nombreCompleto: string;
  atributos: AtributosVariante;
  imagen?: string;
  createdAt: Date;
}

// Item de Reposición
export interface ItemReposicion {
  id: string; // UUID
  varianteId: string; // FK a ProductoVariante
  cantidad: number;
  estado: EstadoReposicion;
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
  estado: EstadoVencimiento;
  agregadoAt: Date;
  resueltoAt?: Date;
}

// Item de vencimiento con el nivel de alerta calculado al leer
// (nunca se persiste: es una función pura de fechaVencimiento vs. hoy)
export interface ItemVencimientoConAlerta extends ItemVencimiento {
  alertaNivel: AlertaNivel;
}

// DTO para crear producto desde formulario. Sólo nombre + marca son
// obligatorios (agilizar el alta cuando no se escanea el código): el resto
// se completa con valores vacíos si no se especifica.
export interface CrearProductoDTO {
  ean: string;
  productoBase: {
    nombre: string;
    marca: string;
    categoria?: string;
    imagen?: string;
  };
  variante: {
    atributos?: AtributosVariante;
    imagen?: string;
  };
}


// ============================================
// HISTORIAL DE REPOSICIÓN
// ============================================

// Item guardado en el historial de una lista de reposición
export interface ItemHistorial {
  varianteId: string | null;
  productoNombre: string;
  productoMarca?: string;
  varianteNombre: string;
  cantidad: number;
  estado: EstadoReposicion;
}

// Lista de reposición guardada en historial
export interface ListaReposicionHistorial {
  id: string; // UUID único
  fechaCreacion: Date; // Timestamp de creación de la lista
  fechaGuardado: Date; // Timestamp de guardado
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
// HISTORIAL DE VENCIMIENTO
// ============================================

// Item retirado, guardado en el historial de vencimientos
export interface ItemVencimientoHistorial {
  id: string;
  varianteId: string | null;
  productoNombre: string;
  productoMarca?: string;
  varianteNombre: string;
  cantidad?: number;
  lote?: string;
  fechaVencimiento: Date;
  fechaRetiro: Date;
  nivelAlertaAlRetirar: AlertaNivel;
}

// Estadísticas de vencimiento
export interface EstadisticasVencimiento {
  periodo: "semana" | "mes" | "año";
  totalRetirados: number;
  productosMasRetirados: Array<{
    productoNombre: string;
    cantidad: number;
  }>;
  promedioDiasARetiro: number;
}
