/**
 * Sistema de Presets para Creación Rápida de Productos
 *
 * Permite crear productos comunes con configuraciones predefinidas
 * para agilizar el proceso de registro.
 */

export interface PresetConfig {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  marcasComunes: string[];
  tipos?: string[];
  tamanosComunes: string[];
  unidadBase: string;
  sabores?: string[];
  icono: string;
}

export const PRESETS_PRODUCTOS: PresetConfig[] = [
  {
    id: "leche-polvo",
    nombre: "Leche en Polvo",
    descripcion: "Leches en polvo para bebés e infantiles",
    categoria: "Leche en Polvo",
    marcasComunes: ["Nestlé", "Abbott", "Mead Johnson", "Danone"],
    tipos: ["Crecimiento", "Forticrece", "Kinder", "NAN", "Similac"],
    tamanosComunes: ["360g", "400g", "900g", "1100g", "1400g"],
    unidadBase: "G",
    icono: "🍼",
  },
  {
    id: "leche-liquida",
    nombre: "Leche Líquida",
    descripcion: "Leches UHT y frescas",
    categoria: "Lácteos",
    marcasComunes: ["Gloria", "Laive", "Pura Vida", "Bella Holandesa"],
    tipos: ["Entera", "Descremada", "Sin Lactosa", "Deslactosada", "Light"],
    tamanosComunes: ["1L", "500ml", "250ml", "946ml"],
    unidadBase: "L",
    icono: "🥛",
  },
  {
    id: "compotas",
    nombre: "Compotas Infantiles",
    descripcion: "Compotas y papillas para bebés",
    categoria: "Alimentos Infantiles",
    marcasComunes: ["Heinz", "Gerber", "Nestlé"],
    tamanosComunes: ["105g", "113g", "120g"],
    unidadBase: "G",
    sabores: [
      "Manzana",
      "Pera",
      "Durazno",
      "Ciruela",
      "Plátano",
      "Mango",
      "Mixta",
    ],
    icono: "🍎",
  },
  {
    id: "refrescos",
    nombre: "Refrescos / Gaseosas",
    descripcion: "Bebidas carbonatadas",
    categoria: "Bebidas",
    marcasComunes: [
      "Coca-Cola",
      "Pepsi",
      "Inca Kola",
      "Fanta",
      "Sprite",
      "Kola Real",
    ],
    tipos: ["Regular", "Zero", "Light", "Sin Azúcar"],
    tamanosComunes: ["500ml", "600ml", "1L", "1.5L", "2L", "2.5L", "3L"],
    unidadBase: "L",
    icono: "🥤",
  },
  {
    id: "yogurt",
    nombre: "Yogurt",
    descripcion: "Yogurt bebible y batido",
    categoria: "Lácteos",
    marcasComunes: ["Gloria", "Laive", "Milkito", "Pura Vida"],
    tipos: ["Batido", "Bebible", "Griego", "Light", "Probiótico"],
    tamanosComunes: ["1L", "500ml", "180ml", "120ml", "1kg"],
    unidadBase: "L",
    sabores: [
      "Fresa",
      "Vainilla",
      "Durazno",
      "Lúcuma",
      "Guanábana",
      "Natural",
      "Mixto",
    ],
    icono: "🍨",
  },
  {
    id: "aceites",
    nombre: "Aceites",
    descripcion: "Aceites vegetales para cocina",
    categoria: "Abarrotes",
    marcasComunes: ["Primor", "Cocinero", "Ideal", "Cil"],
    tipos: ["Vegetal", "Girasol", "Soya", "Oliva", "Canola"],
    tamanosComunes: ["1L", "900ml", "500ml"],
    unidadBase: "L",
    icono: "🛢️",
  },
  {
    id: "pasta",
    nombre: "Fideos / Pasta",
    descripcion: "Pastas y fideos",
    categoria: "Abarrotes",
    marcasComunes: ["Don Vittorio", "Molitalia", "Lavaggi", "Nicolini"],
    tipos: [
      "Spaghetti",
      "Tornillo",
      "Canuto",
      "Penne",
      "Cabello de Ángel",
      "Tallarín",
    ],
    tamanosComunes: ["250g", "500g", "1kg"],
    unidadBase: "G",
    icono: "🍝",
  },
  {
    id: "cereales",
    nombre: "Cereales",
    descripcion: "Cereales para desayuno",
    categoria: "Cereales",
    marcasComunes: ["Ángel", "Tres Ositos", "Nestlé", "Kellogg's"],
    tipos: ["Hojuelas", "Avena", "Quinua", "Kiwicha", "Maca"],
    tamanosComunes: ["150g", "180g", "200g", "500g", "1kg"],
    unidadBase: "G",
    icono: "🥣",
  },
  {
    id: "galletas",
    nombre: "Galletas",
    descripcion: "Galletas dulces y saladas",
    categoria: "Galletas",
    marcasComunes: ["Field", "Morochas", "Soda", "Ritz", "Club Social"],
    tipos: ["Dulces", "Saladas", "Integrales", "Rellenas", "Wafer"],
    tamanosComunes: ["40g", "60g", "150g", "300g", "600g"],
    unidadBase: "G",
    sabores: ["Chocolate", "Vainilla", "Fresa", "Limón", "Original", "Naranja"],
    icono: "🍪",
  },
  {
    id: "agua",
    nombre: "Agua Embotellada",
    descripcion: "Agua mineral y de mesa",
    categoria: "Bebidas",
    marcasComunes: ["San Luis", "Cielo", "San Mateo", "San Carlos"],
    tipos: ["Sin Gas", "Con Gas"],
    tamanosComunes: ["625ml", "1L", "2.5L", "7L"],
    unidadBase: "L",
    icono: "💧",
  },
];

/**
 * Obtener preset por ID
 */
export function getPresetById(id: string): PresetConfig | undefined {
  return PRESETS_PRODUCTOS.find((preset) => preset.id === id);
}

/**
 * Generar nombre completo automáticamente desde un preset
 */
export function generarNombreCompleto(params: {
  tipo?: string;
  tamano: string;
  sabor?: string;
}): string {
  const partes = [params.tipo, params.tamano, params.sabor].filter(Boolean);
  return partes.join(" ");
}

/**
 * Buscar presets por categoría
 */
export function getPresetsByCategoria(categoria: string): PresetConfig[] {
  return PRESETS_PRODUCTOS.filter((preset) => preset.categoria === categoria);
}

/**
 * Obtener todas las categorías únicas
 */
export function getCategorias(): string[] {
  return Array.from(new Set(PRESETS_PRODUCTOS.map((p) => p.categoria)));
}
