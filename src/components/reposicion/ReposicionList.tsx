"use client";

import { Modal } from "@/components/ui/Modal";
import { useProductosDeItems } from "@/hooks/useProductosDeItems";
import {
  useGuardarListaReposicion,
  useReposicionItems,
} from "@/hooks/useReposicion";
import { EstadoReposicion, ItemReposicion, ProductoBase, ProductoVariante } from "@/types";
import { motion as m } from "framer-motion";
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Package,
  Save,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ReposicionCard } from "./ReposicionCard";
import { ReposicionHeader } from "./ReposicionHeader";
import { SkeletonCard } from "./SkeletonCard";

interface ItemConProducto {
  item: ItemReposicion;
  variante: ProductoVariante;
  base: ProductoBase;
}

const MIN_ITEMS_FOR_COLLAPSE = 10;
const EXPANDED_HEIGHT = "600px";
const COLLAPSED_HEIGHT = "300px";

export function ReposicionList() {
  const { data: items = [], isLoading: loadingItems } = useReposicionItems();
  const { data: productosPorVariante, isLoading: loadingProductos } =
    useProductosDeItems(items.map((i) => i.varianteId));
  const guardarLista = useGuardarListaReposicion();

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
      .filter((v): v is ItemConProducto => v !== null);
  }, [items, productosPorVariante]);

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
      Array.from(map.entries()).map(([, items]) => ({
        productoBase: items[0].base,
        items,
      }));

    return {
      pendientes: toArray(porEstado.pendiente),
      repuestos: toArray(porEstado.repuesto),
      sinStock: toArray(porEstado.sin_stock),
    };
  }, [itemsConProductos]);

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

  const CollapsibleSection = ({
    children,
    isExpanded,
    itemCount,
    bgColor,
  }: {
    children: React.ReactNode;
    isExpanded: boolean;
    itemCount: number;
    bgColor: string;
  }) => {
    const shouldCollapse = itemCount >= MIN_ITEMS_FOR_COLLAPSE;

    if (!shouldCollapse) {
      return <div className={`p-3 sm:p-4 space-y-3 sm:space-y-4 ${bgColor}`}>{children}</div>;
    }

    return (
      <div className="relative">
        <m.div
          initial={false}
          animate={{ maxHeight: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`${isExpanded ? "overflow-y-auto" : "overflow-hidden"} relative`}
        >
          <div className={`p-3 sm:p-4 space-y-3 sm:space-y-4 ${bgColor}`}>{children}</div>
        </m.div>
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-dark-surface to-transparent pointer-events-none" />
        )}
      </div>
    );
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

  if (itemsConProductos.length === 0) {
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

  const SeccionHeader = ({
    title,
    count,
    icon: Icon,
    colorClass,
    isExpanded,
    onToggle,
    showToggleButton,
  }: {
    title: string;
    count: number;
    icon: any;
    colorClass: string;
    isExpanded?: boolean;
    onToggle?: () => void;
    showToggleButton?: boolean;
  }) => (
    <div className={`${colorClass} p-3 sm:p-4 rounded-t-xl`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Icon size={20} className="text-white sm:w-6 sm:h-6 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 sm:px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap">
            {count} producto{count !== 1 ? "s" : ""}
          </span>
          {showToggleButton && onToggle && (
            <m.button
              onClick={onToggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200"
              aria-label={isExpanded ? "Colapsar sección" : "Expandir sección"}
            >
              {isExpanded ? (
                <ChevronUp size={20} className="text-white" />
              ) : (
                <ChevronDown size={20} className="text-white" />
              )}
            </m.button>
          )}
        </div>
      </div>
    </div>
  );

  const totalRepuestos = itemsConProductos.filter((i) => i.item.estado === "repuesto").length;
  const totalSinStock = itemsConProductos.filter((i) => i.item.estado === "sin_stock").length;
  const totalPendientes = itemsConProductos.filter((i) => i.item.estado === "pendiente").length;

  return (
    <>
      <ReposicionHeader />

      <div className="space-y-6 sm:space-y-8 pb-24">
        {groupedBySections.pendientes.length > 0 && (
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg overflow-hidden transition-colors">
            <SeccionHeader
              title="Pendientes"
              count={groupedBySections.pendientes.length}
              icon={Package}
              colorClass="bg-gradient-to-r from-cyan-500 to-cyan-600"
              isExpanded={isPendientesExpanded}
              onToggle={() => setIsPendientesExpanded(!isPendientesExpanded)}
              showToggleButton={groupedBySections.pendientes.length >= MIN_ITEMS_FOR_COLLAPSE}
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
            <SeccionHeader
              title="Repuestos"
              count={groupedBySections.repuestos.length}
              icon={CheckCircle2}
              colorClass="bg-gradient-to-r from-emerald-500 to-emerald-600"
              isExpanded={isRepuestosExpanded}
              onToggle={() => setIsRepuestosExpanded(!isRepuestosExpanded)}
              showToggleButton={groupedBySections.repuestos.length >= MIN_ITEMS_FOR_COLLAPSE}
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
            <SeccionHeader
              title="Sin Stock"
              count={groupedBySections.sinStock.length}
              icon={XCircle}
              colorClass="bg-gradient-to-r from-red-500 to-red-600"
              isExpanded={isSinStockExpanded}
              onToggle={() => setIsSinStockExpanded(!isSinStockExpanded)}
              showToggleButton={groupedBySections.sinStock.length >= MIN_ITEMS_FOR_COLLAPSE}
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

      {itemsConProductos.length > 0 && (
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
              <div>Total de productos: {itemsConProductos.length}</div>
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
