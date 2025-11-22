/**
 * Normalized product data structure
 * Used throughout the SOLID architecture for consistent product representation
 */
export interface DatosNormalizados {
  marca: string;
  nombreBase: string;
  nombreVariante: string;
  categoria?: string;
  imagen?: string;
  variante: {
    volumen?: number;
    unidad?: string;
    tipo?: string;
    sabor?: string;
  };
  raw: any; // Raw data for debugging
}
