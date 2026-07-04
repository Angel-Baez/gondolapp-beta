"use client";

import { CollapsibleSection } from "@/components/lists/CollapsibleSection";
import { SearchSortBar } from "@/components/lists/SearchSortBar";
import { SectionHeader } from "@/components/lists/SectionHeader";
import { SelectionActionBar } from "@/components/lists/SelectionActionBar";
import { SkeletonCard } from "@/components/lists/SkeletonCard";
import { Button, Input } from "@/components/ui";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useListFilters } from "@/hooks/useListFilters";
import { useProductosDeItems } from "@/hooks/useProductosDeItems";
import {
  useActualizarFechaVencimiento,
  useRetirarItemsMasivo,
  useVencimientoItems,
} from "@/hooks/useVencimiento";
import { useSeleccionMultiple } from "@/hooks/useSeleccionMultiple";
import { AlertaNivel, ItemVencimientoConAlerta, ProductoVariante } from "@/types";
import { motion as m } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ListChecks,
  PackageCheck,
  Skull,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { VencimientoItem } from "./VencimientoItem";

interface ItemConVariante {
  item: ItemVencimientoConAlerta;
  variante: ProductoVariante;
}

const SECCIONES: Array<{
  nivel: AlertaNivel;
  titulo: string;
  icon: any;
  colorClass: string;
}> = [
  { nivel: "vencido", titulo: "Vencidos", icon: Skull, colorClass: "text-alert-vencido" },
  { nivel: "critico", titulo: "Críticos (0-15 días)", icon: AlertCircle, colorClass: "text-alert-critico" },
  { nivel: "advertencia", titulo: "Advertencia (15-30 días)", icon: AlertTriangle, colorClass: "text-alert-advertencia" },
  { nivel: "precaucion", titulo: "Precaución (30-60 días)", icon: Zap, colorClass: "text-alert-precaucion" },
  { nivel: "normal", titulo: "Normales (+60 días)", icon: CheckCircle2, colorClass: "text-alert-normal" },
];

const OPCIONES_ORDEN = [
  { value: "vencimiento", label: "Por vencer primero" },
  { value: "nombre", label: "Nombre (A-Z)" },
  { value: "recientes", label: "Más recientes" },
];

function ordenar(items: ItemConVariante[], orden: string): ItemConVariante[] {
  const copia = [...items];
  switch (orden) {
    case "nombre":
      return copia.sort((a, b) => a.variante.nombreCompleto.localeCompare(b.variante.nombreCompleto));
    case "recientes":
      return copia.sort((a, b) => b.item.agregadoAt.getTime() - a.item.agregadoAt.getTime());
    default:
      return copia.sort((a, b) => a.item.fechaVencimiento.getTime() - b.item.fechaVencimiento.getTime());
  }
}

