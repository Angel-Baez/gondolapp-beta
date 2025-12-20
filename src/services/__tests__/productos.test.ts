import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  obtenerOCrearProducto,
  obtenerProductoCompleto,
  buscarProductosBase,
  obtenerVariantesDeBase,
  crearProductoManual,
} from '../productos';
import { MockProductService } from '@/tests/mocks/ProductServiceMock';

// Mock del service container
vi.mock('@/core/container/serviceConfig', () => ({
  getProductService: () => new MockProductService(),
  getProductRepository: vi.fn(),
  getDataSourceManager: vi.fn(),
  getNormalizerChain: vi.fn(),
}));

describe('Funciones Legacy (deprecated)', () => {
  let consoleWarnSpy: any;

  beforeEach(() => {
    // Clear the WARNED_FUNCTIONS set by importing fresh
    vi.resetModules();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('obtenerOCrearProducto', () => {
    it('debe mostrar warning de deprecación', async () => {
      await obtenerOCrearProducto('123456789');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATED: obtenerOCrearProducto')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('useProductService().scanProduct()')
      );
    });

    it('debe funcionar correctamente a pesar del warning', async () => {
      const resultado = await obtenerOCrearProducto('123456789');

      expect(resultado).toBeDefined();
      expect(resultado?.variante.codigoBarras).toBe('123456789');
    });

    it('debe mostrar warning solo una vez por sesión', async () => {
      // Este test verifica que la misma función solo muestre warning una vez
      // Necesitamos reimportar el módulo para resetear el Set
      const { obtenerOCrearProducto: obtenerFn } = await import('../productos');
      
      await obtenerFn('123456789');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      
      await obtenerFn('987654321');
      // Aún debe ser 1 porque la función ya mostró el warning
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('obtenerProductoCompleto', () => {
    it('debe mostrar warning de deprecación', async () => {
      await obtenerProductoCompleto('var-123456789');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATED: obtenerProductoCompleto')
      );
    });

    it('debe funcionar correctamente', async () => {
      const resultado = await obtenerProductoCompleto('var-123456789');

      expect(resultado).toBeDefined();
    });
  });

  describe('buscarProductosBase', () => {
    it('debe mostrar warning de deprecación', async () => {
      await buscarProductosBase('Coca');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATED: buscarProductosBase')
      );
    });

    it('debe retornar array de productos', async () => {
      const resultado = await buscarProductosBase('Coca');

      expect(Array.isArray(resultado)).toBe(true);
    });
  });

  describe('obtenerVariantesDeBase', () => {
    it('debe mostrar warning de deprecación', async () => {
      await obtenerVariantesDeBase('base-123');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATED: obtenerVariantesDeBase')
      );
    });
  });

  describe('crearProductoManual', () => {
    it('debe mostrar warning de deprecación', async () => {
      await crearProductoManual('999999999', {
        nombreBase: 'Test',
        marca: 'Test Brand',
        tamano: '1L',
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATED: crearProductoManual')
      );
    });
  });
});
