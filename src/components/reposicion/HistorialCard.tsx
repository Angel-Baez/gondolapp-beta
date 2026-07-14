"use client";

import { useAuth } from "@/components/AuthProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useEliminarListaHistorial } from "@/hooks/useReposicion";
import { ItemHistorial, ListaReposicionHistorial } from "@/types";
import { motion as m } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Package,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface HistorialCardProps {
  lista: ListaReposicionHistorial;
}

export function HistorialCard({ lista }: HistorialCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const eliminarLista = useEliminarListaHistorial();
  // El historial es el registro de auditoría: borrar es de admin (la RLS
  // ya lo bloquea server-side; acá se oculta la acción, spec Fase 3).
  const { rol } = useAuth();
  const puedeEliminar = rol === "admin";

  const handleDelete = async () => {
    try {
      await eliminarLista.mutateAsync(lista.id);
      toast.success("Lista eliminada correctamente");
      setShowDeleteModal(false);
    } catch {
      toast.error("Error al eliminar la lista");
    }
  };

  const formatearFecha = (fecha: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(fecha));
  };

  const porcentajeRepuestos =
    lista.resumen.totalProductos > 0
      ? Math.round((lista.resumen.totalRepuestos / lista.resumen.totalProductos) * 100)
      : 0;

  const itemsPorEstado = {
    repuesto: lista.items.filter((i) => i.estado === "repuesto"),
    sin_stock: lista.items.filter((i) => i.estado === "sin_stock"),
    pendiente: lista.items.filter((i) => i.estado === "pendiente"),
  };

  const SeccionItems = ({
    titulo,
    items,
    colorClass,
    icon: Icon,
  }: {
    titulo: string;
    items: ItemHistorial[];
    colorClass: string;
    icon: any;
  }) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2 px-0.5">
          <Icon size={14} className={colorClass} />
          <span className="text-footnote font-semibold text-fg-secondary uppercase tracking-wide">
            {titulo} ({items.length})
          </span>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="bg-surface-2 p-3 rounded-field text-subhead">
              <div className="font-semibold text-fg">
                {item.productoNombre}
                {item.productoMarca && (
                  <span className="text-fg-secondary font-normal ml-2">
                    ({item.productoMarca})
                  </span>
                )}
              </div>
              <div className="text-fg-secondary text-footnote mt-1">{item.varianteNombre}</div>
              <div className="text-fg-tertiary text-footnote mt-1">
                Cantidad: {item.cantidad}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="island overflow-hidden"
      >
        <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-footnote text-fg-secondary mb-1">
                {formatearFecha(lista.fechaGuardado)}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="bg-accent-soft text-accent px-3 py-1 rounded-chip text-caption font-semibold">
                  {lista.resumen.totalProductos} productos
                </div>
                {lista.resumen.totalRepuestos > 0 && (
                  <div className="bg-estado-repuesto/15 text-estado-repuesto px-3 py-1 rounded-chip text-caption font-semibold">
                    {lista.resumen.totalRepuestos} repuestos ({porcentajeRepuestos}%)
                  </div>
                )}
                {lista.resumen.totalSinStock > 0 && (
                  <div className="bg-estado-sin-stock/15 text-estado-sin-stock px-3 py-1 rounded-chip text-caption font-semibold">
                    {lista.resumen.totalSinStock} sin stock
                  </div>
                )}
                {lista.resumen.totalPendientes > 0 && (
                  <div className="bg-estado-pendiente/15 text-estado-pendiente px-3 py-1 rounded-chip text-caption font-semibold">
                    {lista.resumen.totalPendientes} pendientes
                  </div>
                )}
              </div>
            </div>
            <button
              className="tap-compact w-9 h-9 flex items-center justify-center hover:bg-surface-2 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronUp size={20} className="text-fg-secondary" />
              ) : (
                <ChevronDown size={20} className="text-fg-secondary" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="p-4">
              <h4 className="text-subhead font-semibold text-fg mb-4">Detalle de productos</h4>

              <SeccionItems
                titulo="Repuestos"
                items={itemsPorEstado.repuesto}
                colorClass="text-estado-repuesto"
                icon={CheckCircle2}
              />

              <SeccionItems
                titulo="Sin stock"
                items={itemsPorEstado.sin_stock}
                colorClass="text-estado-sin-stock"
                icon={XCircle}
              />

              <SeccionItems
                titulo="Pendientes"
                items={itemsPorEstado.pendiente}
                colorClass="text-estado-pendiente"
                icon={Package}
              />

              {puedeEliminar && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full mt-4 h-12 bg-alert-critico/10 hover:bg-alert-critico/20 text-alert-critico font-semibold rounded-field transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  <span>Eliminar esta lista</span>
                </button>
              )}
            </div>
          </m.div>
        )}
      </m.div>

      <BottomSheet isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Eliminar lista">
        <div className="space-y-4">
          <p className="text-body text-fg-secondary">
            ¿Estás seguro de que querés eliminar esta lista? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={eliminarLista.isPending}
              className="flex-1 bg-surface-2 hover:bg-border text-fg-secondary font-semibold h-12 px-4 rounded-field transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={eliminarLista.isPending}
              className="flex-1 bg-alert-critico text-white font-semibold h-12 px-4 rounded-field transition-colors disabled:opacity-50"
            >
              {eliminarLista.isPending ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
