"use client";

import { Modal } from "@/components/ui/Modal";
import { useReposicionStore } from "@/store/reposicion";
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
  onDeleted: () => void;
}

export function HistorialCard({ lista, onDeleted }: HistorialCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { eliminarListaHistorial } = useReposicionStore();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await eliminarListaHistorial(lista.id);
      toast.success("Lista eliminada correctamente");
      setShowDeleteModal(false);
      onDeleted();
    } catch (error) {
      toast.error("Error al eliminar la lista");
      console.error(error);
    } finally {
      setDeleting(false);
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
      ? Math.round(
          (lista.resumen.totalRepuestos / lista.resumen.totalProductos) * 100
        )
      : 0;

  const itemsPorEstado = {
    repuesto: lista.items.filter((i) => i.estado === "repuesto"),
    sinStock: lista.items.filter((i) => i.estado === "sinStock"),
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
        <div className={`${colorClass} p-2 rounded-lg mb-2`}>
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Icon size={16} />
            <span>
              {titulo} ({items.length})
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-200"
            >
              <div className="font-semibold text-gray-900">
                {item.productoNombre}
                {item.productoMarca && (
                  <span className="text-gray-500 font-normal ml-2">
                    ({item.productoMarca})
                  </span>
                )}
              </div>
              <div className="text-gray-600 text-xs mt-1">
                {item.varianteNombre}
              </div>
              <div className="text-gray-500 text-xs mt-1">
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
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow"
      >
        {/* Header */}
        <div
          className="p-4 cursor-pointer bg-gradient-to-r from-slate-50 to-slate-100"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">
                {formatearFecha(lista.fechaGuardado)}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-semibold">
                  {lista.resumen.totalProductos} productos
                </div>
                {lista.resumen.totalRepuestos > 0 && (
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-semibold">
                    {lista.resumen.totalRepuestos} repuestos ({porcentajeRepuestos}
                    %)
                  </div>
                )}
                {lista.resumen.totalSinStock > 0 && (
                  <div className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-semibold">
                    {lista.resumen.totalSinStock} sin stock
                  </div>
                )}
                {lista.resumen.totalPendientes > 0 && (
                  <div className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-lg text-xs font-semibold">
                    {lista.resumen.totalPendientes} pendientes
                  </div>
                )}
              </div>
            </div>
            <button
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronUp size={20} className="text-gray-600" />
              ) : (
                <ChevronDown size={20} className="text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Detalle expandible */}
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200"
          >
            <div className="p-4">
              <h4 className="font-bold text-gray-900 mb-4 text-sm">
                Detalle de productos
              </h4>

              <SeccionItems
                titulo="Repuestos"
                items={itemsPorEstado.repuesto}
                colorClass="bg-gradient-to-r from-emerald-500 to-emerald-600"
                icon={CheckCircle2}
              />

              <SeccionItems
                titulo="Sin Stock"
                items={itemsPorEstado.sinStock}
                colorClass="bg-gradient-to-r from-red-500 to-red-600"
                icon={XCircle}
              />

              <SeccionItems
                titulo="Pendientes"
                items={itemsPorEstado.pendiente}
                colorClass="bg-gradient-to-r from-cyan-500 to-cyan-600"
                icon={Package}
              />

              {/* Botón eliminar */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full mt-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                <span>Eliminar esta lista</span>
              </button>
            </div>
          </m.div>
        )}
      </m.div>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar lista"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar esta lista? Esta acción no se
            puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
