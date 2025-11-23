"use client";

import { db } from "@/lib/db";
import { useReposicionStore } from "@/store/reposicion";
import { ProductoBase, ProductoVariante } from "@/types";
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Package,
  Save,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ReposicionCard } from "./ReposicionCard";
import { ReposicionHeader } from "./ReposicionHeader";
import { SkeletonCard } from "./SkeletonCard";
import { motion as m } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import toast from "react-hot-toast";

interface ItemConProducto {
  item: any;
  variante: ProductoVariante;
  base: ProductoBase;
}

type SeccionType = "pendiente" | "repuesto" | "sinStock";

export function ReposicionList() {
  const { items, cargarItems, guardarListaActual } = useReposicionStore();
  const [itemsConProductos, setItemsConProductos] = useState<ItemConProducto[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados para controlar el colapso de cada sección
  const [isPendientesExpanded, setIsPendientesExpanded] = useState(false);
  const [isRepuestosExpanded, setIsRepuestosExpanded] = useState(false);
  const [isSinStockExpanded, setIsSinStockExpanded] = useState(false);

  // Constantes para secciones colapsables
  const MIN_ITEMS_FOR_COLLAPSE = 10;
  const EXPANDED_HEIGHT = "600px";
  const COLLAPSED_HEIGHT = "300px";

  // Cache de productos para evitar recargas innecesarias
  const productosCache = useRef<
    Map<string, { variante: ProductoVariante; base: ProductoBase }>
  >(new Map());

  useEffect(() => {
    cargarItems();
  }, []);

  // Cargar datos de productos para cada item (con cache)
  useEffect(() => {
    const cargarProductos = async () => {
      // Solo mostrar loading en la primera carga
      if (productosCache.current.size === 0 && items.length > 0) {
        setLoading(true);
      }

      const itemsCompletos = await Promise.all(
        items.map(async (item) => {
          // Buscar en cache primero
          let productoData = productosCache.current.get(item.varianteId);

          if (!productoData) {
            // Si no está en cache, cargar desde DB
            const variante = await db.productosVariantes.get(item.varianteId);
            if (!variante) return null;

            const base = await db.productosBase.get(variante.productoBaseId);
            if (!base) return null;

            productoData = { variante, base };
            // Guardar en cache
            productosCache.current.set(item.varianteId, productoData);
          }

          return {
            item,
            variante: productoData.variante,
            base: productoData.base,
          };
        })
      );

      setItemsConProductos(
        itemsCompletos.filter((item) => item !== null) as ItemConProducto[]
      );
      setLoading(false);
    };

    if (items.length > 0) {
      cargarProductos();
    } else {
      setItemsConProductos([]);
      setLoading(false);
    }
  }, [items]);

  // Agrupar items por sección y producto base
  const groupedBySections = useMemo(() => {
    const pendientes: Map<string, ItemConProducto[]> = new Map();
    const repuestos: Map<string, ItemConProducto[]> = new Map();
    const sinStock: Map<string, ItemConProducto[]> = new Map();

    itemsConProductos.forEach((itemCompleto) => {
      const baseId = itemCompleto.base.id;
      let targetMap: Map<string, ItemConProducto[]>;

      if (itemCompleto.item.repuesto) {
        targetMap = repuestos;
      } else if (itemCompleto.item.sinStock) {
        targetMap = sinStock;
      } else {
        targetMap = pendientes;
      }

      if (!targetMap.has(baseId)) {
        targetMap.set(baseId, []);
      }
      targetMap.get(baseId)!.push(itemCompleto);
    });

    return {
      pendientes: Array.from(pendientes.entries()).map(([, items]) => ({
        productoBase: items[0].base,
        items,
      })),
      repuestos: Array.from(repuestos.entries()).map(([, items]) => ({
        productoBase: items[0].base,
        items,
      })),
      sinStock: Array.from(sinStock.entries()).map(([, items]) => ({
        productoBase: items[0].base,
        items,
      })),
    };
  }, [itemsConProductos]);

  const handleGuardarLista = async () => {
    setSaving(true);
    try {
      await guardarListaActual();
      toast.success("Lista guardada correctamente");
      setShowSaveModal(false);
      // Recargar items (la lista ahora debería estar vacía)
      await cargarItems();
    } catch (error) {
      toast.error("Error al guardar la lista");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Componente wrapper para secciones con colapso
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
      // Comportamiento normal si hay menos de 10 productos
      return <div className={`p-3 sm:p-4 space-y-3 sm:space-y-4 ${bgColor}`}>{children}</div>;
    }

    return (
      <div className="relative">
        <m.div
          initial={false}
          animate={{
            maxHeight: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`${isExpanded ? "overflow-y-auto" : "overflow-hidden"} relative`}
        >
          <div className={`p-3 sm:p-4 space-y-3 sm:space-y-4 ${bgColor}`}>
            {children}
          </div>
        </m.div>
        
        {/* Gradiente fade-out cuando está colapsado */}
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>
    );
  };

  if (loading) {
    // Mostrar 3 skeletons de cards mientras carga
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
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-gray-500">
          <m.div
                    animate={{
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
          <Archive
            size={48}
            className="mb-3 sm:mb-4 opacity-50 sm:w-16 sm:h-16"
          />
          </m.div>
          <p className="text-base sm:text-lg font-semibold text-center">
            Tu lista está vacía
          </p>
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

  return (
    <>
      <ReposicionHeader />

      <div className="space-y-6 sm:space-y-8 pb-24">
      {/* Sección: PENDIENTES */}
      {groupedBySections.pendientes.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
            bgColor="bg-cyan-50/30"
          >
            {groupedBySections.pendientes.map(({ productoBase, items }) => (
              <ReposicionCard
                key={productoBase.id}
                productoBase={productoBase}
                variantes={items}
                seccion="pendiente"
              />
            ))}
          </CollapsibleSection>
        </div>
      )}

      {/* Sección: REPUESTOS */}
      {groupedBySections.repuestos.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
            bgColor="bg-emerald-50/30"
          >
            {groupedBySections.repuestos.map(({ productoBase, items }) => (
              <ReposicionCard
                key={productoBase.id}
                productoBase={productoBase}
                variantes={items}
                seccion="repuesto"
              />
            ))}
          </CollapsibleSection>
        </div>
      )}

      {/* Sección: SIN STOCK */}
      {groupedBySections.sinStock.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
            bgColor="bg-red-50/30"
          >
            {groupedBySections.sinStock.map(({ productoBase, items }) => (
              <ReposicionCard
                key={productoBase.id}
                productoBase={productoBase}
                variantes={items}
                seccion="sinStock"
              />
            ))}
          </CollapsibleSection>
        </div>
      )}
    </div>

    {/* Botón Guardar Lista - Solo si hay items */}
    {itemsConProductos.length > 0 && (
      <button
        onClick={() => setShowSaveModal(true)}
        className="fixed bottom-24 right-6 z-20 w-14 h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
        aria-label="Guardar lista"
      >
        <Save size={24} />
      </button>
    )}

    {/* Modal de confirmación de guardado */}
    <Modal
      isOpen={showSaveModal}
      onClose={() => setShowSaveModal(false)}
      title="Guardar lista"
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          ¿Deseas guardar esta lista? Se guardará el estado actual y la lista
          se limpiará para comenzar una nueva.
        </p>
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm font-semibold text-blue-900 mb-2">
            Resumen:
          </div>
          <div className="text-sm text-blue-800 space-y-1">
            <div>Total de productos: {itemsConProductos.length}</div>
            <div>
              Repuestos:{" "}
              {itemsConProductos.filter((i) => i.item.repuesto).length}
            </div>
            <div>
              Sin stock:{" "}
              {itemsConProductos.filter((i) => i.item.sinStock).length}
            </div>
            <div>
              Pendientes:{" "}
              {
                itemsConProductos.filter(
                  (i) => !i.item.repuesto && !i.item.sinStock
                ).length
              }
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSaveModal(false)}
            disabled={saving}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardarLista}
            disabled={saving}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  </>
  );
}
