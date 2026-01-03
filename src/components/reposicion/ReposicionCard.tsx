"use client";

import { useHaptics } from "@/hooks/useHaptics";
import { useReposicionStore } from "@/store/reposicion";
import { ItemReposicion, ProductoBase, ProductoVariante } from "@/types";
import { AnimatePresence, motion as m } from "framer-motion";
import {
  Ban,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Badge, IconButton } from "../ui";
import { GlassCard } from "../ui/GlassCard";

interface ReposicionCardProps {
  productoBase: ProductoBase;
  variantes: Array<{
    item: ItemReposicion;
    variante: ProductoVariante;
  }>;
  seccion: "pendiente" | "repuesto" | "sinStock";
  // ✅ Estado de expansión controlado desde el padre para evitar colapsos
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ReposicionCard({
  productoBase,
  variantes,
  seccion,
  isExpanded,
  onToggleExpand,
}: ReposicionCardProps) {
  const { marcarRepuesto, marcarSinStock, actualizarCantidad, eliminarItem } =
    useReposicionStore();
  const { haptic } = useHaptics();

  const cantidadTotal = variantes.reduce((acc, v) => acc + v.item.cantidad, 0);

  // Colores según sección con neon accents
  const sectionColors = {
    pendiente: {
      border: "border-neon-cyan/30",
      badge: "bg-neon-cyan/20 border-2 border-neon-cyan/30 text-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)]",
      hover: "hover:bg-neon-cyan/5",
    },
    repuesto: {
      border: "border-emerald-400/30",
      badge: "bg-emerald-500/20 border-2 border-emerald-400/30 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]",
      hover: "hover:bg-emerald-500/5",
    },
    sinStock: {
      border: "border-red-400/30",
      badge: "bg-red-500/20 border-2 border-red-400/30 text-red-400 shadow-[0_0_20px_rgba(248,113,113,0.3)]",
      hover: "hover:bg-red-500/5",
    },
  };

  const colors = sectionColors[seccion];

  return (
    <GlassCard
      variant="medium"
      className={`border-2 ${colors.border} transition-all`}
    >
      {/* Header */}
      <div
        onClick={onToggleExpand}
        className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer ${colors.hover} transition-colors`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {productoBase.imagen && (
            <img
              src={productoBase.imagen}
              alt={productoBase.nombre}
              className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg flex-shrink-0 ring-2 ring-white/10"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-base sm:text-lg leading-tight truncate">
              {productoBase.nombre}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {productoBase.marca && (
                <span className="text-xs text-white/60 truncate">
                  {productoBase.marca}
                </span>
              )}
              <Badge variant="primary">{variantes.length} variantes</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
          {cantidadTotal > 0 && (
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${colors.badge}`}
            >
              <span className="font-bold text-lg">x{cantidadTotal}</span>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp
              size={20}
              className="sm:w-6 sm:h-6 text-white/70 flex-shrink-0"
            />
          ) : (
            <ChevronDown
              size={20}
              className="sm:w-6 sm:h-6 text-white/70 flex-shrink-0"
            />
          )}
        </div>
      </div>

      {/* Body - Variantes */}
      <AnimatePresence>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10"
          >
            <div className="divide-y divide-white/10">
              {variantes.map(({ item, variante }) => (
                <div key={item.id} className="p-3 sm:p-4">
                  <div className="space-y-3">
                    {/* Info */}
                    <div className="flex items-start gap-3">
                      {variante.imagen && (
                        <img
                          src={variante.imagen}
                          alt={variante.nombreCompleto}
                          className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0 ring-2 ring-white/10"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm sm:text-base leading-tight">
                          {variante.nombreCompleto}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {variante.tamano && (
                            <span className="text-xs text-white/60">
                              {variante.tamano}
                            </span>
                          )}
                          {item.repuesto && (
                            <Badge variant="success">REPUESTO</Badge>
                          )}
                          {item.sinStock && (
                            <Badge variant="danger">SIN STOCK</Badge>
                          )}
                          {!item.repuesto && !item.sinStock && (
                            <Badge variant="default">PENDIENTE</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                      {/* Quantity Control */}
                      <div className="flex items-center gap-3">
                        {!item.repuesto && !item.sinStock && (
                          <div className="flex items-center justify-between rounded-2xl bg-black/20 backdrop-blur-md p-1 border border-white/10">
                            {/* ✨ Botón MENOS minimalista */}
                            <m.button
                              whileTap={{ scale: 0.85 }}
                              whileHover={{ scale: 1.05 }}
                              onClick={() =>
                                actualizarCantidad(item.id, item.cantidad - 1)
                              }
                              className="h-10 w-12 text-2xl text-white/70 hover:text-white transition-colors"
                            >
                              -
                            </m.button>
                            <span className="text-white font-mono text-lg px-2">
                              {item.cantidad}
                            </span>
                            {/* ✨ Botón MÁS minimalista */}
                            <m.button
                              whileTap={{ scale: 0.85 }}
                              whileHover={{ scale: 1.05 }}
                              onClick={() =>
                                actualizarCantidad(item.id, item.cantidad + 1)
                              }
                              className="h-10 w-12 text-2xl text-white/70 hover:text-white transition-colors"
                            >
                              +
                            </m.button>
                          </div>
                        )}

                        {(item.repuesto || item.sinStock) && (
                          <span className="px-3 py-1.5 bg-white/10 text-white rounded-lg font-bold text-sm backdrop-blur-md">
                            x{item.cantidad}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {/* ✨ BOTÓN REPUESTO - Icono animado */}
                        <IconButton
                          variant={item.repuesto ? "primary" : "ghost"}
                          onClick={() => {
                            marcarRepuesto(item.id, !item.repuesto);
                            haptic(item.repuesto ? 50 : [30, 30, 30]);

                            if (!item.repuesto) {
                              toast.success(
                                <m.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1.2, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="flex items-center gap-2"
                                >
                                  {/* ✅ Icono con rotación */}
                                  <m.div
                                    initial={{ rotate: -180, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 200,
                                    }}
                                  >
                                    <CheckCircle className="text-emerald-500 w-5 h-5" />
                                  </m.div>
                                  <span>Producto marcado como repuesto</span>
                                </m.div>,
                                { duration: 2000 }
                              );
                            } else {
                              toast(
                                <m.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="flex items-center gap-2"
                                >
                                  {/* 🔄 Icono con spin */}
                                  <m.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                  >
                                    <RefreshCw className="text-cyan-500 w-5 h-5" />
                                  </m.div>
                                  <span>Producto desmarcado como repuesto</span>
                                </m.div>,
                                { duration: 2000 }
                              );
                            }
                          }}
                          title={
                            item.repuesto
                              ? "Desmarcar repuesto"
                              : "Marcar como repuesto"
                          }
                          className="w-10 h-10 sm:w-11 sm:h-11"
                        >
                          {/* ✨ Icono con bounce al activar */}
                          <m.div
                            animate={
                              item.repuesto
                                ? { scale: [1, 1.2, 1] }
                                : { scale: 1 }
                            }
                            transition={{ duration: 0.3 }}
                          >
                            <CheckCircle size={20} className="sm:w-6 sm:h-6" />
                          </m.div>
                        </IconButton>

                        {/* ✨ BOTÓN SIN STOCK - Icono animado */}
                        <IconButton
                          variant={item.sinStock ? "destructive" : "ghost"}
                          onClick={() => {
                            marcarSinStock(item.id, !item.sinStock);
                            haptic(item.sinStock ? 50 : [30, 30, 30]);

                            if (!item.sinStock) {
                              toast.success(
                                <m.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="flex items-center gap-2"
                                >
                                  {/* 🚫 Icono con shake */}
                                  <m.div
                                    initial={{ x: -10 }}
                                    animate={{ x: [0, -5, 5, -5, 0] }}
                                    transition={{ duration: 0.5 }}
                                  >
                                    <Ban className="text-red-500 w-5 h-5" />
                                  </m.div>
                                  <span>Producto marcado sin stock</span>
                                </m.div>,
                                { duration: 2000 }
                              );
                            } else {
                              toast(
                                <m.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="flex items-center gap-2"
                                >
                                  {/* 🔄 Icono con spin */}
                                  <m.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                  >
                                    <RefreshCw className="text-cyan-500 w-5 h-5" />
                                  </m.div>
                                  <span>Producto reactivado</span>
                                </m.div>,
                                { duration: 2000 }
                              );
                            }
                          }}
                          title={
                            item.sinStock
                              ? "Desmarcar sin stock"
                              : "Marcar como sin stock"
                          }
                          className="w-10 h-10 sm:w-11 sm:h-11"
                        >
                          {/* ✨ Icono con pulse al activar */}
                          <m.div
                            animate={
                              item.sinStock
                                ? {
                                    scale: [1, 1.1, 1],
                                    opacity: [1, 0.8, 1],
                                  }
                                : { scale: 1 }
                            }
                            transition={{
                              duration: 0.6,
                              repeat: item.sinStock ? Infinity : 0,
                              repeatDelay: 1,
                            }}
                          >
                            <XCircle size={20} className="sm:w-6 sm:h-6" />
                          </m.div>
                        </IconButton>

                        {/* ✨ BOTÓN ELIMINAR - Icono animado */}
                        <IconButton
                          variant="ghost"
                          onClick={() => {
                            eliminarItem(item.id);
                            haptic([50, 100, 50]); // Vibración de confirmación

                            toast.error(
                              <m.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center gap-2"
                              >
                                {/* 🗑️ Icono con fade out */}
                                <m.div
                                  initial={{ y: 0 }}
                                  animate={{ y: [0, -5, 0] }}
                                  transition={{ duration: 0.4 }}
                                >
                                  <Trash2 className="text-red-500 w-5 h-5" />
                                </m.div>
                                <span>Producto eliminado</span>
                              </m.div>,
                              { duration: 2000 }
                            );
                          }}
                          title="Eliminar"
                          className="w-10 h-10 sm:w-11 sm:h-11"
                        >
                          {/* ✨ Icono con hover shake */}
                          <m.div
                            whileHover={{
                              rotate: [0, -10, 10, -10, 0],
                              transition: { duration: 0.5 },
                            }}
                          >
                            <Trash2 size={18} className="sm:w-5 sm:h-5" />
                          </m.div>
                        </IconButton>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
