"use client";

import { db } from "@/lib/db";
import { useReposicionStore } from "@/store/reposicion";
import { ProductoBase, ProductoVariante } from "@/types";
import {
  Archive,
  CheckCircle2,
  History,
  Package,
  Save,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ReposicionCard } from "./ReposicionCard";
import { SkeletonCard } from "./SkeletonCard";
import { motion as m } from "framer-motion";
import Link from "next/link";
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
    );
  }

  const SeccionHeader = ({
    title,
    count,
    icon: Icon,
    colorClass,
  }: {
    title: string;
    count: number;
    icon: any;
    colorClass: string;
  }) => (
    <div className={`${colorClass} p-3 sm:p-4 rounded-t-xl`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Icon size={20} className="text-white sm:w-6 sm:h-6 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <span className="px-2.5 sm:px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap">
          {count} producto{count !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Header con link a historial */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Lista de Reposición
        </h2>
        <Link
          href="/reposicion/historial"
          className="flex items-center gap-2 text-sm sm:text-base text-cyan-600 hover:text-cyan-700 font-semibold transition-colors bg-cyan-50 px-3 py-2 rounded-lg hover:bg-cyan-100"
        >
          <History size={20} />
          <span className="hidden sm:inline">Ver Historial</span>
          <span className="sm:hidden">Historial</span>
        </Link>
      </div>

      <div className="space-y-6 sm:space-y-8 pb-24">
      {/* Sección: PENDIENTES */}
      {groupedBySections.pendientes.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <SeccionHeader
            title="Pendientes"
            count={groupedBySections.pendientes.length}
            icon={Package}
            colorClass="bg-gradient-to-r from-cyan-500 to-cyan-600"
          />
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 bg-cyan-50/30">
            {groupedBySections.pendientes.map(({ productoBase, items }) => (
              <ReposicionCard
                key={productoBase.id}
                productoBase={productoBase}
                variantes={items}
                seccion="pendiente"
              />
            ))}
          </div>
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
          />
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 bg-emerald-50/30">
            {groupedBySections.repuestos.map(({ productoBase, items }) => (
              <ReposicionCard
                key={productoBase.id}
                productoBase={productoBase}
                variantes={items}
                seccion="repuesto"
              />
            ))}
          </div>
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
          />
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 bg-red-50/30">
            {groupedBySections.sinStock.map(({ productoBase, items }) => (
              <ReposicionCard
                key={productoBase.id}
                productoBase={productoBase}
                variantes={items}
                seccion="sinStock"
              />
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Botón Guardar Lista - Solo si hay items */}
    {itemsConProductos.length > 0 && (
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 z-20 pb-safe">
        <button
          onClick={() => setShowSaveModal(true)}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 max-w-md mx-auto"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <Save size={24} />
          <span>Guardar Lista y Limpiar</span>
        </button>
      </div>
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
