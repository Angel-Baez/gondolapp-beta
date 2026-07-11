"use client";

import { useAuth } from "@/components/AuthProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useMarcasCategorias } from "@/hooks/useMarcasCategorias";
import { ProductoEscaneado } from "@/hooks/useScanProduct";
import { CategoriaAtributo, CrearProductoDTO, ProductoParseado } from "@/types";
import { ChevronDown, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export interface ManualProductSheetProps {
  ean: string;
  isOpen: boolean;
  onCreated: (producto: ProductoEscaneado) => void;
  onClose: () => void;
}

// IA-first: el gondolero escribe el producto entero en un input y la IA lo
// clasifica contra el catálogo existente; "Corregir" (o cualquier fallo del
// parseo: offline, sin API key, error) cae al formulario manual de siempre.
type Modo = "input" | "confirmar" | "form";

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

const INPUT_CLASS =
  "w-full h-12 px-4 rounded-field bg-surface-2 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent/40";

/** Alta rápida para EAN desconocido: input único con IA, o formulario manual. */
export function ManualProductSheet({
  ean,
  isOpen,
  onCreated,
  onClose,
}: ManualProductSheetProps) {
  const { tiendaActiva } = useAuth();
  const [modo, setModo] = useState<Modo>("input");
  const [texto, setTexto] = useState("");
  const [parseando, setParseando] = useState(false);
  const [parsed, setParsed] = useState<ProductoParseado | null>(null);
  const [nombrePreview, setNombrePreview] = useState("");

  // Estado del formulario manual (modo "form" / "Corregir")
  const [nombre, setNombre] = useState("");
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [atributos, setAtributos] = useState<Record<string, string>>({});
  const [detallesAbiertos, setDetallesAbiertos] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const { data } = useMarcasCategorias(isOpen);

  const defsCategoria = data?.atributosPorCategoria?.[categoria.trim()];
  const defs =
    defsCategoria ??
    (data?.atributosDefault?.length ? data.atributosDefault : DEFS_FALLBACK);

  useEffect(() => {
    if (!isOpen) {
      setModo("input");
      setTexto("");
      setParseando(false);
      setParsed(null);
      setNombrePreview("");
      setNombre("");
      setMarca("");
      setCategoria("");
      setAtributos({});
      setDetallesAbiertos(false);
    }
  }, [isOpen]);

  const setAtributo = (clave: string, valor: string) =>
    setAtributos((prev) => ({ ...prev, [clave]: valor }));

  /** Pre-llena el formulario manual (fallback y "Corregir"). */
  const irAlForm = (valores: {
    nombre?: string;
    marca?: string;
    categoria?: string;
    atributos?: Record<string, string>;
  }) => {
    setNombre(valores.nombre ?? "");
    setMarca(valores.marca ?? "");
    setCategoria(valores.categoria ?? "");
    setAtributos(valores.atributos ?? {});
    setDetallesAbiertos(Boolean(valores.categoria || Object.keys(valores.atributos ?? {}).length));
    setModo("form");
  };

  const handleAnalizar = async () => {
    if (!texto.trim()) {
      toast.error("Escribí el producto completo");
      return;
    }
    setParseando(true);
    try {
      const response = await fetch("/api/productos/parsear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: texto.trim(), tiendaId: tiendaActiva }),
      });
      const result = await response.json();
      if (!result.success || !result.parsed?.productoBase?.nombre) {
        throw new Error(result.error || "parseo falló");
      }
      setParsed(result.parsed);
      setNombrePreview(result.nombrePreview || result.parsed.productoBase.nombre);
      setModo("confirmar");
    } catch {
      // Sin red, sin API key o error de la IA: no perder lo tipeado.
      toast("Completá los campos manualmente", { icon: "✏️" });
      irAlForm({ nombre: texto.trim() });
    } finally {
      setParseando(false);
    }
  };

  const crearProducto = async (dto: CrearProductoDTO) => {
    setEnviando(true);
    try {
      const response = await fetch("/api/productos/crear-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dto, tiendaId: tiendaActiva }),
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

  const handleConfirmar = () => {
    if (!parsed) return;
    void crearProducto({
      ean,
      productoBase: {
        nombre: parsed.productoBase.nombre,
        marca: parsed.productoBase.marca,
        categoria: parsed.productoBase.categoria,
      },
      variante: { atributos: parsed.atributos },
    });
  };

  const handleSubmitForm = () => {
    if (!nombre.trim() || !marca.trim()) {
      toast.error("Completá nombre y marca");
      return;
    }
    // Solo las claves visibles: si el usuario tipeó un sabor y después
    // cambió a una categoría sin sabor, ese valor huérfano no viaja.
    const atributosVisibles = Object.fromEntries(
      defs
        .map((def) => [def.clave, (atributos[def.clave] ?? "").trim()])
        .filter(([, valor]) => valor)
    );
    void crearProducto({
      ean,
      productoBase: {
        nombre: nombre.trim(),
        marca: marca.trim(),
        categoria: categoria.trim() || undefined,
      },
      variante: { atributos: atributosVisibles },
    });
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Producto nuevo">
      <div className="space-y-4">
        <div className="p-3 rounded-field bg-surface-2">
          <p className="text-footnote text-fg-secondary">Código escaneado</p>
          <p className="text-headline font-mono text-fg">{ean}</p>
        </div>

        {modo === "input" && (
          <>
            <div>
              <label className="block text-footnote font-semibold text-fg-secondary mb-1.5">
                Escribí el producto completo
              </label>
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !parseando) handleAnalizar();
                }}
                placeholder="Ej: Leche Milex Original 2200g"
                autoFocus
                maxLength={200}
                className={INPUT_CLASS}
              />
              <p className="mt-1.5 text-footnote text-fg-secondary">
                La IA separa marca, categoría y variante por vos.
              </p>
            </div>

            <button
              onClick={handleAnalizar}
              disabled={!texto.trim() || parseando}
              className="w-full h-14 rounded-field bg-accent text-on-accent text-headline font-semibold disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              {parseando ? "Analizando..." : "Analizar"}
            </button>

            <button
              onClick={() => irAlForm({ nombre: texto.trim() })}
              className="w-full text-subhead text-fg-secondary py-1"
            >
              Completar manualmente
            </button>
          </>
        )}

        {modo === "confirmar" && parsed && (
          <>
            <div className="p-4 rounded-field bg-surface-2 space-y-3">
              <p className="text-title2 text-fg leading-tight">
                {nombrePreview}
              </p>
              <div className="space-y-1">
                <DetalleRow etiqueta="Marca" valor={parsed.productoBase.marca} />
                <DetalleRow
                  etiqueta="Categoría"
                  valor={parsed.productoBase.categoria ?? "—"}
                />
                {Object.entries(parsed.atributos).map(([clave, valor]) => (
                  <DetalleRow
                    key={clave}
                    etiqueta={
                      defs.find((d) => d.clave === clave)?.etiqueta ?? clave
                    }
                    valor={valor}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleConfirmar}
              disabled={enviando}
              className="w-full h-14 rounded-field bg-accent text-on-accent text-headline font-semibold disabled:opacity-40 transition-opacity"
            >
              {enviando ? "Creando..." : "Correcto"}
            </button>
            <button
              onClick={() =>
                irAlForm({
                  nombre: parsed.productoBase.nombre,
                  marca: parsed.productoBase.marca,
                  categoria: parsed.productoBase.categoria,
                  atributos: parsed.atributos,
                })
              }
              disabled={enviando}
              className="w-full h-12 rounded-field bg-surface-2 text-fg text-subhead font-semibold disabled:opacity-40"
            >
              Corregir
            </button>
          </>
        )}

        {modo === "form" && (
          <>
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
                className={INPUT_CLASS}
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
                className={INPUT_CLASS}
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
                  className={INPUT_CLASS}
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
                      list={
                        def.sugerencias?.length
                          ? `manual-atributo-${def.clave}`
                          : undefined
                      }
                      value={atributos[def.clave] ?? ""}
                      onChange={(e) => setAtributo(def.clave, e.target.value)}
                      placeholder={PLACEHOLDER_EJEMPLOS[def.clave] ?? def.etiqueta}
                      className={INPUT_CLASS}
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
              onClick={handleSubmitForm}
              disabled={!nombre.trim() || !marca.trim() || enviando}
              className="w-full h-14 rounded-field bg-accent text-on-accent text-headline font-semibold disabled:opacity-40 transition-opacity"
            >
              {enviando ? "Creando..." : "Crear producto"}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

function DetalleRow({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-subhead text-fg-secondary">{etiqueta}</span>
      <span className="text-subhead font-semibold text-fg text-right">{valor}</span>
    </div>
  );
}
