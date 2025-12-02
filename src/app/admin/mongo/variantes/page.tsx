"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Barcode, ArrowLeft, Search, AlertTriangle, Copy } from "lucide-react";
import { Button, Header } from "@/components/ui";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ProductoVariante, ProductoBase } from "@/types";
import { VariantEditor } from "@/components/MongoAdmin/VariantEditor";
import toast from "react-hot-toast";
import Link from "next/link";

interface VarianteConProducto extends ProductoVariante {
  productoNombre?: string;
  productoMarca?: string;
}

/**
 * Página de gestión independiente de variantes
 * US-105: Panel de variantes independiente
 */
export default function VariantesAdminPage() {
  // Estado de búsqueda
  const [query, setQuery] = useState("");
  const [variantes, setVariantes] = useState<VarianteConProducto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal de edición
  const [selectedVariant, setSelectedVariant] = useState<ProductoVariante | null>(null);

  /**
   * Buscar variantes
   */
  const searchVariantes = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: pageNum.toString(),
        limit: "20",
      });

      const response = await fetch(`/api/admin/variantes/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setVariantes(data.variantes);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else {
        toast.error("Error al buscar variantes");
      }
    } catch (error) {
      console.error("Error al buscar variantes:", error);
      toast.error("Error al buscar variantes");
    } finally {
      setLoading(false);
    }
  }, []);

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

    // Recargar lista
    await searchVariantes(query, page);
  };

  /**
   * Copiar EAN al portapapeles
   */
  const copyEan = (ean: string) => {
    navigator.clipboard.writeText(ean);
    toast.success("EAN copiado al portapapeles");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg font-sans transition-colors">
      <div className="max-w-lg mx-auto bg-white dark:bg-dark-surface min-h-screen sm:rounded-3xl sm:my-4 shadow-2xl overflow-hidden flex flex-col transition-colors">
        <Header
          title="Variantes"
          subtitle="Búsqueda independiente de SKUs"
          icon={Barcode}
          backHref="/admin/mongo"
          backText="Volver a MongoDB Compass"
        />

        {/* Panel de búsqueda */}
        <div className="p-4 bg-gray-50 dark:bg-dark-bg border-b dark:border-dark-border transition-colors">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por EAN, nombre o tipo..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchVariantes(query, 1);
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button onClick={() => searchVariantes(query, 1)}>
              Buscar
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-dark-bg transition-colors">
          {loading && variantes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p>Buscando variantes...</p>
            </div>
          ) : variantes.length > 0 ? (
            <>
              {/* Contador */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {variantes.length} de {total} variantes
                </p>
              </div>

              {/* Lista de variantes */}
              <div className="space-y-3">
                {variantes.map((variante) => (
                  <Card 
                    key={variante.id} 
                    className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedVariant(variante)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {variante.nombreCompleto}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <Barcode className="w-4 h-4" />
                          <span className="font-mono">{variante.codigoBarras}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyEan(variante.codigoBarras);
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-dark-card rounded"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        {variante.tipo && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {variante.tipo}
                            {variante.tamano && ` • ${variante.tamano}`}
                          </div>
                        )}
                        {variante.productoNombre && (
                          <div className="mt-2 text-xs bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded inline-block">
                            {variante.productoNombre}
                            {variante.productoMarca && ` (${variante.productoMarca})`}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => searchVariantes(query, page - 1)}
                    disabled={page === 1 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => searchVariantes(query, page + 1)}
                    disabled={page === totalPages || loading}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Barcode className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p className="font-medium">Busca variantes para comenzar</p>
              <p className="text-sm mt-1">
                Ingresa un EAN, nombre completo o tipo de variante
              </p>
            </div>
          )}
        </main>

        {/* Links rápidos */}
        <div className="p-4 border-t dark:border-dark-border bg-white dark:bg-dark-surface">
          <div className="flex gap-2">
            <Link href="/admin/mongo/integrity" className="flex-1">
              <Button variant="outline" className="w-full">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Verificar Integridad
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      {selectedVariant && (
        <VariantEditor
          isOpen={true}
          variante={selectedVariant}
          onClose={() => setSelectedVariant(null)}
          onSave={handleSaveVariant}
        />
      )}
    </div>
  );
}
