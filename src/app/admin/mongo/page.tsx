"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Database, Plus, Barcode, AlertTriangle, BarChart3, Download } from "lucide-react";
import { Button, Header } from "@/components/ui";
import { ProductSearchPanel } from "@/components/MongoAdmin/ProductSearchPanel";
import { ProductList } from "@/components/MongoAdmin/ProductList";
import { ProductEditor } from "@/components/MongoAdmin/ProductEditor";
import { ProductCreator } from "@/components/MongoAdmin/ProductCreator";
import { VariantEditor } from "@/components/MongoAdmin/VariantEditor";
import { VariantCreator } from "@/components/MongoAdmin/VariantCreator";
import { VariantReassigner } from "@/components/MongoAdmin/VariantReassigner";
import { ProductMerger } from "@/components/MongoAdmin/ProductMerger";
import { DocumentViewer } from "@/components/MongoAdmin/DocumentViewer";
import { ExportPanel } from "@/components/MongoAdmin/ExportPanel";
import { ProductoBase, ProductoVariante } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";

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

  // Modales de edición
  const [selectedProduct, setSelectedProduct] = useState<ProductoBase | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductoVariante | null>(null);
  const [variantToReassign, setVariantToReassign] = useState<ProductoVariante | null>(null);
  const [productToMerge, setProductToMerge] = useState<ProductoBase | null>(null);

  // Modales de creación (P0)
  const [showProductCreator, setShowProductCreator] = useState(false);
  const [productForNewVariant, setProductForNewVariant] = useState<ProductoBase | null>(null);

  // Modales P2 (herramientas avanzadas)
  const [documentToView, setDocumentToView] = useState<Record<string, any> | null>(null);
  const [showExport, setShowExport] = useState(false);

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

        // Mostrar notificación si se encontró por EAN u ObjectId
        if (data.searchType === "ean" && data.matchedEan) {
          toast.success(`Producto encontrado por EAN: ${data.matchedEan}`, { duration: 2000 });
        } else if (data.searchType === "objectId" && data.total === 1) {
          toast.success("Producto encontrado por ObjectId", { duration: 2000 });
        }
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

  /**
   * Callback después de crear un producto
   */
  const handleProductCreated = async () => {
    await searchProducts(filters, page);
  };

  /**
   * Callback después de crear una variante
   */
  const handleVariantCreated = async () => {
    try {
      // Recargar variantes del producto actual
      if (selectedProduct) {
        await handleSelectProduct(selectedProduct);
      }
      // Recargar lista para actualizar conteo de variantes
      await searchProducts(filters, page);
    } catch (error) {
      console.error("Error al actualizar después de crear variante:", error);
      toast.error("Error al actualizar la vista");
    }
  };

  /**
   * Abrir modal para crear nueva variante
   */
  const handleAddVariant = (producto: ProductoBase) => {
    setProductForNewVariant(producto);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg font-sans transition-colors">
      <div className="max-w-lg mx-auto bg-white dark:bg-dark-surface min-h-screen sm:rounded-3xl sm:my-4 shadow-2xl overflow-hidden flex flex-col transition-colors">
        <Header
          title="MongoDB Compass"
          subtitle="Administra productos y variantes"
          icon={Database}
          backHref="/admin"
          backText="Volver a Administración"
        />

        {/* Panel de búsqueda */}
        <div className="p-4 bg-gray-50 dark:bg-dark-bg border-b dark:border-dark-border transition-colors">
          <ProductSearchPanel
            onSearch={(searchFilters) => searchProducts(searchFilters, 1)}
          />
          
          {/* Acciones rápidas */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              onClick={() => setShowProductCreator(true)}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
            <Link href="/admin/mongo/variantes">
              <Button variant="outline" className="w-full">
                <Barcode className="w-4 h-4 mr-2" />
                Variantes
              </Button>
            </Link>
          </div>
          
          {/* Links a herramientas avanzadas */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link href="/admin/mongo/stats">
              <Button variant="outline" className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                Estadísticas
              </Button>
            </Link>
            <Link href="/admin/mongo/integrity">
              <Button variant="outline" className="w-full text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Integridad
              </Button>
            </Link>
          </div>
        </div>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-dark-bg transition-colors">
          {loading && productos.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p>Cargando productos...</p>
            </div>
          ) : productos.length > 0 ? (
            <>
              {/* Contador y acciones */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {productos.length} de {total} productos
                </p>
                <div className="flex gap-2">
                  {productos.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowExport(true)}
                      className="!py-1 !px-2"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  {selectedProduct && (
                    <Button
                      variant="outline"
                      onClick={() => setProductToMerge(selectedProduct)}
                    >
                      Fusionar Productos
                    </Button>
                  )}
                </div>
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
                  <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
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
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p className="font-medium">Busca productos para comenzar</p>
              <p className="text-sm mt-1">
                Usa el panel de búsqueda para encontrar y administrar productos
              </p>
              <p className="text-xs mt-3 text-gray-400">
                💡 Puedes buscar por nombre, código de barras (EAN) o ID de MongoDB
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Modal Crear Producto (P0) */}
      <ProductCreator
        isOpen={showProductCreator}
        onClose={() => setShowProductCreator(false)}
        onCreated={handleProductCreated}
      />

      {/* Modal Crear Variante (P0) */}
      {productForNewVariant && (
        <VariantCreator
          isOpen={true}
          producto={productForNewVariant}
          onClose={() => setProductForNewVariant(null)}
          onCreated={handleVariantCreated}
        />
      )}

      {/* Modales de edición */}
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
          onAddVariant={() => handleAddVariant(selectedProduct)}
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

      {/* Modal Vista JSON (P2) */}
      {documentToView && (
        <DocumentViewer
          isOpen={true}
          onClose={() => setDocumentToView(null)}
          document={documentToView}
          title="Documento JSON"
        />
      )}

      {/* Modal Exportar (P2) */}
      <ExportPanel
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={productos}
        filename="productos-gondolapp"
        title="Exportar Productos"
      />
    </div>
  );
}
