import { ProductoCompleto } from "@/services/productos";
import { ProductoBase, ProductoVariante } from "@/types";

/**
 * Mock de ProductService para tests
 */
export class MockProductService {
  private mockData: Map<string, ProductoCompleto> = new Map();

  constructor() {
    // Datos de prueba por defecto
    this.mockData.set('123456789', this.createMockProduct('123456789', 'Coca-Cola', '2L'));
    this.mockData.set('987654321', this.createMockProduct('987654321', 'Pepsi', '1.5L'));
  }

  private createMockProduct(barcode: string, nombre: string, tamano: string): ProductoCompleto {
    const baseId = `base-${barcode}`;
    return {
      base: {
        id: baseId,
        nombre,
        marca: 'Test Brand',
        categoria: 'Bebidas',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      variante: {
        id: `var-${barcode}`,
        productoBaseId: baseId,
        codigoBarras: barcode,
        nombreCompleto: `${nombre} ${tamano}`,
        tipo: 'Regular',
        tamano,
        createdAt: new Date(),
      },
    };
  }

  async getOrCreateProduct(barcode: string): Promise<ProductoCompleto | null> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 100));

    if (barcode === 'invalid') {
      // Producto no encontrado: simulamos error específico de producto inexistente
      throw new Error(`Producto con código ${barcode} no encontrado.`);
    }

    if (barcode === 'network-error') {
      throw new Error('Error de conexión');
    }

    return this.mockData.get(barcode) || this.createMockProduct(barcode, 'Producto Genérico', '500ml');
  }

  async getProductById(id: string): Promise<ProductoCompleto | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    for (const producto of this.mockData.values()) {
      if (producto.variante.id === id) {
        return producto;
      }
    }
    return null;
  }

  async searchProducts(term: string): Promise<ProductoBase[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return Array.from(this.mockData.values())
      .map(p => p.base)
      .filter(base => 
        base.nombre.toLowerCase().includes(term.toLowerCase()) ||
        base.marca?.toLowerCase().includes(term.toLowerCase())
      );
  }

  async getVariants(baseId: string): Promise<ProductoVariante[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return Array.from(this.mockData.values())
      .filter(p => p.base.id === baseId)
      .map(p => p.variante);
  }

  async createManualProduct(
    barcode: string,
    data: {
      nombreBase: string;
      marca?: string;
      nombreVariante?: string;
      tipo?: string;
      tamano?: string;
      sabor?: string;
    }
  ): Promise<ProductoCompleto> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const producto = this.createMockProduct(barcode, data.nombreBase, data.tamano || '500ml');
    if (data.marca) {
      producto.base.marca = data.marca;
    }
    this.mockData.set(barcode, producto);
    return producto;
  }
}
