import { useProductService } from "@/hooks/useProductService";
import { ProductoCompleto } from "@/services/productos";

/**
 * Hook para manejar el escaneo de productos
 * 
 * ✅ REFACTORIZADO: Ahora usa useProductService (SOLID)
 * ✅ Elimina duplicación de lógica de estado
 * ✅ Mantiene compatibilidad con componentes existentes
 * 
 * @deprecated Considerar usar useProductService directamente
 * Este hook se mantiene por compatibilidad pero puede ser eliminado
 * en versiones futuras si no agrega valor adicional.
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
