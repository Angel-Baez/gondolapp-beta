import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProductVerification } from '../useProductVerification';
import { dbService } from '@/lib/db';
import { ProductoVariante } from '@/types';

// Mock dbService
vi.mock('@/lib/db', () => ({
  dbService: {
    getVarianteByBarcode: vi.fn(),
  },
}));

describe('useProductVerification (refactorizado con dbService)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkExists', () => {
    it('debe verificar producto existente', async () => {
      const mockVariante: ProductoVariante = {
        id: 'var-123',
        productoBaseId: 'base-123',
        codigoBarras: '123456789',
        nombreCompleto: 'Coca-Cola 2L',
        tipo: 'Regular',
        tamano: '2L',
        createdAt: new Date(),
      };

      vi.mocked(dbService.getVarianteByBarcode).mockResolvedValueOnce(mockVariante);

      const { result } = renderHook(() => useProductVerification());

      expect(result.current.checking).toBe(false);

      let response: any;
      await act(async () => {
        response = await result.current.checkExists('123456789');
      });

      expect(response.exists).toBe(true);
      expect(response.variante).toEqual(mockVariante);
      expect(result.current.checking).toBe(false);
      expect(dbService.getVarianteByBarcode).toHaveBeenCalledWith('123456789');
    });

    it('debe verificar producto no existente', async () => {
      vi.mocked(dbService.getVarianteByBarcode).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useProductVerification());

      let response: any;
      await act(async () => {
        response = await result.current.checkExists('999999999');
      });

      expect(response.exists).toBe(false);
      expect(response.variante).toBeUndefined();
      expect(result.current.checking).toBe(false);
      expect(dbService.getVarianteByBarcode).toHaveBeenCalledWith('999999999');
    });

    it('debe manejar estado de loading correctamente', async () => {
      vi.mocked(dbService.getVarianteByBarcode).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
      );

      const { result } = renderHook(() => useProductVerification());

      expect(result.current.checking).toBe(false);

      const checkPromise = act(async () => {
        await result.current.checkExists('123456789');
      });

      // Durante la ejecución, checking eventualmente será false
      await checkPromise;
      expect(result.current.checking).toBe(false);
    });
  });
});
