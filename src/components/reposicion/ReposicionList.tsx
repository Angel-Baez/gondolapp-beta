"use client";

import { CollapsibleSection } from "@/components/lists/CollapsibleSection";
import { SearchSortBar } from "@/components/lists/SearchSortBar";
import { SectionHeader } from "@/components/lists/SectionHeader";
import { SkeletonCard } from "@/components/lists/SkeletonCard";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useListFilters } from "@/hooks/useListFilters";
import { useProductosDeItems } from "@/hooks/useProductosDeItems";
import {
  useGuardarListaReposicion,
  useReposicionItems,
} from "@/hooks/useReposicion";
import { EstadoReposicion, ItemReposicion, ProductoBase, ProductoVariante } from "@/types";
import { motion as m } from "framer-motion";
import { Archive, CheckCircle2, Package, Save, XCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ReposicionCard } from "./ReposicionCard";

interface ItemConProducto {
  item: ItemReposicion;
  variante: ProductoVariante;
  base: ProductoBase;
}

const OPCIONES_ORDEN = [
  { value: "recientes", label: "Más recientes" },
  { value: "nombre", label: "Nombre (A-Z)" },
  { value: "cantidad", label: "Cantidad" },
];

interface GrupoProducto {
  productoBase: ProductoBase;
  items: ItemConProducto[];
}

function ordenarGrupos(grupos: GrupoProducto[], orden: string): GrupoProducto[] {
  const copia = [...grupos];
  switch (orden) {
    case "nombre":
      return copia.sort((a, b) => a.productoBase.nombre.localeCompare(b.productoBase.nombre));
    case "cantidad":
      return copia.sort(
        (a, b) =>
          b.items.reduce((sum, i) => sum + i.item.cantidad, 0) -
          a.items.reduce((sum, i) => sum + i.item.cantidad, 0)
      );
    default:
      return copia.sort(
        (a, b) =>
          Math.max(...b.items.map((i) => i.item.agregadoAt.getTime())) -
          Math.max(...a.items.map((i) => i.item.agregadoAt.getTime()))
      );
  }
}

