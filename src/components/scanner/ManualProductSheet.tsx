"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { useMarcasCategorias } from "@/hooks/useMarcasCategorias";
import { ProductoEscaneado } from "@/hooks/useScanProduct";
import { CrearProductoDTO } from "@/types";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export interface ManualProductSheetProps {
  ean: string;
  isOpen: boolean;
  onCreated: (producto: ProductoEscaneado) => void;
  onClose: () => void;
}

/** Formulario de alta rápida para EAN desconocido: sólo nombre + marca son obligatorios. */
export function ManualProductSheet({
  ean,
  isOpen,
  onCreated,
  onClose,
}: ManualProductSheetProps) {
  const [nombre, setNombre] = useState("");
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState("");
  const [tamano, setTamano] = useState("");
  const [sabor, setSabor] = useState("");
  const [detallesAbiertos, setDetallesAbiertos] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const { data } = useMarcasCategorias(isOpen);

  useEffect(() => {
    if (!isOpen) {
      setNombre("");
      setMarca("");
      setCategoria("");
      setTipo("");
      setTamano("");
      setSabor("");
      setDetallesAbiertos(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!nombre.trim() || !marca.trim()) {
      toast.error("Completá nombre y marca");
      return;
    }

    setEnviando(true);
    try {
      const dto: CrearProductoDTO = {
        ean,
        productoBase: {
          nombre: nombre.trim(),
          marca: marca.trim(),
          categoria: categoria.trim() || undefined,
        },
        variante: {
          tipo: tipo.trim() || undefined,
          tamano: tamano.trim() || undefined,
          sabor: sabor.trim() || undefined,
        },
      };

      const response = await fetch("/api/productos/crear-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || "Error al crear el producto");
        return;
      }

      toast.success("Producto creado");
      onCreated(result.producto);
    } catch {
      toast.error("Error al crear el producto");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Producto nuevo">
      <div className="space-y-4">
        <div className="p-3 rounded-field bg-surface-2">
          <p className="text-footnote text-fg-secondary">Código escaneado</p>
          <p className="text-headline font-mono text-fg">{ean}</p>
        </div>

        <div>
          <label className="block text-footnote font-semibold text-fg-secondary mb-1.5">
            Nombre *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Leche Entera"
            autoFocus
            className="w-full h-12 px-4 rounded-field bg-surface-2 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        <div>
          <label className="block text-footnote font-semibold text-fg-secondary mb-1.5">
            Marca *
          </label>
          <input
            type="text"
            list="manual-marcas"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Ej: La Serenísima"
            className="w-full h-12 px-4 rounded-field bg-surface-2 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <datalist id="manual-marcas">
            {data?.marcas.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>

        <button
          onClick={() => setDetallesAbiertos((v) => !v)}
          className="w-full flex items-center justify-between text-subhead font-semibold text-fg-secondary py-1"
        >
          Detalles (categoría, tipo, tamaño, sabor)
          <ChevronDown
            size={18}
            className={`transition-transform ${detallesAbiertos ? "rotate-180" : ""}`}
          />
        </button>

        {detallesAbiertos && (
          <div className="space-y-3">
            <input
              type="text"
              list="manual-categorias"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Categoría (ej: Lácteos)"
              className="w-full h-12 px-4 rounded-field bg-surface-2 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <datalist id="manual-categorias">
              {data?.categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <input
              type="text"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Tipo (ej: Sin Lactosa)"
              className="w-full h-12 px-4 rounded-field bg-surface-2 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <input
              type="text"
              value={tamano}
              onChange={(e) => setTamano(e.target.value)}
              placeholder="Tamaño (ej: 1L)"
              className="w-full h-12 px-4 rounded-field bg-surface-2 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <input
              type="text"
              value={sabor}
              onChange={(e) => setSabor(e.target.value)}
              placeholder="Sabor (opcional)"
              className="w-full h-12 px-4 rounded-field bg-surface-2 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!nombre.trim() || !marca.trim() || enviando}
          className="w-full h-14 rounded-field bg-accent text-on-accent text-headline font-semibold disabled:opacity-40 transition-opacity"
        >
          {enviando ? "Creando..." : "Crear producto"}
        </button>
      </div>
    </BottomSheet>
  );
}
