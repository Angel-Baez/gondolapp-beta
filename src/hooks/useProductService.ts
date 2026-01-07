import { useState, useCallback, useMemo } from "react";
import { getProductService } from "@/core/container/serviceConfig";
import { ProductoBase, ProductoVariante, ProductoCompleto } from "@/types";

/**
 * Hook SOLID para interactuar con ProductService
 * 
 * ✅ Ventajas sobre obtenerOCrearProducto:
 * - Estado de carga integrado
 * - Manejo de errores unificado
 * - Tipado fuerte
 * - Testeable sin dependencias externas
 * 
 * @example
 * ```tsx
 * const { scanProduct, loading, error } = useProductService();
 * 
 * const handleScan = async (barcode: string) => {
 *   const result = await scanProduct(barcode);
 *   if (result.success) {
 *     console.log('Producto:', result.producto);
 *   }
 * };
 * ```
 */
export function useProductService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Singleton service instance (memoizado)
  const service = useMemo(() => getProductService(), []);

  /**
   * Escanea un código de barras y obtiene/crea el producto
   */
  const scanProduct = useCallback(
    async (barcode: string): Promise<{
      success: boolean;
      producto?: ProductoCompleto;
      error?: string;
    }> => {
      setLoading(true);
      setError(null);

      try {
        const producto = await service.getOrCreateProduct(barcode);

        if (!producto) {
          const errorMsg = `Producto con código ${barcode} no encontrado.`;
          setError(errorMsg);
          setLoading(false);
          return { success: false, error: errorMsg };
        }

        setLoading(false);
        return { success: true, producto };
      } catch (err: any) {
        const errorMsg = err.message || "Error al buscar producto";
        setError(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }
    },
    [service]
  );

  /**
   * Obtiene un producto por ID de variante
   */
  const getProductById = useCallback(
    async (variantId: string): Promise<ProductoCompleto | null> => {
      setLoading(true);
      setError(null);

      try {
        const producto = await service.getProductById(variantId);
        setLoading(false);
        return producto;
      } catch (err: any) {
        setError(err.message || "Error al obtener producto");
        setLoading(false);
        return null;
      }
    },
    [service]
  );

  /**
   * Busca productos base por término
   */
  const searchProducts = useCallback(
    async (term: string): Promise<ProductoBase[]> => {
      setLoading(true);
      setError(null);

      try {
        const productos = await service.searchProducts(term);
        setLoading(false);
        return productos;
      } catch (err: any) {
        setError(err.message || "Error al buscar productos");
        setLoading(false);
        return [];
      }
    },
    [service]
  );

  /**
   * Obtiene variantes de un producto base
   */
  const getVariants = useCallback(
    async (baseId: string): Promise<ProductoVariante[]> => {
      setLoading(true);
      setError(null);

      try {
        const variantes = await service.getVariants(baseId);
        setLoading(false);
        return variantes;
      } catch (err: any) {
        setError(err.message || "Error al obtener variantes");
        setLoading(false);
        return [];
      }
    },
    [service]
  );

  /**
   * Crea un producto manualmente
   */
  const createManualProduct = useCallback(
    async (
      barcode: string,
      data: {
        nombreBase: string;
        marca?: string;
        nombreVariante?: string;
        tipo?: string;
        tamano?: string;
        sabor?: string;
      }
    ): Promise<ProductoCompleto | null> => {
      setLoading(true);
      setError(null);

      try {
        const producto = await service.createManualProduct(barcode, data);
        setLoading(false);
        return producto;
      } catch (err: any) {
        setError(err.message || "Error al crear producto");
        setLoading(false);
        return null;
      }
    },
    [service]
  );

  /**
   * Limpia el estado de error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Métodos
    scanProduct,
    getProductById,
    searchProducts,
    getVariants,
    createManualProduct,
    clearError,
    
    // Estado
    loading,
    error,
  };
}

/**
 * Hook avanzado para obtener el ProductService sin gestión de estado.
 *
 * ⚠️ ATENCIÓN:
 * - No gestiona `loading` ni `error`.
 * - Úsalo solo en casos muy específicos donde controles tú mismo el estado.
 *
 * Para la mayoría de los casos, usa `useProductService`.
 * 
 * @example
 * ```tsx
 * // Solo para casos avanzados donde necesitas control total
 * const service = useRawProductService();
 * const resultado = await service.getOrCreateProduct(barcode);
 * ```
 */
export function useRawProductService() {
  const service = useMemo(() => getProductService(), []);
  return service;
}
