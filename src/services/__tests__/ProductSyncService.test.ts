import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductSyncService } from '../ProductSyncService';
import { dbService } from '@/lib/db';
import { ProductoCompleto } from '../productos';
import { ProductoBase, ProductoVariante } from '@/types';

// Mock dbService
vi.mock('@/lib/db', () => ({
  dbService: {
    getProductoBaseById: vi.fn(),
    getVarianteById: vi.fn(),
    addProductoBase: vi.fn(),
    addVariante: vi.fn(),
    getVarianteByBarcode: vi.fn(),
  },
}));

describe('ProductSyncService (refactorizado con dbService)', () => {
  const mockBase: ProductoBase = {
    id: 'base-123',
    nombre: 'Coca-Cola',
    marca: 'Coca-Cola',
    categoria: 'Bebidas',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVariante: ProductoVariante = {
    id: 'var-123',
    productoBaseId: 'base-123',
    codigoBarras: '123456789',
    nombreCompleto: 'Coca-Cola 2L',
    tipo: 'Regular',
    tamano: '2L',
    createdAt: new Date(),
  };

  const mockProducto: ProductoCompleto = {
    base: mockBase,
    variante: mockVariante,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Suprimir console.log en tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('syncProductToIndexedDB', () => {
    it('debe sincronizar producto nuevo (base + variante)', async () => {
      // Producto no existe
      vi.mocked(dbService.getProductoBaseById).mockResolvedValueOnce(undefined);
      vi.mocked(dbService.getVarianteById).mockResolvedValueOnce(undefined);
      vi.mocked(dbService.addProductoBase).mockResolvedValueOnce('base-123');
      vi.mocked(dbService.addVariante).mockResolvedValueOnce('var-123');

      await ProductSyncService.syncProductToIndexedDB(mockProducto);

      expect(dbService.getProductoBaseById).toHaveBeenCalledWith('base-123');
      expect(dbService.getVarianteById).toHaveBeenCalledWith('var-123');
      expect(dbService.addProductoBase).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'base-123',
          nombre: 'Coca-Cola',
          marca: 'Coca-Cola',
          categoria: 'Bebidas',
        })
      );
      expect(dbService.addVariante).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'var-123',
          codigoBarras: '123456789',
          nombreCompleto: 'Coca-Cola 2L',
        })
      );
    });

    it('debe sincronizar solo base si variante existe', async () => {
      vi.mocked(dbService.getProductoBaseById).mockResolvedValueOnce(undefined);
      vi.mocked(dbService.getVarianteById).mockResolvedValueOnce(mockVariante);
      vi.mocked(dbService.addProductoBase).mockResolvedValueOnce('base-123');

      await ProductSyncService.syncProductToIndexedDB(mockProducto);

      expect(dbService.addProductoBase).toHaveBeenCalled();
      expect(dbService.addVariante).not.toHaveBeenCalled();
    });

    it('debe sincronizar solo variante si base existe', async () => {
      vi.mocked(dbService.getProductoBaseById).mockResolvedValueOnce(mockBase);
      vi.mocked(dbService.getVarianteById).mockResolvedValueOnce(undefined);
      vi.mocked(dbService.addVariante).mockResolvedValueOnce('var-123');

      await ProductSyncService.syncProductToIndexedDB(mockProducto);

      expect(dbService.addProductoBase).not.toHaveBeenCalled();
      expect(dbService.addVariante).toHaveBeenCalled();
    });

    it('debe manejar errores en sincronización', async () => {
      vi.mocked(dbService.getProductoBaseById).mockRejectedValueOnce(
        new Error('DB Error')
      );

      await expect(
        ProductSyncService.syncProductToIndexedDB(mockProducto)
      ).rejects.toThrow('DB Error');
    });
  });

  describe('productExists', () => {
    it('debe verificar existencia de producto por EAN', async () => {
      vi.mocked(dbService.getVarianteByBarcode).mockResolvedValueOnce(mockVariante);

      const exists = await ProductSyncService.productExists('123456789');

      expect(exists).toBe(true);
      expect(dbService.getVarianteByBarcode).toHaveBeenCalledWith('123456789');
    });

    it('debe retornar false si producto no existe', async () => {
      vi.mocked(dbService.getVarianteByBarcode).mockResolvedValueOnce(undefined);

      const exists = await ProductSyncService.productExists('999999999');

      expect(exists).toBe(false);
    });

    it('debe manejar errores y retornar false', async () => {
      vi.mocked(dbService.getVarianteByBarcode).mockRejectedValueOnce(
        new Error('DB Error')
      );

      const exists = await ProductSyncService.productExists('123456789');

      expect(exists).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getProductById', () => {
    it('debe obtener producto completo por ID de variante', async () => {
      vi.mocked(dbService.getVarianteById).mockResolvedValueOnce(mockVariante);
      vi.mocked(dbService.getProductoBaseById).mockResolvedValueOnce(mockBase);

      const producto = await ProductSyncService.getProductById('var-123');

      expect(producto).toEqual({ base: mockBase, variante: mockVariante });
      expect(dbService.getVarianteById).toHaveBeenCalledWith('var-123');
      expect(dbService.getProductoBaseById).toHaveBeenCalledWith('base-123');
    });

    it('debe retornar null si variante no existe', async () => {
      vi.mocked(dbService.getVarianteById).mockResolvedValueOnce(undefined);

      const producto = await ProductSyncService.getProductById('var-999');

      expect(producto).toBeNull();
      expect(dbService.getProductoBaseById).not.toHaveBeenCalled();
    });

    it('debe retornar null si base no existe', async () => {
      vi.mocked(dbService.getVarianteById).mockResolvedValueOnce(mockVariante);
      vi.mocked(dbService.getProductoBaseById).mockResolvedValueOnce(undefined);

      const producto = await ProductSyncService.getProductById('var-123');

      expect(producto).toBeNull();
    });

    it('debe manejar errores y retornar null', async () => {
      vi.mocked(dbService.getVarianteById).mockRejectedValueOnce(
        new Error('DB Error')
      );

      const producto = await ProductSyncService.getProductById('var-123');

      expect(producto).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
