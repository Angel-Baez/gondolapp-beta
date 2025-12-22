import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScanProduct } from '../useScanProduct';
import { MockProductService } from '@/tests/mocks/ProductServiceMock';

// Mock de useProductService
vi.mock('@/hooks/useProductService', () => ({
  useProductService: () => {
    const service = new MockProductService();
    let loading = false;
    let error: string | null = null;
    
    return {
      scanProduct: async (barcode: string) => {
        loading = true;
        error = null;
        
        try {
          const producto = await service.getOrCreateProduct(barcode);
          loading = false;
          return { success: true, producto };
        } catch (err: any) {
          error = err.message;
          loading = false;
          return { success: false, error: err.message };
        }
      },
      loading,
      error,
      clearError: () => {
        error = null;
      },
    };
  },
}));

describe('useScanProduct (refactored)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe escanear producto exitosamente', async () => {
    const { result } = renderHook(() => useScanProduct());

    let response: any;
    await act(async () => {
      response = await result.current.scanProduct('123456789');
    });

    expect(response.success).toBe(true);
    expect(response.producto).toBeDefined();
    expect(response.producto?.variante.codigoBarras).toBe('123456789');
  });

  it('debe manejar errores correctamente', async () => {
    const { result } = renderHook(() => useScanProduct());

    let response: any;
    await act(async () => {
      response = await result.current.scanProduct('invalid');
    });

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });

  it('debe mantener compatibilidad con API anterior', () => {
    const { result } = renderHook(() => useScanProduct());

    // Verificar que la API sigue siendo la misma
    expect(result.current).toHaveProperty('scanProduct');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('clearError');
    
    // Verificar que son del tipo correcto
    expect(typeof result.current.scanProduct).toBe('function');
    expect(typeof result.current.loading).toBe('boolean');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('debe loggear correctamente', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useScanProduct());

    // Test successful scan with logs
    await act(async () => {
      await result.current.scanProduct('123456789');
    });

    // Verificar que los logs fueron llamados con los mensajes correctos
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '🔍 Buscando producto con código:',
      '123456789'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '✅ Producto obtenido:',
      expect.objectContaining({
        base: expect.any(Object),
        variante: expect.any(Object),
      })
    );

    // Test error scan with logs
    await act(async () => {
      await result.current.scanProduct('invalid');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ Error al procesar código:',
      expect.any(String)
    );

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('debe retornar producto completo con estructura esperada', async () => {
    const { result } = renderHook(() => useScanProduct());

    let response: any;
    await act(async () => {
      response = await result.current.scanProduct('123456789');
    });

    // Verificar estructura de ProductoCompleto
    expect(response.producto).toHaveProperty('base');
    expect(response.producto).toHaveProperty('variante');
    expect(response.producto.base).toHaveProperty('nombre');
    expect(response.producto.variante).toHaveProperty('codigoBarras');
    expect(response.producto.variante).toHaveProperty('nombreCompleto');
  });
});
