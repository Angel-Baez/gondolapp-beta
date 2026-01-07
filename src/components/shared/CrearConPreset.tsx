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
                  blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600",
                  amber: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-600",
                  orange: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-600",
                  rose: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800 hover:border-rose-300 dark:hover:border-rose-600",
                  green: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-100 dark:border-green-800 hover:border-green-300 dark:hover:border-green-600",
                  cyan: "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-100 dark:border-cyan-800 hover:border-cyan-300 dark:hover:border-cyan-600",
                  indigo: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-600",
                  violet:"bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-600",
                  lime:  "bg-lime-50 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 border-lime-100 dark:border-lime-800 hover:border-lime-300 dark:hover:border-lime-600",
                  teal:  "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-100 dark:border-teal-800 hover:border-teal-300 dark:hover:border-teal-600",
                }[visual.color as string] || "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600";

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
              className="text-xs flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium mb-2 transition-colors"
            >
              <ArrowLeft size={14} /> Volver a categorías
            </button>

            <div className="grid gap-4">
              {/* EAN */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Marca <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Tipo
                    </label>
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Tamaño <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={tamano}
                    onChange={(e) => setTamano(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Sabor
                    </label>
                    <select
                      value={sabor}
                      onChange={(e) => setSabor(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
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
                <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-xl border border-gray-100 dark:border-dark-border flex items-start gap-3 transition-colors">
                  <div className="p-2 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border shadow-sm text-gray-400 dark:text-gray-500">
                    <Package className="text-green-900 dark:text-green-400" size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Vista Previa</p>
                    <p className="font-semibold text-green-900 dark:text-green-400 text-lg leading-tight mt-0.5">
                      {nombreBase} {nombreCompletoPreview}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
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
