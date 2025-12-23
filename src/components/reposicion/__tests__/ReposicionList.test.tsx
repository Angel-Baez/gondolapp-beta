import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReposicionList } from '../ReposicionList';

// Mock de store
const mockReposicionStore = {
  items: [],
  cargarItems: vi.fn(),
  guardarListaActual: vi.fn(),
};

// Mock de dbService import
vi.mock('@/lib/db', () => ({
  dbService: {
    getVarianteById: vi.fn(),
    getProductoBaseById: vi.fn(),
  },
}));

// Mock de store
vi.mock('@/store/reposicion', () => ({
  useReposicionStore: () => mockReposicionStore,
}));

describe('ReposicionList', () => {
  let mockDbService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockReposicionStore.items = [];
    mockReposicionStore.cargarItems = vi.fn();
    mockReposicionStore.guardarListaActual = vi.fn();
    
    // Get the mocked dbService
    const dbModule = await import('@/lib/db');
    mockDbService = dbModule.dbService;
  });

  it('debe mostrar mensaje cuando no hay items', () => {
    render(<ReposicionList />);
    
    expect(screen.getByText(/Tu lista está vacía/i)).toBeInTheDocument();
  });

  it('debe cargar variante + base usando dbService', async () => {
    const mockVariante = {
      id: 'var-1',
      productoBaseId: 'base-1',
      codigoBarras: '123',
      nombreCompleto: 'Coca Cola 2L',
      createdAt: new Date(),
    };

    const mockBase = {
      id: 'base-1',
      nombre: 'Coca Cola',
      marca: 'Coca-Cola',
      categoria: 'Bebidas',
      createdAt: new Date(),
    };

    mockDbService.getVarianteById.mockResolvedValue(mockVariante);
    mockDbService.getProductoBaseById.mockResolvedValue(mockBase);

    // Set items in store
    mockReposicionStore.items = [
      {
        id: '1',
        varianteId: 'var-1',
        cantidad: 5,
        repuesto: false,
        sinStock: false,
        agregadoAt: new Date(),
        actualizadoAt: new Date(),
      },
    ];

    render(<ReposicionList />);

    await waitFor(() => {
      expect(mockDbService.getVarianteById).toHaveBeenCalledWith('var-1');
      expect(mockDbService.getProductoBaseById).toHaveBeenCalledWith('base-1');
    });
  });

  it('debe manejar variante no encontrada', async () => {
    mockDbService.getVarianteById.mockResolvedValue(null);

    // Set items in store
    mockReposicionStore.items = [
      {
        id: '1',
        varianteId: 'var-invalid',
        cantidad: 5,
        repuesto: false,
        sinStock: false,
        agregadoAt: new Date(),
        actualizadoAt: new Date(),
      },
    ];

    render(<ReposicionList />);

    await waitFor(() => {
      expect(mockDbService.getVarianteById).toHaveBeenCalled();
    });

    // Debe mostrar mensaje de lista vacía (filtró el null)
    expect(screen.getByText(/Tu lista está vacía/i)).toBeInTheDocument();
  });

  it('debe agrupar items por sección (pendiente, repuesto, sinStock)', async () => {
    const mockVariante = {
      id: 'var-1',
      productoBaseId: 'base-1',
      codigoBarras: '123',
      nombreCompleto: 'Coca Cola 2L',
      createdAt: new Date(),
    };

    const mockBase = {
      id: 'base-1',
      nombre: 'Coca Cola',
      marca: 'Coca-Cola',
      categoria: 'Bebidas',
      createdAt: new Date(),
    };

    mockDbService.getVarianteById.mockResolvedValue(mockVariante);
    mockDbService.getProductoBaseById.mockResolvedValue(mockBase);

    // Set items in store with different sections
    mockReposicionStore.items = [
      {
        id: '1',
        varianteId: 'var-1',
        cantidad: 5,
        repuesto: false,
        sinStock: false,
        agregadoAt: new Date(),
        actualizadoAt: new Date(),
      },
    ];

    render(<ReposicionList />);

    await waitFor(() => {
      expect(screen.getByText(/Pendientes/i)).toBeInTheDocument();
    });
  });
});
