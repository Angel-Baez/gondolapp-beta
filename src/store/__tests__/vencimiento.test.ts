import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVencimientoStore } from '../vencimiento';
import { dbService } from '@/lib/db';
import { ItemVencimiento, ProductoVariante } from '@/types';
import * as utils from '@/lib/utils';

// Mock dbService
vi.mock('@/lib/db', () => ({
  dbService: {
    getItemsVencimiento: vi.fn(),
    addItemVencimiento: vi.fn(),
    updateItemVencimiento: vi.fn(),
    deleteItemVencimiento: vi.fn(),
    getItemVencimientoById: vi.fn(),
    getVarianteById: vi.fn(),
    getAllItemsVencimiento: vi.fn(),
  },
}));

// Mock utils
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils');
  return {
    ...actual,
    generarUUID: vi.fn(() => 'test-uuid-123'),
    calcularNivelAlerta: vi.fn(() => 'normal'),
  };
});

describe('vencimiento store (refactorizado con dbService)', () => {
  const mockItem: ItemVencimiento = {
    id: 'item-123',
    varianteId: 'var-123',
    fechaVencimiento: new Date('2025-12-31'),
    cantidad: 10,
    lote: 'L001',
    agregadoAt: new Date(),
    alertaNivel: 'normal',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useVencimientoStore.setState({ items: [], loading: false, error: null });
  });

  describe('cargarItems', () => {
    it('debe cargar items ordenados por fecha de vencimiento', async () => {
      vi.mocked(dbService.getItemsVencimiento).mockResolvedValueOnce([mockItem]);

      const { cargarItems } = useVencimientoStore.getState();
      await cargarItems();

      const state = useVencimientoStore.getState();
      expect(state.items).toEqual([mockItem]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(dbService.getItemsVencimiento).toHaveBeenCalledWith({
        orderBy: 'fechaVencimiento',
      });
    });

    it('debe manejar errores al cargar', async () => {
      vi.mocked(dbService.getItemsVencimiento).mockRejectedValueOnce(
        new Error('DB Error')
      );

      const { cargarItems } = useVencimientoStore.getState();
      await cargarItems();

      const state = useVencimientoStore.getState();
      expect(state.error).toBe('Error al cargar items de vencimiento');
      expect(state.loading).toBe(false);
    });
  });

  describe('agregarItem', () => {
    it('debe agregar item con nivel de alerta calculado', async () => {
      vi.mocked(dbService.addItemVencimiento).mockResolvedValueOnce('new-item-id');
      vi.mocked(dbService.getItemsVencimiento).mockResolvedValueOnce([mockItem]);
      vi.mocked(utils.calcularNivelAlerta).mockReturnValueOnce('advertencia');

      const { agregarItem } = useVencimientoStore.getState();
      await agregarItem('var-123', new Date('2025-12-31'), 10, 'L001');

      expect(utils.calcularNivelAlerta).toHaveBeenCalledWith(new Date('2025-12-31'));
      expect(dbService.addItemVencimiento).toHaveBeenCalledWith(
        expect.objectContaining({
          varianteId: 'var-123',
          fechaVencimiento: new Date('2025-12-31'),
          cantidad: 10,
          lote: 'L001',
          alertaNivel: 'advertencia',
        })
      );
      expect(dbService.getItemsVencimiento).toHaveBeenCalled();
    });
  });

  describe('actualizarFecha', () => {
    it('debe actualizar fecha y recalcular alerta', async () => {
      vi.mocked(dbService.updateItemVencimiento).mockResolvedValueOnce(1);
      vi.mocked(dbService.getItemsVencimiento).mockResolvedValueOnce([mockItem]);
      vi.mocked(utils.calcularNivelAlerta).mockReturnValueOnce('critico');

      const { actualizarFecha } = useVencimientoStore.getState();
      await actualizarFecha('item-123', new Date('2025-01-15'));

      expect(utils.calcularNivelAlerta).toHaveBeenCalledWith(new Date('2025-01-15'));
      expect(dbService.updateItemVencimiento).toHaveBeenCalledWith('item-123', {
        fechaVencimiento: new Date('2025-01-15'),
        alertaNivel: 'critico',
      });
    });
  });

  describe('eliminarItem', () => {
    it('debe eliminar item', async () => {
      vi.mocked(dbService.deleteItemVencimiento).mockResolvedValueOnce();
      vi.mocked(dbService.getItemsVencimiento).mockResolvedValueOnce([]);

      const { eliminarItem } = useVencimientoStore.getState();
      await eliminarItem('item-123');

      expect(dbService.deleteItemVencimiento).toHaveBeenCalledWith('item-123');
      expect(dbService.getItemsVencimiento).toHaveBeenCalled();
    });
  });

  describe('recalcularAlertas', () => {
    it('debe recalcular todas las alertas', async () => {
      const items = [
        { ...mockItem, id: 'item-1', alertaNivel: 'normal' as const },
        { ...mockItem, id: 'item-2', alertaNivel: 'normal' as const },
      ];

      vi.mocked(dbService.getAllItemsVencimiento).mockResolvedValueOnce(items);
      vi.mocked(utils.calcularNivelAlerta)
        .mockReturnValueOnce('critico')
        .mockReturnValueOnce('advertencia');
      vi.mocked(dbService.updateItemVencimiento).mockResolvedValue(1);
      vi.mocked(dbService.getItemsVencimiento).mockResolvedValueOnce(items);

      const { recalcularAlertas } = useVencimientoStore.getState();
      await recalcularAlertas();

      expect(dbService.getAllItemsVencimiento).toHaveBeenCalled();
      expect(dbService.updateItemVencimiento).toHaveBeenCalledTimes(2);
      expect(dbService.updateItemVencimiento).toHaveBeenCalledWith('item-1', {
        alertaNivel: 'critico',
      });
      expect(dbService.updateItemVencimiento).toHaveBeenCalledWith('item-2', {
        alertaNivel: 'advertencia',
      });
    });
  });
});
