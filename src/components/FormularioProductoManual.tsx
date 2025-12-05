"use client";

import { useState, useEffect, useRef } from "react";
import { Package, Save, X, Camera, Sparkles, Loader2, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CrearProductoDTO } from "@/types";
import toast from "react-hot-toast";

interface Props {
  eanEscaneado: string;
  isOpen: boolean;
  onClose: () => void;
  onProductoCreado: (producto: any) => void;
}

export default function FormularioProductoManual({
  eanEscaneado,
  isOpen,
  onClose,
  onProductoCreado,
}: Props) {
  const [formData, setFormData] = useState({
    nombreBase: "",
    marca: "",
    categoria: "",
    tipo: "",
    tamano: "",
    sabor: "",
  });

  const [marcasDisponibles, setMarcasDisponibles] = useState<string[]>([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>(
    []
  );
  const [cargando, setCargando] = useState(false);
  const [nombreCompletoPreview, setNombreCompletoPreview] = useState("");

  // AI Image Analysis state
  const [analizandoImagen, setAnalizandoImagen] = useState(false);
  const [imagenCapturada, setImagenCapturada] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar marcas y categorías existentes
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const response = await fetch("/api/productos/crear-manual");
        const data = await response.json();
        if (data.success) {
          setMarcasDisponibles(data.marcas || []);
          setCategoriasDisponibles(data.categorias || []);
        }
      } catch (error) {
        console.error("Error al cargar marcas/categorías:", error);
      }
    };

    if (isOpen) {
      cargarDatos();
    }
  }, [isOpen]);

  // Actualizar preview del nombreCompleto
  useEffect(() => {
    const partes = [formData.tipo, formData.sabor, formData.tamano].filter(
      Boolean
    );
    setNombreCompletoPreview(partes.join(" "));
  }, [formData.tipo, formData.sabor, formData.tamano]);

  // Handler for camera/file input change
  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      setImagenCapturada(base64Data);
      
      // Analyze with AI
      await analizarImagenConIA(base64Data, file.type);
    };
    reader.readAsDataURL(file);
    
    // Reset file input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // AI Image Analysis function
  const analizarImagenConIA = async (imageBase64: string, mimeType: string) => {
    setAnalizandoImagen(true);
    
    try {
      const response = await fetch("/api/productos/analizar-imagen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const { nombreBase, marca, categoria, tipo, tamano, sabor, confianza } = data.data;
        
        // Auto-fill form with AI results (only non-empty values)
        setFormData(prev => ({
          ...prev,
          nombreBase: nombreBase || prev.nombreBase,
          marca: marca || prev.marca,
          categoria: categoria || prev.categoria,
          tipo: tipo || prev.tipo,
          tamano: tamano || prev.tamano,
          sabor: sabor || prev.sabor,
        }));

        if (confianza >= 0.7) {
          toast.success("✨ Producto detectado con alta confianza");
        } else if (confianza >= 0.4) {
          toast.success("📷 Información extraída. Verifica los campos.");
        } else {
          toast("⚠️ Baja confianza. Revisa y completa los campos.", { icon: "📷" });
        }
      } else {
        const errorMessage = data.error || "No se pudo analizar la imagen";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error al analizar imagen:", error);
      toast.error("Error al conectar con el servicio de IA");
    } finally {
      setAnalizandoImagen(false);
    }
  };

  // Clear captured image
  const limpiarImagen = () => {
    setImagenCapturada(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.nombreBase ||
      !formData.marca ||
      !formData.categoria ||
      !formData.tamano
    ) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setCargando(true);

    try {
      const dto: CrearProductoDTO = {
        ean: eanEscaneado,
        productoBase: {
          nombre: formData.nombreBase,
          marca: formData.marca,
          categoria: formData.categoria,
        },
        variante: {
          tipo: formData.tipo || undefined,
          tamano: formData.tamano,
          sabor: formData.sabor || undefined,
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
        toast.success("Producto guardado exitosamente");
        // Resetear formulario
        setFormData({
          nombreBase: "",
          marca: "",
          categoria: "",
          tipo: "",
          tamano: "",
          sabor: "",
        });
        // Resetear imagen capturada
        setImagenCapturada(null);
        // NO llamar onClose() aquí - el padre (AddProductWorkflow) controla el flujo
      } else {
        toast.error(data.error || "Error al crear el producto");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al crear el producto");
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Producto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* EAN Escaneado */}
        <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg transition-colors">
          <p className="text-sm text-gray-600 dark:text-gray-400">Código de Barras:</p>
          <p className="text-lg font-mono font-bold text-cyan-900 dark:text-cyan-400">
            {eanEscaneado}
          </p>
        </div>

        {/* AI Image Analysis Section */}
        <div className="bg-gradient-to-r from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200">
              Auto-completar con IA
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Toma una foto del producto y la IA completará los campos automáticamente.
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageCapture}
            className="hidden"
            disabled={analizandoImagen}
          />

          {/* Image preview or capture button */}
          {imagenCapturada ? (
            <div className="relative">
              <img
                src={imagenCapturada}
                alt="Producto capturado"
                className="w-full h-40 object-contain rounded-lg bg-white dark:bg-dark-card"
              />
              <button
                type="button"
                onClick={limpiarImagen}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Eliminar imagen"
              >
                <XIcon className="w-4 h-4" />
              </button>
              
              {analizandoImagen && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analizando...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={analizandoImagen}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {analizandoImagen ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analizando imagen...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Tomar Foto del Producto
                </>
              )}
            </Button>
          )}

          {/* Retake photo button when image exists */}
          {imagenCapturada && !analizandoImagen && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-2"
            >
              <Camera className="w-4 h-4" />
              Tomar otra foto
            </Button>
          )}
        </div>

        {/* Producto Base */}
        <div className="space-y-3 border-b dark:border-dark-border pb-4">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center">
            <Package className="w-5 h-5 mr-2 text-cyan-600 dark:text-cyan-400" />
            Producto Base
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Ej: Nido, Coca-Cola, Heinz Compota"
              value={formData.nombreBase}
              onChange={(e) =>
                setFormData({ ...formData, nombreBase: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Marca <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              list="marcas-list"
              placeholder="Ej: Nestlé, Coca-Cola Company"
              value={formData.marca}
              onChange={(e) =>
                setFormData({ ...formData, marca: e.target.value })
              }
              required
            />
            <datalist id="marcas-list">
              {marcasDisponibles.map((marca) => (
                <option key={marca} value={marca} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Categoría <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              list="categorias-list"
              placeholder="Ej: Lácteos, Bebidas, Snacks"
              value={formData.categoria}
              onChange={(e) =>
                setFormData({ ...formData, categoria: e.target.value })
              }
              required
            />
            <datalist id="categorias-list">
              {categoriasDisponibles.map((categoria) => (
                <option key={categoria} value={categoria} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Variante */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-800 dark:text-gray-200">Variante Específica</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Tipo
            </label>
            <Input
              type="text"
              placeholder="Ej: Crecimiento, Sin Lactosa, Light"
              value={formData.tipo}
              onChange={(e) =>
                setFormData({ ...formData, tipo: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Tamaño <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Ej: 360g, 1L, 500ml"
              value={formData.tamano}
              onChange={(e) =>
                setFormData({ ...formData, tamano: e.target.value })
              }
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Incluye la unidad: g, kg, ml, L, unidad
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Sabor
            </label>
            <Input
              type="text"
              placeholder="Ej: Manzana, Vainilla (opcional)"
              value={formData.sabor}
              onChange={(e) =>
                setFormData({ ...formData, sabor: e.target.value })
              }
            />
          </div>
        </div>

        {/* Preview del Nombre Completo */}
        {nombreCompletoPreview && (
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg transition-colors">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Vista previa del nombre:
            </p>
            <p className="font-bold text-green-900 dark:text-green-400">
              {formData.nombreBase} {nombreCompletoPreview}
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={cargando}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={cargando}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {cargando ? "Guardando..." : "Crear Producto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
