"use client";

import { db } from "@/lib/db";
import { useReposicionStore } from "@/store/reposicion";
import { ProductoBase, ProductoVariante } from "@/types";
import { Archive, CheckCircle2, Package, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ReposicionCard } from "./ReposicionCard";

interface ItemConProducto {
  item: any;
  variante: ProductoVariante;
  base: ProductoBase;
}

type SeccionType = "pendiente" | "repuesto" | "sinStock";

export function ReposicionList() {
  const { items, cargarItems } = useReposicionStore();
  const [itemsConProductos, setItemsConProductos] = useState<ItemConProducto[]>(
    []
  );
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary" />
      </div>
    );
  }

  if (itemsConProductos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Archive size={64} className="mb-4 opacity-50" />
        <p className="text-lg font-semibold">Tu lista está vacía</p>
        <p className="text-sm">Escanea o busca productos para comenzar</p>
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
    <div className={`${colorClass} p-4 rounded-t-xl`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon size={24} className="text-white" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg font-bold">
          {count} productos
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Sección: PENDIENTES */}
      {groupedBySections.pendientes.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <SeccionHeader
            title="Pendientes"
            count={groupedBySections.pendientes.length}
            icon={Package}
            colorClass="bg-gradient-to-r from-cyan-500 to-cyan-600"
          />
          <div className="p-4 space-y-4 bg-cyan-50/30">
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
          <div className="p-4 space-y-4 bg-emerald-50/30">
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
          <div className="p-4 space-y-4 bg-red-50/30">
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
  );
}
