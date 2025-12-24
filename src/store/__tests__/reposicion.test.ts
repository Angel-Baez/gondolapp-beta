import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReposicionStore } from '../reposicion';
import { dbService } from '@/lib/db';
import { ItemReposicion, ProductoVariante, ProductoBase } from '@/types';

// Mock dbService
vi.mock('@/lib/db', () => ({
  dbService: {
    getItemsReposicion: vi.fn(),
    getItemReposicionByVarianteId: vi.fn(),
    addItemReposicion: vi.fn(),
    updateItemReposicion: vi.fn(),
    deleteItemReposicion: vi.fn(),
    getItemReposicionById: vi.fn(),
    getVarianteById: vi.fn(),
    getProductoBaseById: vi.fn(),
    getAllItemsReposicion: vi.fn(),
    clearItemsReposicion: vi.fn(),
    addListaHistorial: vi.fn(),
    getListasHistorial: vi.fn(),
    getListasHistorialByDateRange: vi.fn(),
  },
}));

// Mock utils
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils');
  return {
    ...actual,
    generarUUID: vi.fn(() => 'test-uuid-123'),
  };
});

describe('reposicion store (refactorizado con dbService)', () => {
  const mockItem: ItemReposicion = {
    id: 'item-123',
    varianteId: 'var-123',
    cantidad: 5,
    repuesto: false,
    sinStock: false,
    agregadoAt: new Date('2025-01-01'),
    actualizadoAt: new Date('2025-01-01'),
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

  const mockBase: ProductoBase = {
    id: 'base-123',
    nombre: 'Coca-Cola',
    marca: 'Coca-Cola',
    categoria: 'Bebidas',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useReposicionStore.setState({ items: [], loading: false, error: null });
    // Reset console mocks
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('cargarItems', () => {
    it('debe cargar items ordenados', async () => {
      vi.mocked(dbService.getItemsReposicion).mockResolvedValueOnce([mockItem]);

      const { cargarItems } = useReposicionStore.getState();
      await cargarItems();

      const state = useReposicionStore.getState();
      expect(state.items).toEqual([mockItem]);
      expect(state.loading).toBe(false);
      expect(dbService.getItemsReposicion).toHaveBeenCalledWith({
        orderBy: 'agregadoAt',
        reverse: true,
      });
    });
  });

  describe('agregarItem', () => {
    it('debe agregar item nuevo', async () => {
      vi.mocked(dbService.getItemReposicionByVarianteId).mockResolvedValueOnce(undefined);
      vi.mocked(dbService.addItemReposicion).mockResolvedValueOnce('new-item-id');

      const { agregarItem } = useReposicionStore.getState();
      await agregarItem('var-123', 5);

      expect(dbService.getItemReposicionByVarianteId).toHaveBeenCalledWith('var-123', {
        repuesto: false,
        sinStock: false,
      });
      expect(dbService.addItemReposicion).toHaveBeenCalledWith(
        expect.objectContaining({
          varianteId: 'var-123',
          cantidad: 5,
          repuesto: false,
          sinStock: false,
        })
      );
    });

    it('debe incrementar cantidad si item existente (verificar filtro repuesto/sinStock)', async () => {
      const existente = { ...mockItem, cantidad: 3 };
      vi.mocked(dbService.getItemReposicionByVarianteId).mockResolvedValueOnce(existente);
      vi.mocked(dbService.updateItemReposicion).mockResolvedValueOnce(1);

      const { agregarItem } = useReposicionStore.getState();
      await agregarItem('var-123', 5);

      expect(dbService.getItemReposicionByVarianteId).toHaveBeenCalledWith('var-123', {
        repuesto: false,
        sinStock: false,
      });
      expect(dbService.updateItemReposicion).toHaveBeenCalledWith('item-123', {
        cantidad: 8, // 3 + 5
        actualizadoAt: expect.any(Date),
      });
    });
  });

  describe('actualizarEstado', () => {
    it('debe actualizar estado repuesto/sinStock', async () => {
      useReposicionStore.setState({ items: [mockItem] });
      vi.mocked(dbService.updateItemReposicion).mockResolvedValueOnce(1);

      const { marcarRepuesto } = useReposicionStore.getState();
      await marcarRepuesto('item-123', true);

      expect(dbService.updateItemReposicion).toHaveBeenCalledWith('item-123', {
        repuesto: true,
        actualizadoAt: expect.any(Date),
      });
    });
  });

  describe('guardarListaActual', () => {
    it('debe guardar lista actual al historial', async () => {
      const items = [
        mockItem,
        { ...mockItem, id: 'item-2', repuesto: true },
      ];

      vi.mocked(dbService.getAllItemsReposicion).mockResolvedValueOnce(items);
      vi.mocked(dbService.getVarianteById).mockResolvedValue(mockVariante);
      vi.mocked(dbService.getProductoBaseById).mockResolvedValue(mockBase);
      vi.mocked(dbService.addListaHistorial).mockResolvedValueOnce('lista-id');
      vi.mocked(dbService.clearItemsReposicion).mockResolvedValueOnce();

      const { guardarListaActual } = useReposicionStore.getState();
      await guardarListaActual();

      expect(dbService.getAllItemsReposicion).toHaveBeenCalled();
      expect(dbService.addListaHistorial).toHaveBeenCalledWith(
        expect.objectContaining({
          resumen: expect.objectContaining({
            totalProductos: 2,
            totalRepuestos: 1,
            totalPendientes: 1,
          }),
          items: expect.arrayContaining([
            expect.objectContaining({
              varianteId: 'var-123',
              productoNombre: 'Coca-Cola',
            }),
          ]),
        })
      );
      expect(dbService.clearItemsReposicion).toHaveBeenCalled();
    });
  });

  describe('obtenerEstadisticas', () => {
    it('debe obtener estadísticas por periodo', async () => {
      const mockListas = [
        {
          id: 'lista-1',
          fechaCreacion: new Date('2024-12-01'),
          fechaGuardado: new Date('2024-12-01'),
          resumen: {
            totalProductos: 10,
            totalRepuestos: 8,
            totalSinStock: 1,
            totalPendientes: 1,
          },
          items: [
            {
              varianteId: 'var-1',
              productoNombre: 'Coca-Cola',
              productoMarca: 'Coca-Cola',
              varianteNombre: 'Coca-Cola 2L',
              cantidad: 5,
              estado: 'repuesto' as const,
            },
          ],
          metadata: {},
        },
      ];

      vi.mocked(dbService.getListasHistorialByDateRange).mockResolvedValueOnce(mockListas);

      const { obtenerEstadisticas } = useReposicionStore.getState();
      const stats = await obtenerEstadisticas('semana');

      expect(stats.totalListas).toBe(1);
      expect(stats.totalProductosRepuestos).toBe(8);
      expect(stats.totalProductosSinStock).toBe(1);
      expect(dbService.getListasHistorialByDateRange).toHaveBeenCalled();
    });
  });

  describe('optimistic updates', () => {
    it('debe mantener optimistic updates en actualizarCantidad', async () => {
      useReposicionStore.setState({ items: [mockItem] });
      vi.mocked(dbService.updateItemReposicion).mockResolvedValueOnce(1);

      const { actualizarCantidad } = useReposicionStore.getState();
      
      // La actualización debe ser inmediata (optimistic)
      const promiseUpdate = actualizarCantidad('item-123', 10);
      
      // El estado debe actualizarse inmediatamente
      const stateAfterCall = useReposicionStore.getState();
      expect(stateAfterCall.items[0].cantidad).toBe(10);
      
      await promiseUpdate;
      
      expect(dbService.updateItemReposicion).toHaveBeenCalledWith('item-123', {
        cantidad: 10,
        actualizadoAt: expect.any(Date),
      });
    });
  });
});
