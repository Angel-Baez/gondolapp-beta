"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { useMarcasCategorias } from "@/hooks/useMarcasCategorias";
import { ProductoEscaneado } from "@/hooks/useScanProduct";
import { CategoriaAtributo, CrearProductoDTO } from "@/types";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export interface ManualProductSheetProps {
  ean: string;
  isOpen: boolean;
  onCreated: (producto: ProductoEscaneado) => void;
  onClose: () => void;
}

// Último fallback cuando el GET de definiciones falló (offline) y no hay
// nada cacheado: replica el seed global de la migración 0008.
const DEFS_FALLBACK: CategoriaAtributo[] = [
  { clave: "tipo", etiqueta: "Tipo", orden: 0 },
  { clave: "sabor", etiqueta: "Sabor", orden: 1 },
  { clave: "tamano", etiqueta: "Tamaño", orden: 2 },
];

const PLACEHOLDER_EJEMPLOS: Record<string, string> = {
  tipo: "Tipo (ej: Sin Lactosa)",
  sabor: "Sabor (opcional)",
  tamano: "Tamaño (ej: 1L)",
};

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
  const [atributos, setAtributos] = useState<Record<string, string>>({});
  const [detallesAbiertos, setDetallesAbiertos] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const { data } = useMarcasCategorias(isOpen);

  // Inputs a mostrar: definición de la categoría si tiene, si no el default
  // del server, si no el hardcode local. Cambiar de categoría cambia los
  // inputs pero no borra lo tipeado (se filtra recién al enviar).
  const defsCategoria = data?.atributosPorCategoria?.[categoria.trim()];
  const defs =
    defsCategoria ??
    (data?.atributosDefault?.length ? data.atributosDefault : DEFS_FALLBACK);

  useEffect(() => {
    if (!isOpen) {
      setNombre("");
      setMarca("");
      setCategoria("");
      setAtributos({});
      setDetallesAbiertos(false);
    }
  }, [isOpen]);

  const setAtributo = (clave: string, valor: string) =>
    setAtributos((prev) => ({ ...prev, [clave]: valor }));

  const handleSubmit = async () => {
    if (!nombre.trim() || !marca.trim()) {
      toast.error("Completá nombre y marca");
      return;
    }

    setEnviando(true);
    try {
      // Solo las claves visibles: si el usuario tipeó un sabor y después
      // cambió a una categoría sin sabor, ese valor huérfano no viaja.
      const atributosVisibles = Object.fromEntries(
        defs
          .map((def) => [def.clave, (atributos[def.clave] ?? "").trim()])
          .filter(([, valor]) => valor)
      );

      const dto: CrearProductoDTO = {
        ean,
        productoBase: {
          nombre: nombre.trim(),
          marca: marca.trim(),
          categoria: categoria.trim() || undefined,
        },
        variante: {
          atributos: atributosVisibles,
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
          Detalles (categoría y variante)
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
            {defs.map((def) => (
              <div key={def.clave}>
                <input
                  type="text"
                  list={def.sugerencias?.length ? `manual-atributo-${def.clave}` : undefined}
                  value={atributos[def.clave] ?? ""}
                  onChange={(e) => setAtributo(def.clave, e.target.value)}
                  placeholder={PLACEHOLDER_EJEMPLOS[def.clave] ?? def.etiqueta}
                  className="w-full h-12 px-4 rounded-field bg-surface-2 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                {def.sugerencias?.length ? (
                  <datalist id={`manual-atributo-${def.clave}`}>
                    {def.sugerencias.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                ) : null}
              </div>
            ))}
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
