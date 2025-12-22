import { useProductService } from "@/hooks/useProductService";
import { ProductoCompleto } from "@/services/productos";

/**
 * Hook para manejar el escaneo de productos
 * 
 * ✅ REFACTORIZADO: Ahora usa useProductService (SOLID)
 * ✅ Elimina duplicación de lógica de estado
 * ✅ Mantiene compatibilidad con componentes existentes
 * 
 * @deprecated Migrar a useProductService directamente en v2.0
 * 
 * Ruta de migración:
 * ```ts
 * // Antes:
 * const { scanProduct, loading, error } = useScanProduct();
 * 
 * // Después (v2.0):
 * const { scanProduct, loading, error } = useProductService();
 * ```
 * 
 * Este hook se mantiene temporalmente para:
 * - Compatibilidad con código existente (ScanWorkflow.tsx)
 * - Logging específico de escaneo (útil para debugging)
 * - Permitir migración gradual sin breaking changes
 * 
 * Timeline:
 * - v1.x: Hook disponible pero marcado como deprecated
 * - v2.0: Hook será eliminado, usar useProductService directamente
 */
export function useScanProduct() {
  const { scanProduct, loading, error, clearError } = useProductService();

  // Wrapper que mantiene la misma API para componentes existentes
  const scanProductWrapper = async (barcode: string): Promise<{
    success: boolean;
    producto?: ProductoCompleto;
    error?: unknown;
  }> => {
    console.log("🔍 Buscando producto con código:", barcode);
    
    const result = await scanProduct(barcode);
    
    if (result.success) {
      console.log("✅ Producto obtenido:", result.producto);
    } else {
      console.error("❌ Error al procesar código:", result.error);
    }
    
    return result;
  };

  return {
    scanProduct: scanProductWrapper,
    loading,
    error,
    clearError,
  };
}
