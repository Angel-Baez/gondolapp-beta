"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ProductoVariante, ProductoBase } from "@/types";
import { Search, ArrowRightLeft, X } from "lucide-react";
import { ProductList } from "./ProductList";
import toast from "react-hot-toast";

interface VariantReassignerProps {
  isOpen: boolean;
  variante: ProductoVariante;
  currentProduct: ProductoBase;
  onClose: () => void;
  onReassign: (nuevoProductoBaseId: string) => Promise<void>;
}

/**
 * Modal para reasignar variantes a otro producto base
 */
export function VariantReassigner({
  isOpen,
  variante,
  currentProduct,
  onClose,
  onReassign,
}: VariantReassignerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [productos, setProductos] = useState<(ProductoBase & { variantesCount: number })[]>([]);
  const [searching, setSearching] = useState(false);
  const [reassigning, setReassigning] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Ingresa un término de búsqueda");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `/api/admin/productos?q=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const data = await response.json();

      if (data.success) {
        // Filtrar el producto actual para no mostrar la opción de reasignar a sí mismo
        const filtered = data.productos.filter(
          (p: ProductoBase) => p.id !== currentProduct.id
        );
        setProductos(filtered);
      } else {
        toast.error("Error al buscar productos");
      }
    } catch (error) {
      console.error("Error al buscar:", error);
      toast.error("Error al buscar productos");
    } finally {
      setSearching(false);
    }
  };

  const handleReassign = async (nuevoProducto: ProductoBase) => {
    if (
      !confirm(
        `¿Reasignar "${variante.nombreCompleto}" de "${currentProduct.nombre}" a "${nuevoProducto.nombre}"?`
      )
    ) {
      return;
    }

    setReassigning(true);
    try {
      await onReassign(nuevoProducto.id);
      toast.success("Variante reasignada correctamente");
      onClose();
    } catch (error) {
      toast.error("Error al reasignar variante");
    } finally {
      setReassigning(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reasignar Variante">
      <div className="space-y-4">
        {/* Información de la variante */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Variante a reasignar:</p>
          <p className="font-medium text-gray-900">{variante.nombreCompleto}</p>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            EAN: {variante.codigoBarras}
          </p>
          <p className="text-sm text-gray-600 mt-2">Producto actual:</p>
          <p className="font-medium text-cyan-600">{currentProduct.nombre}</p>
        </div>

        {/* Buscador de producto destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar producto destino
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Buscar por nombre..."
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={searching || reassigning}
            >
              <Search className="w-4 h-4 mr-2" />
              {searching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </div>

        {/* Resultados de búsqueda */}
        {productos.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Selecciona el producto destino:
            </p>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {productos.map((producto) => (
                <div
                  key={producto.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleReassign(producto)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {producto.nombre}
                      </p>
                      <p className="text-xs text-gray-600">
                        {producto.marca && `${producto.marca} • `}
                        {producto.categoria}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {producto.variantesCount} variante(s)
                      </p>
                    </div>
                    <ArrowRightLeft className="w-5 h-5 text-cyan-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sin resultados */}
        {productos.length === 0 && searchQuery && !searching && (
          <div className="text-center py-8 text-gray-500">
            <p>No se encontraron productos</p>
            <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
          </div>
        )}

        {/* Botón cancelar */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={reassigning}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
