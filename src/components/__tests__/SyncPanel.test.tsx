import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncPanel } from '../SyncPanel';

// Mock de dbService
const mockDbService = {
  getProductosBase: vi.fn(),
  getVariantes: vi.fn(),
  getItemsReposicion: vi.fn(),
  getItemsVencimiento: vi.fn(),
  clearProductosBase: vi.fn(),
  clearVariantes: vi.fn(),
  clearItemsReposicion: vi.fn(),
  clearItemsVencimiento: vi.fn(),
  bulkPutProductosBase: vi.fn(),
  bulkPutVariantes: vi.fn(),
  bulkPutItemsReposicion: vi.fn(),
  bulkPutItemsVencimiento: vi.fn(),
  transaction: vi.fn(),
};

// Mock de fetch
global.fetch = vi.fn() as any;

// Mock de toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock de confirmAsync
vi.mock('@/lib/confirm', () => ({
  confirmAsync: vi.fn(),
}));

// Mock de dbService import
vi.mock('@/lib/db', async () => {
  return {
    dbService: mockDbService,
  };
});

describe('SyncPanel (refactorizado con dbService)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default fetch responses
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        success: true,
        pagination: {
          total: {
            productosBase: 10,
            variantes: 25,
            reposicion: 5,
            vencimientos: 3,
          },
        },
        timestamp: new Date().toISOString(),
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe renderizar correctamente', () => {
    render(<SyncPanel />);
    
    expect(screen.getByText(/Estado de la Nube/i)).toBeInTheDocument();
    expect(screen.getByText(/Subir Datos/i)).toBeInTheDocument();
    expect(screen.getByText(/Descargar Datos/i)).toBeInTheDocument();
  });

  it('debe cargar estadísticas al hacer clic en refrescar', async () => {
    render(<SyncPanel />);
    
    const refreshButton = screen.getByTitle('Refrescar Estadísticas');
    
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/sync'));
    });

    // Verificar que las estadísticas se muestran
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // productosBase
      expect(screen.getByText('25')).toBeInTheDocument(); // variantes
    });
  });

  describe('syncToCloud', () => {
    it('debe sincronizar datos a la nube usando dbService', async () => {
      // Setup mock data
      mockDbService.getProductosBase.mockResolvedValue([{ id: '1', nombre: 'Test' }]);
      mockDbService.getVariantes.mockResolvedValue([{ id: '1', codigoBarras: '123' }]);
      mockDbService.getItemsReposicion.mockResolvedValue([{ id: '1', cantidad: 10 }]);
      mockDbService.getItemsVencimiento.mockResolvedValue([{ id: '1', lote: 'A1' }]);

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          results: {
            inserted: { productosBase: 1 },
            updated: {},
            errors: [],
          },
          pagination: {
            total: {
              productosBase: 10,
              variantes: 25,
              reposicion: 5,
              vencimientos: 3,
            },
          },
          timestamp: new Date().toISOString(),
        }),
      });

      render(<SyncPanel />);
      
      const syncButton = screen.getByText(/Subir Datos/i);
      
      await act(async () => {
        fireEvent.click(syncButton);
      });

      await waitFor(() => {
        expect(mockDbService.getProductosBase).toHaveBeenCalled();
        expect(mockDbService.getVariantes).toHaveBeenCalled();
        expect(mockDbService.getItemsReposicion).toHaveBeenCalled();
        expect(mockDbService.getItemsVencimiento).toHaveBeenCalled();
      });

      // Verificar que se envió POST a /api/sync
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/sync',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('debe manejar errores al sincronizar a la nube', async () => {
      mockDbService.getProductosBase.mockRejectedValue(new Error('DB Error'));

      const toast = await import('react-hot-toast');
      
      render(<SyncPanel />);
      
      const syncButton = screen.getByText(/Subir Datos/i);
      
      await act(async () => {
        fireEvent.click(syncButton);
      });

      await waitFor(() => {
        expect(toast.default.error).toHaveBeenCalledWith('Error al sincronizar datos');
      });
    });
  });

  describe('syncFromCloud', () => {
    it('debe descargar datos desde la nube y limpiar tablas locales', async () => {
      const { confirmAsync } = await import('@/lib/confirm');
      (confirmAsync as any).mockResolvedValue(true); // Usuario confirma

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            productosBase: [{ id: '1', nombre: 'Test' }],
            variantes: [{ id: '1', codigoBarras: '123' }],
            reposicion: [{ id: '1', cantidad: 10 }],
            vencimientos: [{ id: '1', lote: 'A1' }],
          },
        }),
      });

      // Mock successful fetch for stats
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          pagination: {
            total: {
              productosBase: 1,
              variantes: 1,
              reposicion: 1,
              vencimientos: 1,
            },
          },
          timestamp: new Date().toISOString(),
        }),
      });

      // Mock transaction to execute callback
      mockDbService.transaction.mockImplementation(async (_mode, _tables, callback) => {
        return await callback();
      });
      
      mockDbService.clearProductosBase.mockResolvedValue(undefined);
      mockDbService.clearVariantes.mockResolvedValue(undefined);
      mockDbService.clearItemsReposicion.mockResolvedValue(undefined);
      mockDbService.clearItemsVencimiento.mockResolvedValue(undefined);
      mockDbService.bulkPutProductosBase.mockResolvedValue(undefined);
      mockDbService.bulkPutVariantes.mockResolvedValue(undefined);
      mockDbService.bulkPutItemsReposicion.mockResolvedValue(undefined);
      mockDbService.bulkPutItemsVencimiento.mockResolvedValue(undefined);

      render(<SyncPanel />);
      
      const downloadButton = screen.getByText(/Descargar Datos/i);
      
      await act(async () => {
        fireEvent.click(downloadButton);
      });

      await waitFor(() => {
        expect(mockDbService.transaction).toHaveBeenCalled();
        expect(mockDbService.clearProductosBase).toHaveBeenCalled();
        expect(mockDbService.clearVariantes).toHaveBeenCalled();
        expect(mockDbService.clearItemsReposicion).toHaveBeenCalled();
        expect(mockDbService.clearItemsVencimiento).toHaveBeenCalled();
      });

      expect(mockDbService.bulkPutProductosBase).toHaveBeenCalledWith([{ id: '1', nombre: 'Test' }]);
      expect(mockDbService.bulkPutVariantes).toHaveBeenCalledWith([{ id: '1', codigoBarras: '123' }]);
    });

    it('NO debe descargar datos si el usuario cancela', async () => {
      const { confirmAsync } = await import('@/lib/confirm');
      (confirmAsync as any).mockResolvedValue(false); // Usuario cancela

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { productosBase: [], variantes: [], reposicion: [], vencimientos: [] },
        }),
      });

      render(<SyncPanel />);
      
      const downloadButton = screen.getByText(/Descargar Datos/i);
      
      await act(async () => {
        fireEvent.click(downloadButton);
      });

      await waitFor(() => {
        expect(confirmAsync).toHaveBeenCalled();
      });

      // No debe llamar a clear ni bulkPut
      expect(mockDbService.clearProductosBase).not.toHaveBeenCalled();
      expect(mockDbService.bulkPutProductosBase).not.toHaveBeenCalled();
    });

    it('debe manejar errores al descargar desde la nube', async () => {
      const { confirmAsync } = await import('@/lib/confirm');
      (confirmAsync as any).mockResolvedValue(true);

      // Mock transaction to execute callback and propagate error
      mockDbService.transaction.mockImplementation(async (_mode, _tables, callback) => {
        return await callback();
      });
      
      mockDbService.clearProductosBase.mockRejectedValue(new Error('Clear failed'));

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { productosBase: [{ id: '1' }], variantes: [], reposicion: [], vencimientos: [] },
        }),
      });

      const toast = await import('react-hot-toast');
      
      render(<SyncPanel />);
      
      const downloadButton = screen.getByText(/Descargar Datos/i);
      
      await act(async () => {
        fireEvent.click(downloadButton);
      });

      await waitFor(() => {
        expect(toast.default.error).toHaveBeenCalledWith('Error al descargar datos');
      });
    });
  });

  it('debe mostrar loading state durante sincronización', async () => {
    // Mock de fetch que tarda
    let resolvePromise: any;
    const slowPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    (global.fetch as any).mockImplementation(() => slowPromise);

    mockDbService.getProductosBase.mockResolvedValue([]);
    mockDbService.getVariantes.mockResolvedValue([]);
    mockDbService.getItemsReposicion.mockResolvedValue([]);
    mockDbService.getItemsVencimiento.mockResolvedValue([]);

    render(<SyncPanel />);
    
    const syncButton = screen.getByText(/Subir Datos/i);
    
    act(() => {
      fireEvent.click(syncButton);
    });

    // Verificar que muestra "Sincronizando" durante la operación
    await waitFor(() => {
      expect(screen.getByText(/Sincronizando/i)).toBeInTheDocument();
    });

    // Resolver la promesa
    act(() => {
      resolvePromise({
        json: async () => ({ success: true, results: { inserted: {}, updated: {}, errors: [] } })
      });
    });
  });
});
