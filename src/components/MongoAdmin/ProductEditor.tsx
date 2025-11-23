"use client";

import { useState } from "react";
import { confirmAsync } from "@/lib/confirm";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ProductoBase, ProductoVariante } from "@/types";
import { Save, Trash2, X } from "lucide-react";
import { VariantList } from "./VariantList";
import toast from "react-hot-toast";

interface ProductEditorProps {
  isOpen: boolean;
  producto: ProductoBase;
  variantes: ProductoVariante[];
  onClose: () => void;
  onSave: (data: Partial<ProductoBase>) => Promise<void>;
  onDelete: () => Promise<void>;
  onVariantClick: (variante: ProductoVariante) => void;
  onReassignVariant: (variante: ProductoVariante) => void;
  onDeleteVariant: (varianteId: string) => Promise<void>;
}

/**
 * Editor modal para productos base
 */
export function ProductEditor({
  isOpen,
  producto,
  variantes,
  onClose,
  onSave,
  onDelete,
  onVariantClick,
  onReassignVariant,
  onDeleteVariant,
}: ProductEditorProps) {
  const [nombre, setNombre] = useState(producto.nombre);
  const [marca, setMarca] = useState(producto.marca || "");
  const [categoria, setCategoria] = useState(producto.categoria || "");
  const [imagen, setImagen] = useState(producto.imagen || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre del producto es requerido");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        nombre: nombre.trim(),
        marca: marca.trim() || undefined,
        categoria: categoria.trim() || undefined,
        imagen: imagen.trim() || undefined,
      });
      toast.success("Producto actualizado correctamente");
    } catch (error) {
      toast.error("Error al actualizar el producto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (variantes.length > 0) {
      toast.error(
        `No se puede eliminar: el producto tiene ${variantes.length} variante(s)`
      );
      return;
    }

    const confirmado = await confirmAsync({
      title: "¿Eliminar producto?",
      description:
        "Esta acción eliminará el producto de forma permanente. ¿Estás seguro de que deseas continuar?",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      variant: "danger",
    });
    if (!confirmado) return;

    setDeleting(true);
    try {
      await onDelete();
      toast.success("Producto eliminado correctamente");
      onClose();
    } catch (error) {
      toast.error("Error al eliminar el producto");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Producto">
      <div className="space-y-4">
        {/* Formulario de edición */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Producto *
          </label>
          <Input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Nido Forticrece"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marca
          </label>
          <Input
            type="text"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Ej: Nestlé"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <Input
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Ej: Leche en Polvo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL de Imagen
          </label>
          <Input
            type="text"
            value={imagen}
            onChange={(e) => setImagen(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {/* Lista de variantes */}
        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-3">
            Variantes ({variantes.length})
          </h3>
          {variantes.length > 0 ? (
            <VariantList
              variantes={variantes}
              onEdit={onVariantClick}
              onReassign={onReassignVariant}
              onDelete={onDeleteVariant}
            />
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay variantes asociadas
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving || deleting}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving || deleting}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>

        {/* Botón de eliminar */}
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={saving || deleting || variantes.length > 0}
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {deleting ? "Eliminando..." : "Eliminar Producto"}
        </Button>
      </div>
    </Modal>
  );
}