export function VencimientoList() {
  const { data: items = [], isLoading: loadingItems } = useVencimientoItems();
  const { data: productosPorVariante, isLoading: loadingProductos } = useProductosDeItems(
    items.map((i) => i.varianteId)
  );
  const actualizarFecha = useActualizarFechaVencimiento();
  const retirarMasivo = useRetirarItemsMasivo();
  const seleccion = useSeleccionMultiple();
  const { busqueda, setBusqueda, orden, setOrden, coincide } = useListFilters("vencimiento", "vencimiento");

  const [editingItem, setEditingItem] = useState<ItemVencimientoConAlerta | null>(null);
  const [newDate, setNewDate] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<AlertaNivel>>(new Set());

  const toggleSection = (nivel: AlertaNivel) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(nivel)) next.delete(nivel);
      else next.add(nivel);
      return next;
    });
  };

  const itemsConVariantes = useMemo<ItemConVariante[]>(() => {
    if (!productosPorVariante) return [];
    return items
      .map((item) => {
        const producto = productosPorVariante[item.varianteId];
        if (!producto) return null;
        return { item, variante: producto.variante };
      })
      .filter((v): v is ItemConVariante => v !== null)
      .filter((v) => coincide(v.variante.nombreCompleto));
  }, [items, productosPorVariante, coincide]);

  const itemsByAlertLevel = useMemo(() => {
    const grouped: Record<AlertaNivel, ItemConVariante[]> = {
      vencido: [],
      critico: [],
      advertencia: [],
      precaucion: [],
      normal: [],
    };
    itemsConVariantes.forEach((itemCompleto) => {
      grouped[itemCompleto.item.alertaNivel].push(itemCompleto);
    });
    for (const nivel of Object.keys(grouped) as AlertaNivel[]) {
      grouped[nivel] = ordenar(grouped[nivel], orden);
    }
    return grouped;
  }, [itemsConVariantes, orden]);

  const handleEditClick = (item: ItemVencimientoConAlerta) => {
    setEditingItem(item);
    setNewDate(item.fechaVencimiento.toISOString().split("T")[0]);
  };

  const handleSaveDate = async () => {
    if (editingItem && newDate) {
      await actualizarFecha.mutateAsync({
        id: editingItem.id,
        fechaVencimiento: new Date(newDate),
      });
      setEditingItem(null);
      setNewDate("");
    }
  };

  const totalItems = items.length;
  const itemsUrgentes = items.filter((i) => i.alertaNivel === "vencido" || i.alertaNivel === "critico").length;
  const loading = loadingItems || (items.length > 0 && loadingProductos);

  if (loading) {
    return (
      <div className="space-y-3 py-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-fg-tertiary">
        <m.div
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Clock size={48} className="mb-4 opacity-50" />
        </m.div>
        <p className="text-headline text-fg-secondary text-center">
          No hay productos con vencimiento registrado
        </p>
        <p className="text-footnote text-center mt-1">
          Escaneá productos para rastrear sus fechas de vencimiento
        </p>
      </div>
    );
  }

  const idsVisibles = itemsConVariantes.map((i) => i.item.id);
  const todosSeleccionados = idsVisibles.length > 0 && seleccion.cantidad === idsVisibles.length;

  return (
    <div className="pb-8">
      {itemsUrgentes > 0 && (
        <div className="mb-4 flex items-start gap-2 p-3 island border-l-[3px] border-l-alert-critico">
          <AlertTriangle size={18} className="text-alert-critico flex-shrink-0 mt-0.5" />
          <p className="text-subhead font-semibold text-alert-critico leading-tight">
            {itemsUrgentes} producto{itemsUrgentes > 1 ? "s" : ""} urgente
            {itemsUrgentes > 1 ? "s" : ""} (vencido{itemsUrgentes > 1 ? "s" : ""} o por vencer)
          </p>
        </div>
      )}

      {!seleccion.activo && (
        <div className="flex justify-end mb-2">
          <button
            onClick={seleccion.activar}
            className="flex items-center gap-1.5 text-footnote font-semibold text-fg-secondary"
          >
            <ListChecks size={16} />
            Seleccionar
          </button>
        </div>
      )}

      <SearchSortBar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        orden={orden}
        onOrdenChange={setOrden}
        opcionesOrden={OPCIONES_ORDEN}
      />

      {itemsConVariantes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-fg-tertiary">
          <p className="text-subhead text-center">No hay productos que coincidan con la búsqueda</p>
        </div>
      ) : (
        <div className="space-y-6">
          {SECCIONES.map(({ nivel, titulo, icon, colorClass }) => {
            const itemsSeccion = itemsByAlertLevel[nivel];
            if (itemsSeccion.length === 0) return null;
            const isExpanded = expandedSections.has(nivel);

            return (
              <div key={nivel}>
                <SectionHeader
                  title={titulo}
                  count={itemsSeccion.length}
                  icon={icon}
                  colorClass={colorClass}
                  isExpanded={isExpanded}
                  onToggle={() => toggleSection(nivel)}
                  showToggleButton={itemsSeccion.length >= 10}
                />
                <CollapsibleSection isExpanded={isExpanded} itemCount={itemsSeccion.length}>
                  {itemsSeccion.map(({ item, variante }) => (
                    <VencimientoItem
                      key={item.id}
                      item={item}
                      variante={variante}
                      onEdit={() => handleEditClick(item)}
                      seleccionActiva={seleccion.activo}
                      estaSeleccionado={seleccion.estaSeleccionado(item.id)}
                      onToggleSeleccion={() => seleccion.toggle(item.id)}
                    />
                  ))}
                </CollapsibleSection>
              </div>
            );
          })}
        </div>
      )}

      {seleccion.activo && (
        <SelectionActionBar
          cantidad={seleccion.cantidad}
          onCancelar={seleccion.cancelar}
          onSeleccionarTodos={() =>
            todosSeleccionados
              ? seleccion.limpiarSeleccion()
              : seleccion.seleccionarTodos(idsVisibles)
          }
          todosSeleccionados={todosSeleccionados}
          acciones={[
            {
              label: "Retirar seleccionados",
              icon: PackageCheck,
              variant: "primary",
              onClick: () =>
                retirarMasivo.mutate(seleccion.seleccionados, {
                  onSuccess: seleccion.limpiarSeleccion,
                }),
            },
          ]}
        />
      )}

      <BottomSheet
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Actualizar fecha de vencimiento"
      >
        <div className="space-y-4">
          <p className="text-subhead text-fg-secondary">
            Actualizá la fecha de vencimiento para este producto.
          </p>

          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            label="Nueva fecha de vencimiento"
          />

          <Button onClick={handleSaveDate} disabled={actualizarFecha.isPending} className="w-full">
            {actualizarFecha.isPending ? "Guardando..." : "Guardar fecha"}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
