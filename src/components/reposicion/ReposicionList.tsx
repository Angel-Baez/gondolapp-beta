"use client";

import { CollapsibleSection } from "@/components/lists/CollapsibleSection";
import { SearchSortBar } from "@/components/lists/SearchSortBar";
import { SectionHeader } from "@/components/lists/SectionHeader";
import { SkeletonCard } from "@/components/lists/SkeletonCard";
import { Modal } from "@/components/ui/Modal";
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
import { ReposicionHeader } from "./ReposicionHeader";

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
  const { busqueda, setBusqueda, orden, setOrden, coincide } = useListFilters("recientes");

  const [showSaveModal, setShowSaveModal] = useState(false);
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
      setShowSaveModal(false);
      setExpandedCards(new Set());
    } catch {
      toast.error("Error al guardar la lista");
    }
  };

  const loading = loadingItems || (items.length > 0 && loadingProductos);

  if (loading) {
    return (
      <div className="space-y-4 py-10 px-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <ReposicionHeader />
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-gray-500 dark:text-gray-400">
          <m.div
            animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Archive size={48} className="mb-3 sm:mb-4 opacity-50 sm:w-16 sm:h-16" />
          </m.div>
          <p className="text-base sm:text-lg font-semibold text-center">Tu lista está vacía</p>
          <p className="text-xs sm:text-sm text-center mt-1">
            Escanea o busca productos para comenzar
          </p>
        </div>
      </>
    );
  }

  const totalRepuestos = items.filter((i) => i.estado === "repuesto").length;
  const totalSinStock = items.filter((i) => i.estado === "sin_stock").length;
  const totalPendientes = items.filter((i) => i.estado === "pendiente").length;

  return (
    <>
      <ReposicionHeader />
      <SearchSortBar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        orden={orden}
        onOrdenChange={setOrden}
        opcionesOrden={OPCIONES_ORDEN}
      />

      {itemsConProductos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-gray-500 dark:text-gray-400">
          <p className="text-sm text-center">No hay productos que coincidan con la búsqueda</p>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8 pb-24">
          {groupedBySections.pendientes.length > 0 && (
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg overflow-hidden transition-colors">
              <SectionHeader
                title="Pendientes"
                count={groupedBySections.pendientes.length}
                icon={Package}
                colorClass="bg-gradient-to-r from-cyan-500 to-cyan-600"
                isExpanded={isPendientesExpanded}
                onToggle={() => setIsPendientesExpanded(!isPendientesExpanded)}
                showToggleButton={groupedBySections.pendientes.length >= 10}
              />
              <CollapsibleSection
                isExpanded={isPendientesExpanded}
                itemCount={groupedBySections.pendientes.length}
                bgColor="bg-cyan-50/30 dark:bg-cyan-900/20"
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
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg overflow-hidden transition-colors">
              <SectionHeader
                title="Repuestos"
                count={groupedBySections.repuestos.length}
                icon={CheckCircle2}
                colorClass="bg-gradient-to-r from-emerald-500 to-emerald-600"
                isExpanded={isRepuestosExpanded}
                onToggle={() => setIsRepuestosExpanded(!isRepuestosExpanded)}
                showToggleButton={groupedBySections.repuestos.length >= 10}
              />
              <CollapsibleSection
                isExpanded={isRepuestosExpanded}
                itemCount={groupedBySections.repuestos.length}
                bgColor="bg-emerald-50/30 dark:bg-emerald-900/20"
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
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg overflow-hidden transition-colors">
              <SectionHeader
                title="Sin Stock"
                count={groupedBySections.sinStock.length}
                icon={XCircle}
                colorClass="bg-gradient-to-r from-red-500 to-red-600"
                isExpanded={isSinStockExpanded}
                onToggle={() => setIsSinStockExpanded(!isSinStockExpanded)}
                showToggleButton={groupedBySections.sinStock.length >= 10}
              />
              <CollapsibleSection
                isExpanded={isSinStockExpanded}
                itemCount={groupedBySections.sinStock.length}
                bgColor="bg-red-50/30 dark:bg-red-900/20"
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
          onClick={() => setShowSaveModal(true)}
          className="fixed bottom-24 right-6 z-20 w-14 h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
          aria-label="Guardar lista"
        >
          <Save size={24} />
        </button>
      )}

      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="Guardar lista">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ¿Deseas guardar esta lista? Se guardará el estado actual y la lista se limpiará para
            comenzar una nueva.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Resumen:
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <div>Total de productos: {items.length}</div>
              <div>Repuestos: {totalRepuestos}</div>
              <div>Sin stock: {totalSinStock}</div>
              <div>Pendientes: {totalPendientes}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSaveModal(false)}
              disabled={guardarLista.isPending}
              className="flex-1 bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-dark-border text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarLista}
              disabled={guardarLista.isPending}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {guardarLista.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
