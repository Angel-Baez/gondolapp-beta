import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleQuotaExceeded,
  getDatabaseStats,
  clearAllData,
} from '../dbErrorHandler';

// Mock de toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock de dbService import
vi.mock('@/lib/db', () => ({
  dbService: {
    getItemsReposicion: vi.fn(),
    deleteItemReposicion: vi.fn(),
    getItemsVencimiento: vi.fn(),
    deleteItemVencimiento: vi.fn(),
    getListasHistorial: vi.fn(),
    deleteListaHistorial: vi.fn(),
    countProductosBase: vi.fn(),
    countVariantes: vi.fn(),
    countItemsReposicion: vi.fn(),
    countItemsVencimiento: vi.fn(),
    countListasHistorial: vi.fn(),
    clearProductosBase: vi.fn(),
    clearVariantes: vi.fn(),
    clearItemsReposicion: vi.fn(),
    clearItemsVencimiento: vi.fn(),
    clearListasHistorial: vi.fn(),
  },
}));

describe('dbErrorHandler (refactorizado con dbService)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleQuotaExceeded', () => {
    it('debe limpiar items antiguos usando dbService', async () => {
      const { dbService } = await import('@/lib/db');
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // Más de 90 días

      // Mock items antiguos
      vi.mocked(dbService.getItemsReposicion).mockResolvedValue([
        { id: '1', repuesto: true, agregadoAt: oldDate, actualizadoAt: null } as any,
        { id: '2', repuesto: false, agregadoAt: oldDate, actualizadoAt: null } as any,
      ]);

      vi.mocked(dbService.getItemsVencimiento).mockResolvedValue([
        { id: '3', fechaVencimiento: oldDate } as any,
      ]);

      vi.mocked(dbService.getListasHistorial).mockResolvedValue([
        { id: '4', fechaGuardado: oldDate } as any,
      ]);

      vi.mocked(dbService.deleteItemReposicion).mockResolvedValue(undefined);
      vi.mocked(dbService.deleteItemVencimiento).mockResolvedValue(undefined);
      vi.mocked(dbService.deleteListaHistorial).mockResolvedValue(undefined);

      const result = await handleQuotaExceeded();

      expect(result).toBe(true);
      expect(dbService.getItemsReposicion).toHaveBeenCalled();
      expect(dbService.deleteItemReposicion).toHaveBeenCalledWith('1');
      expect(dbService.deleteItemReposicion).not.toHaveBeenCalledWith('2'); // repuesto: false
      expect(dbService.deleteItemVencimiento).toHaveBeenCalledWith('3');
      expect(dbService.deleteListaHistorial).toHaveBeenCalledWith('4');
    });

    it('debe retornar false si no hay items antiguos', async () => {
      const { dbService } = await import('@/lib/db');
      
      vi.mocked(dbService.getItemsReposicion).mockResolvedValue([]);
      vi.mocked(dbService.getItemsVencimiento).mockResolvedValue([]);
      vi.mocked(dbService.getListasHistorial).mockResolvedValue([]);

      const result = await handleQuotaExceeded();

      expect(result).toBe(false);
      expect(dbService.deleteItemReposicion).not.toHaveBeenCalled();
      expect(dbService.deleteItemVencimiento).not.toHaveBeenCalled();
      expect(dbService.deleteListaHistorial).not.toHaveBeenCalled();
    });

    it('debe manejar errores durante cleanup', async () => {
      const { dbService } = await import('@/lib/db');
      
      vi.mocked(dbService.getItemsReposicion).mockRejectedValue(new Error('DB Error'));

      const result = await handleQuotaExceeded();

      expect(result).toBe(false);
    });
  });

  describe('getDatabaseStats', () => {
    it('debe obtener estadísticas usando dbService.count', async () => {
      const { dbService } = await import('@/lib/db');
      
      vi.mocked(dbService.countProductosBase).mockResolvedValue(10);
      vi.mocked(dbService.countVariantes).mockResolvedValue(25);
      vi.mocked(dbService.countItemsReposicion).mockResolvedValue(5);
      vi.mocked(dbService.countItemsVencimiento).mockResolvedValue(3);
      vi.mocked(dbService.countListasHistorial).mockResolvedValue(2);

      const stats = await getDatabaseStats();

      expect(stats).toEqual({
        productosBase: 10,
        productosVariantes: 25,
        itemsReposicion: 5,
        itemsVencimiento: 3,
        listasHistorial: 2,
        total: 45,
      });

      expect(dbService.countProductosBase).toHaveBeenCalled();
      expect(dbService.countVariantes).toHaveBeenCalled();
      expect(dbService.countItemsReposicion).toHaveBeenCalled();
      expect(dbService.countItemsVencimiento).toHaveBeenCalled();
      expect(dbService.countListasHistorial).toHaveBeenCalled();
    });
  });

  describe('clearAllData', () => {
    it('debe limpiar todas las tablas usando dbService', async () => {
      const { dbService } = await import('@/lib/db');
      
      vi.mocked(dbService.clearProductosBase).mockResolvedValue(undefined);
      vi.mocked(dbService.clearVariantes).mockResolvedValue(undefined);
      vi.mocked(dbService.clearItemsReposicion).mockResolvedValue(undefined);
      vi.mocked(dbService.clearItemsVencimiento).mockResolvedValue(undefined);
      vi.mocked(dbService.clearListasHistorial).mockResolvedValue(undefined);

      const result = await clearAllData();

      expect(result).toBe(true);
      expect(dbService.clearProductosBase).toHaveBeenCalled();
      expect(dbService.clearVariantes).toHaveBeenCalled();
      expect(dbService.clearItemsReposicion).toHaveBeenCalled();
      expect(dbService.clearItemsVencimiento).toHaveBeenCalled();
      expect(dbService.clearListasHistorial).toHaveBeenCalled();
    });

    it('debe manejar errores al limpiar', async () => {
      const { dbService } = await import('@/lib/db');
      
      vi.mocked(dbService.clearProductosBase).mockRejectedValue(new Error('Clear failed'));

      const result = await clearAllData();

      expect(result).toBe(false);
    });
  });
});
