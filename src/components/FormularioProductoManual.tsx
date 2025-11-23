"use client";

import { useState, useEffect } from "react";
import { Package, Save, X } from "lucide-react";
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
    const partes = [formData.tipo, formData.tamano, formData.sabor].filter(
      Boolean
    );
    setNombreCompletoPreview(partes.join(" "));
  }, [formData.tipo, formData.tamano, formData.sabor]);

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
        onClose();
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
        <div className="bg-cyan-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Código de Barras:</p>
          <p className="text-lg font-mono font-bold text-cyan-900">
            {eanEscaneado}
          </p>
        </div>

        {/* Producto Base */}
        <div className="space-y-3 border-b pb-4">
          <h3 className="font-bold text-gray-800 flex items-center">
            <Package className="w-5 h-5 mr-2 text-cyan-600" />
            Producto Base
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <h3 className="font-bold text-gray-800">Variante Específica</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <p className="text-xs text-gray-500 mt-1">
              Incluye la unidad: g, kg, ml, L, unidad
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">
              Vista previa del nombre:
            </p>
            <p className="font-bold text-green-900">
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
