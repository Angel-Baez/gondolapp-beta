"use client";

import { useState } from "react";
import { Zap, ChevronRight, Package } from "lucide-react";
import { Button, Input, Modal } from "@/components/ui";
import toast from "react-hot-toast";
import {
  PRESETS_PRODUCTOS,
  getPresetById,
  generarNombreCompleto,
  PresetConfig,
} from "@/lib/presets";
import { CrearProductoDTO } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProductoCreado: (producto: any) => void;
}

export default function CrearConPreset({
  isOpen,
  onClose,
  onProductoCreado,
}: Props) {
  const [step, setStep] = useState<"select-preset" | "configure">(
    "select-preset"
  );
  const [presetSeleccionado, setPresetSeleccionado] =
    useState<PresetConfig | null>(null);
  const [ean, setEan] = useState("");
  const [nombreBase, setNombreBase] = useState("");
  const [marca, setMarca] = useState("");
  const [tipo, setTipo] = useState("");
  const [tamano, setTamano] = useState("");
  const [sabor, setSabor] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSeleccionarPreset = (preset: PresetConfig) => {
    setPresetSeleccionado(preset);
    // Pre-llenar valores
    setMarca(preset.marcasComunes[0] || "");
    setTipo(preset.tipos?.[0] || "");
    setTamano(preset.tamanosComunes[0] || "");
    setSabor(preset.sabores?.[0] || "");
    setStep("configure");
  };

  const handleCrear = async () => {
    if (!presetSeleccionado || !ean || !nombreBase || !tamano) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setCargando(true);

    try {
      const dto: CrearProductoDTO = {
        ean: ean.trim(),
        productoBase: {
          nombre: nombreBase.trim(),
          marca: marca.trim(),
          categoria: presetSeleccionado.categoria,
        },
        variante: {
          tipo: tipo.trim() || undefined,
          tamano: tamano.trim(),
          sabor: sabor.trim() || undefined,
        },
      };

      const response = await fetch("/api/productos/crear-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });

      const data = await response.json();

      if (data.success) {
        onProductoCreado(data.producto);
        resetForm();
        onClose();
      } else {
        toast.error(data.error || "Error al crear el producto");
      }
    } catch (error) {
      console.error("Error al crear producto:", error);
      toast.error("Error al crear el producto");
    } finally {
      setCargando(false);
    }
  };

  const resetForm = () => {
    setStep("select-preset");
    setPresetSeleccionado(null);
    setEan("");
    setNombreBase("");
    setMarca("");
    setTipo("");
    setTamano("");
    setSabor("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const nombreCompletoPreview = generarNombreCompleto({ tipo, tamano, sabor });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Creación Rápida con Preset"
      size="lg"
    >
      {step === "select-preset" ? (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Selecciona una categoría de producto para crear rápidamente:
          </p>
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {PRESETS_PRODUCTOS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSeleccionarPreset(preset)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition text-left group"
              >
                <div className="text-3xl mb-2">{preset.icono}</div>
                <h3 className="font-bold text-gray-800 group-hover:text-cyan-700">
                  {preset.nombre}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {preset.descripcion}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {preset.categoria}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-600" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header con preset seleccionado */}
          <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{presetSeleccionado?.icono}</span>
              <div>
                <p className="font-bold text-cyan-900">
                  {presetSeleccionado?.nombre}
                </p>
                <p className="text-xs text-cyan-700">
                  {presetSeleccionado?.categoria}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep("select-preset")}
              className="text-xs"
            >
              Cambiar
            </Button>
          </div>

          {/* EAN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de Barras (EAN) <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Ej: 7501234567890"
              value={ean}
              onChange={(e) => setEan(e.target.value)}
              required
            />
          </div>

          {/* Nombre Base */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Ej: Nido"
              value={nombreBase}
              onChange={(e) => setNombreBase(e.target.value)}
              required
            />
          </div>

          {/* Marca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca <span className="text-red-500">*</span>
            </label>
            <select
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              {presetSeleccionado?.marcasComunes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value="">Otra marca...</option>
            </select>
            {marca === "" && (
              <Input
                type="text"
                placeholder="Escribe la marca"
                onChange={(e) => setMarca(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Tipo (si existe en preset) */}
          {presetSeleccionado?.tipos && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">Sin tipo específico</option>
                {presetSeleccionado.tipos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tamaño */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tamaño <span className="text-red-500">*</span>
            </label>
            <select
              value={tamano}
              onChange={(e) => setTamano(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              {presetSeleccionado?.tamanosComunes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="">Otro tamaño...</option>
            </select>
            {tamano === "" && (
              <Input
                type="text"
                placeholder={`Ej: 500${presetSeleccionado?.unidadBase.toLowerCase()}`}
                onChange={(e) => setTamano(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Sabor (si existe en preset) */}
          {presetSeleccionado?.sabores && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sabor
              </label>
              <select
                value={sabor}
                onChange={(e) => setSabor(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">Sin sabor</option>
                {presetSeleccionado.sabores.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Preview */}
          {nombreBase && nombreCompletoPreview && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Vista previa:</p>
              <p className="font-bold text-green-900">
                {nombreBase} {nombreCompletoPreview}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={cargando}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCrear}
              disabled={cargando || !ean || !nombreBase || !tamano}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              {cargando ? "Creando..." : "Crear Producto"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
