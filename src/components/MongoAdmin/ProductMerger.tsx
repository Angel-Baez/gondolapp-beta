"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductoBase } from "@/types";
import { Search, AlertTriangle, CheckCircle, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface MergePreview {
  targetProduct: ProductoBase;
  sourceProducts: ProductoBase[];
  totalVariantes: number;
  conflicts: string[];
}

interface ProductMergerProps {
  isOpen: boolean;
  targetProduct: ProductoBase;
  onClose: () => void;
  onMerge: () => void;
}

/**
 * Modal para fusionar productos duplicados
 */
export function ProductMerger({
  isOpen,
  targetProduct,
  onClose,
  onMerge,
}: ProductMergerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [productos, setProductos] = useState<(ProductoBase & { variantesCount: number })[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [searching, setSearching] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [merging, setMerging] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Ingresa un término de búsqueda");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `/api/admin/productos?q=${encodeURIComponent(searchQuery)}&limit=20`
      );
      const data = await response.json();

      if (data.success) {
        // Filtrar el producto target
        const filtered = data.productos.filter(
          (p: ProductoBase) => p.id !== targetProduct.id
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

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    setPreview(null); // Reset preview cuando cambia la selección
  };

  const handlePreview = async () => {
    if (selectedIds.length === 0) {
      toast.error("Selecciona al menos un producto para fusionar");
      return;
    }

    setPreviewing(true);
    try {
      const response = await fetch("/api/admin/productos/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: targetProduct.id,
          sourceIds: selectedIds,
          preview: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPreview(data.preview);
      } else {
        toast.error("Error al previsualizar fusión");
      }
    } catch (error) {
      console.error("Error al previsualizar:", error);
      toast.error("Error al previsualizar fusión");
    } finally {
      setPreviewing(false);
    }
  };

  const handleMerge = async () => {
    if (!preview) {
      toast.error("Primero previsualiza la fusión");
      return;
    }

    if (preview.conflicts.length > 0) {
      toast.error("No se puede fusionar debido a conflictos");
      return;
    }

    if (
      !confirm(
        `¿Fusionar ${selectedIds.length} producto(s) en "${targetProduct.nombre}"?\n\nEsto moverá ${preview.totalVariantes} variante(s) y eliminará los productos origen.`
      )
    ) {
      return;
    }

    setMerging(true);
    try {
      const response = await fetch("/api/admin/productos/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: targetProduct.id,
          sourceIds: selectedIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `✅ Fusión completada: ${data.variantesReasignadas} variante(s), ${data.productosEliminados} producto(s) eliminado(s)`
        );
        onMerge();
        onClose();
      } else {
        toast.error(data.error || "Error al fusionar productos");
      }
    } catch (error) {
      console.error("Error al fusionar:", error);
      toast.error("Error al fusionar productos");
    } finally {
      setMerging(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fusionar Productos">
      <div className="space-y-4">
        {/* Producto destino */}
        <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
          <p className="text-sm text-cyan-800 mb-1 font-medium">
            Producto Destino:
          </p>
          <p className="font-semibold text-cyan-900">{targetProduct.nombre}</p>
          <p className="text-sm text-cyan-700 mt-1">
            {targetProduct.marca && `${targetProduct.marca} • `}
            {targetProduct.categoria}
          </p>
        </div>

        {/* Buscador */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar productos para fusionar
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
              placeholder="Buscar duplicados..."
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching || merging}>
              <Search className="w-4 h-4 mr-2" />
              {searching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </div>

        {/* Resultados */}
        {productos.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Selecciona productos para fusionar ({selectedIds.length} seleccionados):
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {productos.map((producto) => {
                const isSelected = selectedIds.includes(producto.id);
                return (
                  <div
                    key={producto.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-cyan-50 border-cyan-300"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => toggleSelection(producto.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
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
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-cyan-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botón Preview */}
        {selectedIds.length > 0 && !preview && (
          <Button
            onClick={handlePreview}
            disabled={previewing || merging}
            variant="outline"
            className="w-full"
          >
            {previewing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Previsualizando...
              </>
            ) : (
              "Previsualizar Fusión"
            )}
          </Button>
        )}

        {/* Preview de fusión */}
        {preview && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">
              Vista Previa de Fusión
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="primary">
                  {preview.totalVariantes} variante(s) totales
                </Badge>
                <Badge variant="success">
                  {preview.sourceProducts.length} producto(s) a eliminar
                </Badge>
              </div>

              {preview.conflicts.length > 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900 text-sm">
                        Conflictos detectados:
                      </p>
                      <ul className="text-xs text-red-800 mt-1 space-y-1">
                        {preview.conflicts.map((conflict, i) => (
                          <li key={i}>• {conflict}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-900">
                      ✅ No se detectaron conflictos. La fusión es segura.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleMerge}
            disabled={
              !preview || preview.conflicts.length > 0 || merging || previewing
            }
            className="flex-1"
          >
            {merging ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fusionando...
              </>
            ) : (
              "Confirmar Fusión"
            )}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={merging}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
