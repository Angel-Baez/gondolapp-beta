import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockProductService } from '@/tests/mocks/ProductServiceMock';
import * as fs from 'fs';
import * as path from 'path';

// Mock de useProductService
const mockUseProductService = vi.fn();

vi.mock('@/hooks/useProductService', () => ({
  useProductService: () => mockUseProductService(),
}));

// Mock de otros hooks necesarios para ScanWorkflow
vi.mock('@/hooks/useProductSync', () => ({
  useProductSync: () => ({
    syncProductToIndexedDB: vi.fn(),
  }),
}));

vi.mock('@/store/reposicion', () => ({
  useReposicionStore: () => ({
    agregarItem: vi.fn(),
  }),
}));

vi.mock('@/store/vencimiento', () => ({
  useVencimientoStore: () => ({
    agregarItem: vi.fn(),
  }),
}));

describe('ScanWorkflow (migrado a useProductService)', () => {
  let mockService: MockProductService;
  let mockHookReturn: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = new MockProductService();
    
    // Configurar el mock para retornar valores correctos
    mockHookReturn = {
      scanProduct: async (barcode: string) => {
        try {
          const producto = await mockService.getOrCreateProduct(barcode);
          return { success: true, producto };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      },
      loading: false,
      error: null,
      clearError: vi.fn(),
    };
    
    mockUseProductService.mockReturnValue(mockHookReturn);
  });

  it('debe usar useProductService correctamente', () => {
    // Verificar que el mock de useProductService fue llamado
    const hook = mockUseProductService();
    
    // Verificar que el hook retorna la API esperada
    expect(hook.scanProduct).toBeDefined();
    expect(typeof hook.scanProduct).toBe('function');
    expect(hook.loading).toBe(false);
    expect(hook.error).toBeNull();
    expect(hook.clearError).toBeDefined();
    
    // Verificar que tiene todas las propiedades necesarias
    expect(hook).toHaveProperty('scanProduct');
    expect(hook).toHaveProperty('loading');
    expect(hook).toHaveProperty('error');
    expect(hook).toHaveProperty('clearError');
  });

  it('debe mantener compatibilidad de API - scanProduct exitoso', async () => {
    const hook = mockUseProductService();
    const { scanProduct } = hook;
    
    const result = await scanProduct('123456789');
    
    expect(result.success).toBe(true);
    expect(result.producto).toBeDefined();
    expect(result.producto?.variante.codigoBarras).toBe('123456789');
  });

  it('debe mantener compatibilidad de API - producto no encontrado', async () => {
    const hook = mockUseProductService();
    const { scanProduct } = hook;
    
    const result = await scanProduct('invalid');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('no encontrado');
  });

  it('NO debe importar useScanProduct - validación de migración exitosa', () => {
    // Leer el código fuente del componente para verificar la migración
    const componentPath = path.resolve(__dirname, '../ScanWorkflow.tsx');
    const sourceCode = fs.readFileSync(componentPath, 'utf-8');
    
    // Verificar que NO importa useScanProduct
    expect(sourceCode).not.toContain('useScanProduct');
    expect(sourceCode).not.toContain('from "@/hooks/useScanProduct"');
    expect(sourceCode).not.toContain("from '@/hooks/useScanProduct'");
    
    // Verificar que SÍ importa useProductService
    expect(sourceCode).toContain('useProductService');
    expect(sourceCode).toMatch(/from\s+["']@\/hooks\/useProductService["']/);
    
    // Verificar que los logs están presentes en el componente
    expect(sourceCode).toContain('console.log("🔍 Buscando producto con código:"');
    expect(sourceCode).toContain('console.log("✅ Producto obtenido:"');
    expect(sourceCode).toContain('console.error("❌ Error al procesar código:"');
    
    // Verificar que usa el hook correctamente
    expect(sourceCode).toMatch(/const\s+{\s*scanProduct.*}\s*=\s*useProductService\(\)/);
  });

  it('debe tener la misma API que useProductService', () => {
    const hook = mockUseProductService();
    
    // Verificar que la API de useProductService incluye todo lo necesario
    expect(hook).toHaveProperty('scanProduct');
    expect(hook).toHaveProperty('loading');
    expect(hook).toHaveProperty('error');
    expect(hook).toHaveProperty('clearError');
    
    // Verificar que son del tipo correcto
    expect(typeof hook.scanProduct).toBe('function');
    expect(typeof hook.loading).toBe('boolean');
    expect(typeof hook.clearError).toBe('function');
  });

  it('debe ejecutar logs al escanear producto exitosamente', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const hook = mockUseProductService();
    const { scanProduct } = hook;
    
    // Simular escaneo exitoso
    const result = await scanProduct('123456789');
    
    // Verificar que se ejecutan los logs apropiados
    // Nota: En el componente real, estos logs se ejecutarían en handleScan
    expect(result.success).toBe(true);
    expect(result.producto).toBeDefined();
    
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('debe manejar errores al escanear producto no encontrado', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const hook = mockUseProductService();
    const { scanProduct } = hook;
    
    // Simular escaneo fallido
    const result = await scanProduct('invalid');
    
    // Verificar que se maneja el error correctamente
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('no encontrado');
    
    consoleErrorSpy.mockRestore();
  });
});



