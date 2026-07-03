"use client";

import { useHaptics } from "@/hooks/useHaptics";
import {
  useActualizarCantidadReposicion,
  useCambiarEstadoReposicion,
  useDecrementarReposicion,
  useEliminarReposicionItemDirecto,
} from "@/hooks/useReposicion";
import { EstadoReposicion, ItemReposicion, ProductoBase, ProductoVariante } from "@/types";
import { AnimatePresence, motion as m } from "framer-motion";
import {
  Ban,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Badge, IconButton } from "../ui";

interface ReposicionCardProps {
  productoBase: ProductoBase;
  variantes: Array<{
    item: ItemReposicion;
    variante: ProductoVariante;
  }>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  /** Modo selección múltiple: si está activo, cada fila muestra un checkbox
   * en vez de sus botones de acción individuales. */
  seleccionActiva?: boolean;
  estaSeleccionado?: (id: string) => boolean;
  onToggleSeleccion?: (id: string) => void;
}

export function ReposicionCard({
  productoBase,
  variantes,
  isExpanded,
  onToggleExpand,
  seleccionActiva = false,
  estaSeleccionado,
  onToggleSeleccion,
}: ReposicionCardProps) {
  const cambiarEstado = useCambiarEstadoReposicion();
  const decrementar = useDecrementarReposicion();
  const actualizarCantidad = useActualizarCantidadReposicion();
  const eliminar = useEliminarReposicionItemDirecto();
  const { haptic } = useHaptics();

  const cantidadTotal = variantes.reduce((acc, v) => acc + v.item.cantidad, 0);
  const seccion = variantes[0]?.item.estado ?? "pendiente";

  const sectionColors: Record<EstadoReposicion, { rail: string; badge: string; hover: string }> = {
    pendiente: {
      rail: "border-l-estado-pendiente",
      badge: "bg-estado-pendiente",
      hover: "hover:bg-surface-2",
    },
    repuesto: {
      rail: "border-l-estado-repuesto",
      badge: "bg-estado-repuesto",
      hover: "hover:bg-surface-2",
    },
    sin_stock: {
      rail: "border-l-estado-sin-stock",
      badge: "bg-estado-sin-stock",
      hover: "hover:bg-surface-2",
    },
  };

  const colors = sectionColors[seccion];

  const toggleEstado = (item: { id: string; estado: EstadoReposicion }, target: EstadoReposicion) => {
    const nuevoEstado = item.estado === target ? "pendiente" : target;

    cambiarEstado.mutate(
      { id: item.id, estado: nuevoEstado },
      {
        onSuccess: () => {
          haptic(nuevoEstado === "pendiente" ? 50 : [30, 30, 30]);

          if (target === "repuesto") {
            if (nuevoEstado === "repuesto") {
              toast.success(
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-emerald-500 w-5 h-5" />
                  <span>Producto marcado como repuesto</span>
                </div>,
                { duration: 2000 }
              );
            } else {
              toast(
                <div className="flex items-center gap-2">
                  <RefreshCw className="text-cyan-500 w-5 h-5" />
                  <span>Producto desmarcado como repuesto</span>
                </div>,
                { duration: 2000 }
              );
            }
          } else {
            if (nuevoEstado === "sin_stock") {
              toast.success(
                <div className="flex items-center gap-2">
                  <Ban className="text-red-500 w-5 h-5" />
                  <span>Producto marcado sin stock</span>
                </div>,
                { duration: 2000 }
              );
            } else {
              toast(
                <div className="flex items-center gap-2">
                  <RefreshCw className="text-cyan-500 w-5 h-5" />
                  <span>Producto reactivado</span>
                </div>,
                { duration: 2000 }
              );
            }
          }
        },
        onError: () => {
          toast.error("No se pudo actualizar el producto. Revisá tu conexión e intentá de nuevo.");
        },
      }
    );
  };

  return (
    <div className={`island overflow-hidden border-l-[3px] ${colors.rail}`}>
      <div
        onClick={onToggleExpand}
        className={`p-4 flex items-center justify-between cursor-pointer ${colors.hover} transition-colors`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {productoBase.imagen && (
            <img
              src={productoBase.imagen}
              alt={productoBase.nombre}
              className="w-12 h-12 object-cover rounded-field flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-headline text-fg leading-tight truncate">
              {productoBase.nombre}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {productoBase.marca && (
                <span className="text-footnote text-fg-secondary truncate">
                  {productoBase.marca}
                </span>
              )}
              <Badge variant="primary">{variantes.length} variantes</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {cantidadTotal > 0 && (
            <div
              className={`px-2.5 py-1 ${colors.badge} text-white rounded-chip font-semibold text-subhead`}
            >
              x{cantidadTotal}
            </div>
          )}
          {isExpanded ? (
            <ChevronUp size={20} className="text-fg-tertiary flex-shrink-0" />
          ) : (
            <ChevronDown size={20} className="text-fg-tertiary flex-shrink-0" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border"
          >
            <div className="divide-y divide-border">
              {variantes.map(({ item, variante }) => {
                // El header de la card ya muestra productoBase.nombre, así que acá
                // se arma solo la parte de variante (tipo+sabor+tamaño) para no
                // repetir el nombre base que nombreCompleto ya incluye.
                const descriptorVariante =
                  [variante.tipo, variante.sabor, variante.tamano].filter(Boolean).join(" ") ||
                  variante.nombreCompleto;
                const seleccionado = estaSeleccionado?.(item.id) ?? false;
                return (
                <div
                  key={item.id}
                  onClick={seleccionActiva ? () => onToggleSeleccion?.(item.id) : undefined}
                  className={`p-3 sm:p-4 ${seleccionActiva ? "cursor-pointer" : ""} ${
                    seleccionado ? "bg-accent-soft" : ""
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      {variante.imagen && (
                        <img
                          src={variante.imagen}
                          alt={variante.nombreCompleto}
                          className="w-14 h-14 object-cover rounded-field flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-subhead font-semibold text-fg leading-tight">
                          {descriptorVariante}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {item.estado === "repuesto" && <Badge variant="success">REPUESTO</Badge>}
                          {item.estado === "sin_stock" && <Badge variant="danger">SIN STOCK</Badge>}
                          {item.estado === "pendiente" && <Badge variant="default">PENDIENTE</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                      <div className="flex items-center gap-3">
                        {item.estado === "pendiente" && (
                          <div
                            className={`flex items-center gap-1 bg-surface-2 rounded-field p-1 ${
                              seleccionActiva ? "pointer-events-none opacity-60" : ""
                            }`}
                          >
                            <m.button
                              whileTap={{ scale: 0.85 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                decrementar(item);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-chip hover:bg-border font-bold text-lg text-fg transition-colors"
                            >
                              -
                            </m.button>
                            <span className="w-12 text-center text-headline text-fg">
                              {item.cantidad}
                            </span>
                            <m.button
                              whileTap={{ scale: 0.85 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                actualizarCantidad.mutate({ id: item.id, cantidad: item.cantidad + 1 });
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-chip hover:bg-border font-bold text-lg text-fg transition-colors"
                            >
                              +
                            </m.button>
                          </div>
                        )}

                        {item.estado !== "pendiente" && (
                          <span className="px-3 py-1.5 bg-surface-2 text-fg-secondary rounded-chip font-semibold text-subhead">
                            x{item.cantidad}
                          </span>
                        )}
                      </div>

                      {seleccionActiva ? (
                        <IconButton
                          variant={seleccionado ? "primary" : "ghost"}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSeleccion?.(item.id);
                          }}
                          title={seleccionado ? "Deseleccionar" : "Seleccionar"}
                          className="w-10 h-10 sm:w-11 sm:h-11"
                        >
                          <Check size={20} className={seleccionado ? "" : "opacity-30"} />
                        </IconButton>
                      ) : (
                        <div className="flex items-center gap-2">
                          <IconButton
                            variant={item.estado === "repuesto" ? "primary" : "ghost"}
                            onClick={() => toggleEstado(item, "repuesto")}
                            title={item.estado === "repuesto" ? "Desmarcar repuesto" : "Marcar como repuesto"}
                            className="w-10 h-10 sm:w-11 sm:h-11"
                          >
                            <m.div
                              animate={item.estado === "repuesto" ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <CheckCircle size={20} className="sm:w-6 sm:h-6" />
                            </m.div>
                          </IconButton>

                          <IconButton
                            variant={item.estado === "sin_stock" ? "destructive" : "ghost"}
                            onClick={() => toggleEstado(item, "sin_stock")}
                            title={item.estado === "sin_stock" ? "Desmarcar sin stock" : "Marcar como sin stock"}
                            className="w-10 h-10 sm:w-11 sm:h-11"
                          >
                            <m.div
                              animate={
                                item.estado === "sin_stock"
                                  ? { scale: [1, 1.1, 1], opacity: [1, 0.8, 1] }
                                  : { scale: 1 }
                              }
                              transition={{
                                duration: 0.6,
                                repeat: item.estado === "sin_stock" ? Infinity : 0,
                                repeatDelay: 1,
                              }}
                            >
                              <XCircle size={20} className="sm:w-6 sm:h-6" />
                            </m.div>
                          </IconButton>

                          <IconButton
                            variant="ghost"
                            onClick={() => {
                              eliminar.mutate(item.id, {
                                onSuccess: () => {
                                  haptic([50, 100, 50]);
                                  toast.error(
                                    <div className="flex items-center gap-2">
                                      <Trash2 className="text-red-500 w-5 h-5" />
                                      <span>Producto eliminado</span>
                                    </div>,
                                    { duration: 2000 }
                                  );
                                },
                                onError: () => {
                                  toast.error("No se pudo eliminar el producto. Intentá de nuevo.");
                                },
                              });
                            }}
                            title="Eliminar"
                            className="w-10 h-10 sm:w-11 sm:h-11"
                          >
                            <m.div
                              whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                            >
                              <Trash2 size={18} className="sm:w-5 sm:h-5" />
                            </m.div>
                          </IconButton>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

