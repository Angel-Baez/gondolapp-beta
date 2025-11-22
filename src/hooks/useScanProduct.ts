import { useState } from "react";
import { obtenerOCrearProducto } from "@/services/productos";
import { ProductoCompleto } from "@/services/productos";

/**
 * Hook personalizado para manejar la lógica de escaneo de productos
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de la lógica de escaneo
 * - DIP: Depende de abstracciones (obtenerOCrearProducto service)
 */
export function useScanProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanProduct = async (barcode: string): Promise<{
    success: boolean;
    producto?: ProductoCompleto;
    error?: unknown;
  }> => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Buscando producto con código:", barcode);
      const producto = await obtenerOCrearProducto(barcode);

      if (!producto) {
        const errorMsg = `Producto con código ${barcode} no encontrado. Regístralo manualmente.`;
        setError(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }

      console.log("✅ Producto obtenido:", producto);
      setLoading(false);
      return { success: true, producto };
    } catch (err) {
      console.error("❌ Error al procesar código:", err);
      const errorMsg = "Error de conexión al buscar el producto. Verifica tu internet e intenta de nuevo.";
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: err };
    }
  };

  const clearError = () => setError(null);

  return { scanProduct, loading, error, clearError };
}
