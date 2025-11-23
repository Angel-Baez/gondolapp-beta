"use client";

import { useState } from "react";
import { 
  Zap, 
  ChevronRight, 
  Milk,
  Citrus,
  Coffee,
  CupSoda,
  ForkKnife, 
  Cookie, 
  Beef,
  Beaker,
  IceCream,
  UtensilsCrossed,
  Apple, 
  SprayCan,
  Package,
  ArrowLeft,
  Wheat,
  Box,
  Droplet
} from "lucide-react";
import { Button, Input, Modal } from "@/components/ui";
import toast from "react-hot-toast";
import {
  PRESETS_PRODUCTOS,
  generarNombreCompleto,
  PresetConfig,
} from "@/lib/presets";
import { CrearProductoDTO } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProductoCreado: (producto: CrearProductoDTO) => void;
}

// Mapeo visual para tus presets
type IconMapValue = {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  color: string;
  label: string;
};

const ICON_MAP: Record<string, IconMapValue> = {
  "leche-polvo":   { icon: Package,   color: "blue",   label: "Leche Polvo" },
  "leche-liquida": { icon: Milk,      color: "cyan",   label: "Leche Líquida" },
  "galletas":      { icon: Cookie,    color: "orange", label: "Galletas" },
  "compotas":      { icon: Apple,     color: "green",  label: "Compotas" },

  // Cambiado para evitar repetición con leche-polvo
  "agua":          { icon: Droplet,   color: "teal",   label: "Agua" },

  "refrescos":     { icon: CupSoda,   color: "amber",  label: "Refrescos" },

  "yogurt":        { icon: IceCream,  color: "rose",   label: "Yogurt" },

  // Cambiado para evitar repetición con compotas
  "aceites":       { icon: Beaker,    color: "lime",   label: "Aceites" },

  // Cambiado para evitar repetición con leche líquida
  "pasta":         { icon: ForkKnife, color: "violet", label: "Pasta" },

  // Cambiado para evitar repetición con refrescos
  "cereales":      { icon: Wheat,     color: "indigo",   label: "Cereales" },
  // Fallbacks para futuros presets
  "cafe": { icon: Coffee, color: "brown", label: "Café" },
  "snacks": { icon: UtensilsCrossed, color: "green", label: "Snacks" },
  "carnes": { icon: Beef, color: "rose", label: "Fiambres" },
  "frescos": { icon: Citrus, color: "green", label: "Frescos" },
  "limpieza": { icon: SprayCan, color: "cyan", label: "Limpieza" },
};

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

  const nombreCompletoPreview = generarNombreCompleto({ tipo, sabor, tamano });

  const modalTitle = step === "select-preset" ? "Seleccionar Categoría" : `Categoria ${presetSeleccionado?.nombre}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
    >
      <div className="space-y-6">
        {step === "select-preset" ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-2 gap-3">
              {PRESETS_PRODUCTOS.map((preset) => {
                const visual = ICON_MAP[preset.id] || { 
                  icon: Box, 
                  color: "gray", 
                  label: preset.nombre 
                };
                const Icon = visual.icon;

                 const colorClasses = {
                  blue: "bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300",
                  amber: "bg-amber-50 text-amber-700 border-amber-100 hover:border-amber-300",
                  orange: "bg-orange-50 text-orange-700 border-orange-100 hover:border-orange-300",
                  rose: "bg-rose-50 text-rose-700 border-rose-100 hover:border-rose-300",
                  green: "bg-green-50 text-green-700 border-green-100 hover:border-green-300",
                  cyan: "bg-cyan-50 text-cyan-700 border-cyan-100 hover:border-cyan-300",
                  indigo: "bg-indigo-50 text-indigo-700 border-indigo-100 hover:border-indigo-300",
                  violet:"bg-violet-50 text-violet-700 border-violet-100 hover:border-violet-300",
                  lime:  "bg-lime-50 text-lime-700 border-lime-100 hover:border-lime-300",
                  teal:  "bg-teal-50 text-teal-700 border-teal-100 hover:border-teal-300",
                }[visual.color as string] || "bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-300";

                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSeleccionarPreset(preset)}
                    className={`group flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md active:scale-[0.98] ${colorClasses}`}
                  >
                    <Icon size={20} strokeWidth={2} />
                    <span className="font-medium flex-1 text-left">{visual.label}</span>
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-4 duration-300 space-y-5">
            <button 
              onClick={() => setStep("select-preset")}
              className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-900 font-medium mb-2"
            >
              <ArrowLeft size={14} /> Volver a categorías
            </button>

            <div className="grid gap-4">
              {/* EAN */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Barras (EAN) <span className="text-red-500">*</span>
                </label>
                <Input
                  value={ean}
                  onChange={(e) => setEan(e.target.value)}
                  type="text"
                  placeholder="Ej: 7501234567890"
                  className="font-mono text-lg tracking-wide"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>  

            {/* Preview */}
            {nombreBase && nombreCompletoPreview && (
              <>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm text-gray-400">
                    <Package className="text-green-900" size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vista Previa</p>
                    <p className="font-semibold text-green-900 text-lg leading-tight mt-0.5">
                      {nombreBase} {nombreCompletoPreview}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                    {ean || ""}
                    </p>
                  </div>
                </div>
              </>
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
      </div>
    </Modal>
  );
}
