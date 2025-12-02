"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Save, X, Package } from "lucide-react";
import toast from "react-hot-toast";

interface ProductCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/**
 * Modal para crear un nuevo ProductoBase
 * US-101: Crear nuevo ProductoBase desde admin
 */
export function ProductCreator({
  isOpen,
  onClose,
  onCreated,
}: ProductCreatorProps) {
  const [nombre, setNombre] = useState("");
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagen, setImagen] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre del producto es requerido");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          marca: marca.trim() || undefined,
          categoria: categoria.trim() || undefined,
          imagen: imagen.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Producto creado correctamente");
        handleReset();
        onCreated();
        onClose();
      } else {
        toast.error(result.error || "Error al crear el producto");
      }
    } catch (error) {
      console.error("Error al crear producto:", error);
      toast.error("Error al crear el producto");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setNombre("");
    setMarca("");
    setCategoria("");
    setImagen("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo Producto Base">
      <div className="space-y-4">
        {/* Icono decorativo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
          </div>
        </div>

        {/* Nombre (requerido) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Nombre del Producto *
          </label>
          <Input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Nido Forticrece"
            autoFocus
          />
        </div>

        {/* Marca */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Marca
          </label>
          <Input
            type="text"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Ej: Nestlé"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Categoría
          </label>
          <Input
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Ej: Leche en Polvo"
          />
        </div>

        {/* URL de Imagen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            URL de Imagen
          </label>
          <Input
            type="text"
            value={imagen}
            onChange={(e) => setImagen(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {/* Nota informativa */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 Después de crear el producto base, podrás agregar variantes con códigos de barras.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-4 border-t dark:border-dark-border">
          <Button
            onClick={handleSubmit}
            disabled={saving || !nombre.trim()}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Creando..." : "Crear Producto"}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