export function ReposicionList() {
  const { data: items = [], isLoading: loadingItems } = useReposicionItems();
  const { data: productosPorVariante, isLoading: loadingProductos } =
    useProductosDeItems(items.map((i) => i.varianteId));
  const guardarLista = useGuardarListaReposicion();
  const { busqueda, setBusqueda, orden, setOrden, coincide } = useListFilters("reposicion", "recientes");

  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [isPendientesExpanded, setIsPendientesExpanded] = useState(false);
  const [isRepuestosExpanded, setIsRepuestosExpanded] = useState(false);
  const [isSinStockExpanded, setIsSinStockExpanded] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpanded = useCallback((productoBaseId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(productoBaseId)) next.delete(productoBaseId);
      else next.add(productoBaseId);
      return next;
    });
  }, []);

  const itemsConProductos = useMemo<ItemConProducto[]>(() => {
    if (!productosPorVariante) return [];
    return items
      .map((item) => {
        const producto = productosPorVariante.get(item.varianteId);
        if (!producto) return null;
        return { item, variante: producto.variante, base: producto.base };
      })
      .filter((v): v is ItemConProducto => v !== null)
      .filter((v) => coincide(v.base.nombre, v.base.marca));
  }, [items, productosPorVariante, coincide]);

  const groupedBySections = useMemo(() => {
    const porEstado: Record<EstadoReposicion, Map<string, ItemConProducto[]>> = {
      pendiente: new Map(),
      repuesto: new Map(),
      sin_stock: new Map(),
    };

    itemsConProductos.forEach((itemCompleto) => {
      const targetMap = porEstado[itemCompleto.item.estado];
      const baseId = itemCompleto.base.id;
      if (!targetMap.has(baseId)) targetMap.set(baseId, []);
      targetMap.get(baseId)!.push(itemCompleto);
    });

    const toArray = (map: Map<string, ItemConProducto[]>) =>
      ordenarGrupos(
        Array.from(map.values()).map((items) => ({ productoBase: items[0].base, items })),
        orden
      );

    return {
      pendientes: toArray(porEstado.pendiente),
      repuestos: toArray(porEstado.repuesto),
      sinStock: toArray(porEstado.sin_stock),
    };
  }, [itemsConProductos, orden]);

  const handleGuardarLista = async () => {
    try {
      await guardarLista.mutateAsync();
      toast.success("Lista guardada correctamente");
      setShowSaveSheet(false);
      setExpandedCards(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar la lista");
    }
  };

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

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-fg-tertiary">
        <m.div
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Archive size={48} className="mb-4 opacity-50" />
        </m.div>
        <p className="text-headline text-fg-secondary text-center">Tu lista está vacía</p>
        <p className="text-footnote text-center mt-1">
          Escaneá o buscá productos para comenzar
        </p>
      </div>
    );
  }

  const totalRepuestos = items.filter((i) => i.estado === "repuesto").length;
  const totalSinStock = items.filter((i) => i.estado === "sin_stock").length;
  const totalPendientes = items.filter((i) => i.estado === "pendiente").length;

  return (
    <>
      <SearchSortBar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        orden={orden}
        onOrdenChange={setOrden}
        opcionesOrden={OPCIONES_ORDEN}
      />

      {itemsConProductos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-fg-tertiary">
          <p className="text-subhead text-center">No hay productos que coincidan con la búsqueda</p>
        </div>
      ) : (
        <div className="space-y-6 pb-8">
          {groupedBySections.pendientes.length > 0 && (
            <div>
              <SectionHeader
                title="Pendientes"
                count={groupedBySections.pendientes.length}
                icon={Package}
                colorClass="text-estado-pendiente"
                isExpanded={isPendientesExpanded}
                onToggle={() => setIsPendientesExpanded(!isPendientesExpanded)}
                showToggleButton={groupedBySections.pendientes.length >= 10}
              />
              <CollapsibleSection
                isExpanded={isPendientesExpanded}
                itemCount={groupedBySections.pendientes.length}
              >
                {groupedBySections.pendientes.map(({ productoBase, items }) => (
                  <ReposicionCard
                    key={productoBase.id}
                    productoBase={productoBase}
                    variantes={items}
                    isExpanded={expandedCards.has(productoBase.id)}
                    onToggleExpand={() => toggleCardExpanded(productoBase.id)}
                  />
                ))}
              </CollapsibleSection>
            </div>
          )}

          {groupedBySections.repuestos.length > 0 && (
            <div>
              <SectionHeader
                title="Repuestos"
                count={groupedBySections.repuestos.length}
                icon={CheckCircle2}
                colorClass="text-estado-repuesto"
                isExpanded={isRepuestosExpanded}
                onToggle={() => setIsRepuestosExpanded(!isRepuestosExpanded)}
                showToggleButton={groupedBySections.repuestos.length >= 10}
              />
              <CollapsibleSection
                isExpanded={isRepuestosExpanded}
                itemCount={groupedBySections.repuestos.length}
              >
                {groupedBySections.repuestos.map(({ productoBase, items }) => (
                  <ReposicionCard
                    key={productoBase.id}
                    productoBase={productoBase}
                    variantes={items}
                    isExpanded={expandedCards.has(productoBase.id)}
                    onToggleExpand={() => toggleCardExpanded(productoBase.id)}
                  />
                ))}
              </CollapsibleSection>
            </div>
          )}

          {groupedBySections.sinStock.length > 0 && (
            <div>
              <SectionHeader
                title="Sin stock"
                count={groupedBySections.sinStock.length}
                icon={XCircle}
                colorClass="text-estado-sin-stock"
                isExpanded={isSinStockExpanded}
                onToggle={() => setIsSinStockExpanded(!isSinStockExpanded)}
                showToggleButton={groupedBySections.sinStock.length >= 10}
              />
              <CollapsibleSection
                isExpanded={isSinStockExpanded}
                itemCount={groupedBySections.sinStock.length}
              >
                {groupedBySections.sinStock.map(({ productoBase, items }) => (
                  <ReposicionCard
                    key={productoBase.id}
                    productoBase={productoBase}
                    variantes={items}
                    isExpanded={expandedCards.has(productoBase.id)}
                    onToggleExpand={() => toggleCardExpanded(productoBase.id)}
                  />
                ))}
              </CollapsibleSection>
            </div>
          )}
        </div>
      )}

      {items.length > 0 && (
        <button
          onClick={() => setShowSaveSheet(true)}
          style={{ bottom: "var(--tabbar-clearance)" }}
          className="fixed right-6 z-20 h-12 px-5 gap-2 glass rounded-full shadow-float flex items-center text-estado-repuesto font-semibold text-subhead"
          aria-label="Guardar lista"
        >
          <Save size={18} />
          Guardar
        </button>
      )}

      <BottomSheet isOpen={showSaveSheet} onClose={() => setShowSaveSheet(false)} title="Guardar lista">
        <div className="space-y-4">
          <p className="text-body text-fg-secondary">
            ¿Deseás guardar esta lista? Se archivará el estado actual y la lista se limpiará para
            empezar una nueva.
          </p>
          <div className="island p-3">
            <div className="text-subhead font-semibold text-fg mb-2">Resumen</div>
            <div className="text-subhead text-fg-secondary space-y-1">
              <div>Total de productos: {items.length}</div>
              <div>Repuestos: {totalRepuestos}</div>
              <div>Sin stock: {totalSinStock}</div>
              <div>Pendientes: {totalPendientes}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSaveSheet(false)}
              disabled={guardarLista.isPending}
              className="flex-1 bg-surface-2 hover:bg-border text-fg-secondary font-semibold h-12 px-4 rounded-field transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarLista}
              disabled={guardarLista.isPending}
              className="flex-1 bg-estado-repuesto text-white font-semibold h-12 px-4 rounded-field transition-colors disabled:opacity-50"
            >
              {guardarLista.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
