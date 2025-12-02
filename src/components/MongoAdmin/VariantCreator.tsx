"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Save, X, Barcode, AlertCircle } from "lucide-react";
import { ProductoBase } from "@/types";
import toast from "react-hot-toast";

interface VariantCreatorProps {
  isOpen: boolean;
  producto: ProductoBase;
  onClose: () => void;
  onCreated: () => void;
}

/**
 * Modal para crear una nueva variante de un producto
 * US-102: Crear nueva variante para un producto
 */
export function VariantCreator({
  isOpen,
  producto,
  onClose,
  onCreated,
}: VariantCreatorProps) {
  const [ean, setEan] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [tipo, setTipo] = useState("");
  const [tamano, setTamano] = useState("");
  const [sabor, setSabor] = useState("");
  const [imagen, setImagen] = useState("");
  const [saving, setSaving] = useState(false);
  const [eanError, setEanError] = useState("");

  /**
   * Validar formato de EAN
   */
  const validateEan = (value: string): boolean => {
    if (!value) {
      setEanError("El código de barras es requerido");
      return false;
    }

    // Verificar que solo contenga dígitos
    if (!/^\d+$/.test(value)) {
      setEanError("El código debe contener solo números");
      return false;
    }

    // Verificar longitud válida (EAN-8, EAN-13, UPC, etc.)
    if (value.length < 8 || value.length > 14) {
      setEanError("El código debe tener entre 8 y 14 dígitos");
      return false;
    }

    setEanError("");
    return true;
  };

  const handleEanChange = (value: string) => {
    setEan(value);
    if (value.length >= 8) {
      validateEan(value);
    } else {
      setEanError("");
    }
  };

  const handleSubmit = async () => {
    if (!validateEan(ean)) {
      return;
    }

    if (!nombreCompleto.trim()) {
      toast.error("El nombre completo de la variante es requerido");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/variantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoBaseId: producto.id,
          ean: ean.trim(),
          nombreCompleto: nombreCompleto.trim(),
          tipo: tipo.trim() || undefined,
          tamano: tamano.trim() || undefined,
          sabor: sabor.trim() || undefined,
          imagen: imagen.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Variante creada correctamente");
        handleReset();
        onCreated();
        onClose();
      } else {
        // Mostrar error específico si es EAN duplicado
        if (result.error?.includes("duplicado") || result.error?.includes("existe")) {
          setEanError(result.error);
        } else {
          toast.error(result.error || "Error al crear la variante");
        }
      }
    } catch (error) {
      console.error("Error al crear variante:", error);
      toast.error("Error al crear la variante");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEan("");
    setNombreCompleto("");
    setTipo("");
    setTamano("");
    setSabor("");
    setImagen("");
    setEanError("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nueva Variante">
      <div className="space-y-4">
        {/* Info del producto padre */}
        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3">
          <p className="text-sm text-cyan-700 dark:text-cyan-300">
            Producto Base: <strong>{producto.nombre}</strong>
          </p>
          {producto.marca && (
            <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
              {producto.marca} • {producto.categoria}
            </p>
          )}
        </div>

        {/* Código de barras (requerido) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Código de Barras (EAN) *
          </label>
          <div className="relative">
            <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              value={ean}
              onChange={(e) => handleEanChange(e.target.value)}
              placeholder="Ej: 7501234567890"
              className={`pl-10 font-mono ${eanError ? "border-red-500 focus:ring-red-500" : ""}`}
              autoFocus
            />
          </div>
          {eanError && (
            <div className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{eanError}</span>
            </div>
          )}
        </div>

        {/* Nombre completo (requerido) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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

        {/* Acciones */}
        <div className="flex gap-2 pt-4 border-t dark:border-dark-border">
          <Button
            onClick={handleSubmit}
            disabled={saving || !ean.trim() || !nombreCompleto.trim() || !!eanError}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Creando..." : "Crear Variante"}
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
