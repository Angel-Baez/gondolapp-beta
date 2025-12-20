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
      await obtenerOCrearProducto('123456789');
      await obtenerOCrearProducto('987654321');

      // Solo un warning (sistema singleton en deprecation-warnings.ts)
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
