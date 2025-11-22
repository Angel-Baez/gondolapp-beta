"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ProductoVariante } from "@/types";
import { Save, X } from "lucide-react";
import toast from "react-hot-toast";

interface VariantEditorProps {
  isOpen: boolean;
  variante: ProductoVariante;
  onClose: () => void;
  onSave: (data: Partial<ProductoVariante>) => Promise<void>;
}

/**
 * Editor modal para variantes individuales
 */
export function VariantEditor({
  isOpen,
  variante,
  onClose,
  onSave,
}: VariantEditorProps) {
  const [nombreCompleto, setNombreCompleto] = useState(variante.nombreCompleto);
  const [tipo, setTipo] = useState(variante.tipo || "");
  const [tamano, setTamano] = useState(variante.tamano || "");
  const [sabor, setSabor] = useState(variante.sabor || "");
  const [imagen, setImagen] = useState(variante.imagen || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nombreCompleto.trim()) {
      toast.error("El nombre de la variante es requerido");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        nombreCompleto: nombreCompleto.trim(),
        tipo: tipo.trim() || undefined,
        tamano: tamano.trim() || undefined,
        sabor: sabor.trim() || undefined,
        imagen: imagen.trim() || undefined,
      });
      toast.success("Variante actualizada correctamente");
      onClose();
    } catch (error) {
      toast.error("Error al actualizar la variante");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Variante">
      <div className="space-y-4">
        {/* Código de barras (solo lectura) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código de Barras (EAN)
          </label>
          <Input
            type="text"
            value={variante.codigoBarras}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            El código de barras no se puede modificar
          </p>
        </div>

        {/* Nombre completo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo *
          </label>
          <Input
            type="text"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            placeholder="Ej: Crecimiento 360g"
          />
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <Input
            type="text"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            placeholder="Ej: Crecimiento, Sin Lactosa"
          />
        </div>

        {/* Tamaño */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tamaño
          </label>
          <Input
            type="text"
            value={tamano}
            onChange={(e) => setTamano(e.target.value)}
            placeholder="Ej: 360g, 1L"
          />
        </div>

        {/* Sabor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sabor
          </label>
          <Input
            type="text"
            value={sabor}
            onChange={(e) => setSabor(e.target.value)}
            placeholder="Ej: Vainilla, Chocolate"
          />
        </div>

        {/* URL de imagen */}
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

        {/* Acciones */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
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
