"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Database } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/MongoPage/Header";
import { ProductSearchPanel } from "@/components/MongoAdmin/ProductSearchPanel";
import { ProductList } from "@/components/MongoAdmin/ProductList";
import { ProductEditor } from "@/components/MongoAdmin/ProductEditor";
import { VariantEditor } from "@/components/MongoAdmin/VariantEditor";
import { VariantReassigner } from "@/components/MongoAdmin/VariantReassigner";
import { ProductMerger } from "@/components/MongoAdmin/ProductMerger";
import { ProductoBase, ProductoVariante } from "@/types";
import toast from "react-hot-toast";

/**
 * Página principal de administración MongoDB Compass
 * Single Responsibility: Orquesta los componentes de admin
 */
export default function MongoAdminPage() {
  // Estado de búsqueda y paginación
  const [productos, setProductos] = useState<(ProductoBase & { variantesCount: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filtros actuales
  const [filters, setFilters] = useState({ query: "", marca: "", categoria: "" });

  // Modales
  const [selectedProduct, setSelectedProduct] = useState<ProductoBase | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductoVariante | null>(null);
  const [variantToReassign, setVariantToReassign] = useState<ProductoVariante | null>(null);
  const [productToMerge, setProductToMerge] = useState<ProductoBase | null>(null);

  // Variantes del producto seleccionado
  const [variantes, setVariantes] = useState<ProductoVariante[]>([]);

  /**
   * Buscar productos con filtros y paginación
   */
  const searchProducts = useCallback(async (
    searchFilters: { query: string; marca: string; categoria: string },
    pageNum: number = 1
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchFilters.query,
        marca: searchFilters.marca,
        categoria: searchFilters.categoria,
        page: pageNum.toString(),
        limit: "20",
      });

      const response = await fetch(`/api/admin/productos?${params}`);
      const data = await response.json();

      if (data.success) {
        setProductos(data.productos);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setFilters(searchFilters);
      } else {
        toast.error("Error al buscar productos");
      }
    } catch (error) {
      console.error("Error al buscar productos:", error);
      toast.error("Error al buscar productos");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Seleccionar producto y cargar sus variantes
   */
  const handleSelectProduct = async (producto: ProductoBase) => {
    try {
      const response = await fetch(`/api/admin/productos/${producto.id}`);
      const data = await response.json();

      if (data.success) {
        setSelectedProduct(data.producto.base);
        setVariantes(data.producto.variantes);
      } else {
        toast.error("Error al cargar el producto");
      }
    } catch (error) {
      console.error("Error al cargar producto:", error);
      toast.error("Error al cargar el producto");
    }
  };

  /**
   * Guardar cambios en producto
   */
  const handleSaveProduct = async (data: Partial<ProductoBase>) => {
    if (!selectedProduct) return;

    const response = await fetch(`/api/admin/productos/${selectedProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    // Recargar la lista
    await searchProducts(filters, page);
  };

  /**
   * Eliminar producto
   */
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    const response = await fetch(`/api/admin/productos/${selectedProduct.id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    setSelectedProduct(null);
    await searchProducts(filters, page);
  };

  /**
   * Guardar cambios en variante
   */
  const handleSaveVariant = async (data: Partial<ProductoVariante>) => {
    if (!selectedVariant) return;

    const response = await fetch(`/api/admin/variantes/${selectedVariant.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    // Recargar variantes del producto
    if (selectedProduct) {
      await handleSelectProduct(selectedProduct);
    }
  };

  /**
   * Eliminar variante
   */
  const handleDeleteVariant = async (varianteId: string) => {
    const response = await fetch(`/api/admin/variantes/${varianteId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    // Recargar variantes del producto
    if (selectedProduct) {
      await handleSelectProduct(selectedProduct);
    }
  };

  /**
   * Reasignar variante a otro producto
   */
  const handleReassignVariant = async (nuevoProductoBaseId: string) => {
    if (!variantToReassign) return;

    const response = await fetch("/api/admin/variantes/reassign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        varianteId: variantToReassign.id,
        nuevoProductoBaseId,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    setVariantToReassign(null);

    // Recargar variantes del producto
    if (selectedProduct) {
      await handleSelectProduct(selectedProduct);
    }

    // Recargar lista de productos
    await searchProducts(filters, page);
  };

  /**
   * Callback después de fusionar productos
   */
  const handleMergeComplete = async () => {
    setProductToMerge(null);
    setSelectedProduct(null);
    await searchProducts(filters, page);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-lg mx-auto bg-white min-h-screen sm:rounded-3xl sm:my-4 shadow-2xl overflow-hidden flex flex-col">
        <Header />

        {/* Panel de búsqueda */}
        <div className="p-4 bg-gray-50 border-b">
          <ProductSearchPanel
            onSearch={(searchFilters) => searchProducts(searchFilters, 1)}
          />
        </div>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loading && productos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p>Cargando productos...</p>
            </div>
          ) : productos.length > 0 ? (
            <>
              {/* Contador y acciones */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Mostrando {productos.length} de {total} productos
                </p>
                {selectedProduct && (
                  <Button
                    variant="outline"
                    onClick={() => setProductToMerge(selectedProduct)}
                  >
                    Fusionar Productos
                  </Button>
                )}
              </div>

              {/* Lista de productos */}
              <ProductList
                productos={productos}
                onSelectProduct={handleSelectProduct}
              />

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => searchProducts(filters, page - 1)}
                    disabled={page === 1 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 px-4">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => searchProducts(filters, page + 1)}
                    disabled={page === totalPages || loading}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">Busca productos para comenzar</p>
              <p className="text-sm mt-1">
                Usa el panel de búsqueda para encontrar y administrar productos
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Modales */}
      {selectedProduct && (
        <ProductEditor
          isOpen={true}
          producto={selectedProduct}
          variantes={variantes}
          onClose={() => {
            setSelectedProduct(null);
            setVariantes([]);
          }}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
          onVariantClick={setSelectedVariant}
          onReassignVariant={setVariantToReassign}
          onDeleteVariant={handleDeleteVariant}
        />
      )}

      {selectedVariant && (
        <VariantEditor
          isOpen={true}
          variante={selectedVariant}
          onClose={() => setSelectedVariant(null)}
          onSave={handleSaveVariant}
        />
      )}

      {variantToReassign && selectedProduct && (
        <VariantReassigner
          isOpen={true}
          variante={variantToReassign}
          currentProduct={selectedProduct}
          onClose={() => setVariantToReassign(null)}
          onReassign={handleReassignVariant}
        />
      )}

      {productToMerge && (
        <ProductMerger
          isOpen={true}
          targetProduct={productToMerge}
          onClose={() => setProductToMerge(null)}
          onMerge={handleMergeComplete}
        />
      )}
    </div>
  );
}
