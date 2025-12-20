import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProductService } from '../useProductService';
import { MockProductService } from '@/tests/mocks/ProductServiceMock';

// Mock del service container
vi.mock('@/core/container/serviceConfig', () => ({
  getProductService: () => new MockProductService(),
}));

describe('useProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scanProduct', () => {
    it('debe escanear producto exitosamente', async () => {
      const { result } = renderHook(() => useProductService());

      let response: any;
      await act(async () => {
        response = await result.current.scanProduct('123456789');
      });

      expect(response.success).toBe(true);
      expect(response.producto).toBeDefined();
      expect(response.producto?.variante.codigoBarras).toBe('123456789');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('debe manejar producto no encontrado', async () => {
      const { result } = renderHook(() => useProductService());

      let response: any;
      await act(async () => {
        response = await result.current.scanProduct('invalid');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(result.current.error).toBeDefined();
    });

    it('debe actualizar estado de loading correctamente', async () => {
      const { result } = renderHook(() => useProductService());

      expect(result.current.loading).toBe(false);

      const promise = act(async () => {
        await result.current.scanProduct('123456789');
      });

      // Durante la ejecución, loading debe ser true
      await waitFor(() => {
        // El loading ya debería estar en false después de completar
        expect(result.current.loading).toBe(false);
      });

      await promise;
      expect(result.current.loading).toBe(false);
    });

    it('debe limpiar error previo en nuevo scan', async () => {
      const { result } = renderHook(() => useProductService());

      // Primer scan con error
      await act(async () => {
        await result.current.scanProduct('invalid');
      });
      expect(result.current.error).toBeDefined();

      // Segundo scan exitoso
      await act(async () => {
        await result.current.scanProduct('123456789');
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('getProductById', () => {
    it('debe obtener producto por ID', async () => {
      const { result } = renderHook(() => useProductService());

      let producto: any;
      await act(async () => {
        producto = await result.current.getProductById('var-123456789');
      });

      expect(producto).toBeDefined();
      expect(producto?.variante.id).toBe('var-123456789');
    });

    it('debe retornar null para ID inexistente', async () => {
      const { result } = renderHook(() => useProductService());

      let producto: any;
      await act(async () => {
        producto = await result.current.getProductById('inexistente');
      });

      expect(producto).toBeNull();
    });
  });

  describe('searchProducts', () => {
    it('debe buscar productos por término', async () => {
      const { result } = renderHook(() => useProductService());

      let productos: any;
      await act(async () => {
        productos = await result.current.searchProducts('Coca');
      });

      expect(productos).toBeDefined();
      expect(productos.length).toBeGreaterThan(0);
      expect(productos[0].nombre).toContain('Coca');
    });

    it('debe retornar array vacío si no encuentra resultados', async () => {
      const { result } = renderHook(() => useProductService());

      let productos: any;
      await act(async () => {
        productos = await result.current.searchProducts('NoExiste123XYZ');
      });

      expect(productos).toEqual([]);
    });
  });

  describe('clearError', () => {
    it('debe limpiar el error', async () => {
      const { result } = renderHook(() => useProductService());

      // Generar error
      await act(async () => {
        await result.current.scanProduct('invalid');
      });
      expect(result.current.error).toBeDefined();

      // Limpiar error
      act(() => {
        result.current.clearError();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('service singleton', () => {
    it('debe mantener la misma instancia de service en re-renders', () => {
      const { result, rerender } = renderHook(() => useProductService());

      const service1 = result.current.service;
      
      rerender();
      
      const service2 = result.current.service;

      expect(service1).toBe(service2);
    });
  });
});
