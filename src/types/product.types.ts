/**
 * Product Types - Tipos relacionados con productos y variantes
 */

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

// Producto Completo (Base + Variante)
export interface ProductoCompleto {
  base: ProductoBase;
  variante: ProductoVariante;
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
