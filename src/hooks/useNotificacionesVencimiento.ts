"use client";

import {
  actualizarAppBadge,
  esUrgente,
  guardarNotificados,
  ItemNotificable,
  leerNotificados,
  mostrarNotificacionVencimientos,
  podarNotificados,
  seleccionarItemsANotificar,
  tienePermiso,
} from "@/lib/notificacionesVencimiento";
import { useNotificacionesStore } from "@/store/notificaciones";
import { useEffect, useMemo } from "react";
import { useProductosDeItems } from "./useProductosDeItems";
import { useVencimientoItems } from "./useVencimiento";

/**
 * Mantiene el badge del ícono de la app y dispara notificaciones locales
 * cuando un item entra en nivel urgente (crítico o vencido). Montarlo una
 * sola vez donde viva la lista (HomePage); expone el contador de urgentes
 * para el badge del tab.
 */
export function useNotificacionesVencimiento() {
  const { data: items = [] } = useVencimientoItems();
  const { data: productosPorVariante } = useProductosDeItems(
    items.map((i) => i.varianteId)
  );
  const habilitadas = useNotificacionesStore((s) => s.habilitadas);

  const urgentes = useMemo(
    () => items.filter((item) => esUrgente(item.alertaNivel)),
    [items]
  );

  useEffect(() => {
    actualizarAppBadge(urgentes.length);
  }, [urgentes.length]);

  useEffect(() => {
    if (!habilitadas || !tienePermiso()) return;
    // Esperar los nombres del catálogo: notificar "Producto" no sirve de nada.
    if (urgentes.length > 0 && !productosPorVariante) return;

    const notificables: ItemNotificable[] = urgentes.map((item) => ({
      id: item.id,
      nombre:
        productosPorVariante?.[item.varianteId]?.variante.nombreCompleto ??
        "Producto",
      alertaNivel: item.alertaNivel,
      fechaVencimiento: item.fechaVencimiento,
    }));

    const registro = leerNotificados();
    const nuevos = seleccionarItemsANotificar(notificables, registro);
    if (nuevos.length > 0) {
      void mostrarNotificacionVencimientos(nuevos);
    }
    const actualizado = podarNotificados(
      {
        ...registro,
        ...Object.fromEntries(nuevos.map((item) => [item.id, item.alertaNivel])),
      },
      notificables
    );
    guardarNotificados(actualizado);
  }, [urgentes, productosPorVariante, habilitadas]);

  return { urgentesCount: urgentes.length };
}
