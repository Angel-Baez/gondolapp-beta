import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VencimientoList } from '../VencimientoList';
import { ItemVencimiento } from '@/types';

// Mock de store
const mockVencimientoStore = {
  items: [] as ItemVencimiento[],
  cargarItems: vi.fn(),
  actualizarFecha: vi.fn(),
  recalcularAlertas: vi.fn(),
};

// Mock de dbService import
vi.mock('@/lib/db', () => ({
  dbService: {
    getVarianteById: vi.fn(),
  },
}));

// Mock de store
vi.mock('@/store/vencimiento', () => ({
  useVencimientoStore: () => mockVencimientoStore,
}));

describe('VencimientoList', () => {
  let mockDbService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockVencimientoStore.items = [];
    mockVencimientoStore.cargarItems = vi.fn();
    mockVencimientoStore.actualizarFecha = vi.fn();
    mockVencimientoStore.recalcularAlertas = vi.fn();
    
    // Get the mocked dbService
    const dbModule = await import('@/lib/db');
    mockDbService = dbModule.dbService;
  });

  it('debe mostrar mensaje cuando no hay items', () => {
    render(<VencimientoList />);
    
    expect(screen.getByText(/No hay productos con vencimiento registrado/i)).toBeInTheDocument();
  });

  it('debe cargar variantes usando dbService', async () => {
    const mockVariante = {
      id: 'var-1',
      productoBaseId: 'base-1',
      codigoBarras: '123',
      nombreCompleto: 'Coca Cola 2L',
      createdAt: new Date(),
    };

    mockDbService.getVarianteById.mockResolvedValue(mockVariante);

    // Set items in store
    mockVencimientoStore.items = [
      {
        id: '1',
        varianteId: 'var-1',
        fechaVencimiento: new Date('2025-01-01'),
        alertaNivel: 'normal',
        agregadoAt: new Date(),
      },
    ];

    render(<VencimientoList />);

    await waitFor(() => {
      expect(mockDbService.getVarianteById).toHaveBeenCalledWith('var-1');
    });
  });

  it('debe manejar variantes no encontradas', async () => {
    mockDbService.getVarianteById.mockResolvedValue(null);

    // Set items in store
    mockVencimientoStore.items = [
      {
        id: '1',
        varianteId: 'var-invalid',
        fechaVencimiento: new Date('2025-01-01'),
        alertaNivel: 'normal',
        agregadoAt: new Date(),
      },
    ];

    render(<VencimientoList />);

    await waitFor(() => {
      expect(mockDbService.getVarianteById).toHaveBeenCalled();
    });

    // El componente debería mostrar "1 producto" porque el store tiene 1 item
    // aunque el producto no tenga variante cargada
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/producto/i)).toBeInTheDocument();
  });

  it('debe agrupar items por nivel de alerta', async () => {
    const mockVariante = {
      id: 'var-1',
      productoBaseId: 'base-1',
      codigoBarras: '123',
      nombreCompleto: 'Coca Cola 2L',
      createdAt: new Date(),
    };

    mockDbService.getVarianteById.mockResolvedValue(mockVariante);

    // Set items in store with critical alert
    mockVencimientoStore.items = [
      {
        id: '1',
        varianteId: 'var-1',
        fechaVencimiento: new Date('2025-01-01'),
        alertaNivel: 'critico',
        agregadoAt: new Date(),
      },
    ];

    render(<VencimientoList />);

    await waitFor(() => {
      expect(screen.getByText(/Críticos/i)).toBeInTheDocument();
    });
  });
});
