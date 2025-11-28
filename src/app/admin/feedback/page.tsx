"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Filter,
  Bug,
  Lightbulb,
  HelpCircle,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
  MessageSquare,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Github,
  ExternalLink,
} from "lucide-react";
import { Button, Header } from "@/components/ui";
import { FeedbackReporte, FeedbackEstado, FeedbackPrioridad, FeedbackTipo } from "@/types";
import toast from "react-hot-toast";

// Iconos para tipos de feedback
const TIPO_ICONS: Record<FeedbackTipo, React.ReactNode> = {
  Bug: <Bug size={14} />,
  Mejora: <Lightbulb size={14} />,
  Pregunta: <HelpCircle size={14} />,
  Otro: <MoreHorizontal size={14} />,
};

// Colores para estados
const ESTADO_COLORS: Record<FeedbackEstado, string> = {
  Pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  "En progreso": "bg-blue-100 text-blue-800 border-blue-300",
  Resuelto: "bg-green-100 text-green-800 border-green-300",
  Descartado: "bg-gray-100 text-gray-800 border-gray-300",
};

// Iconos para estados
const ESTADO_ICONS: Record<FeedbackEstado, React.ReactNode> = {
  Pendiente: <Clock size={14} />,
  "En progreso": <Loader2 size={14} className="animate-spin" />,
  Resuelto: <CheckCircle size={14} />,
  Descartado: <XCircle size={14} />,
};

// Colores para prioridades
const PRIORIDAD_COLORS: Record<FeedbackPrioridad, string> = {
  Baja: "bg-gray-100 text-gray-700",
  Media: "bg-blue-100 text-blue-700",
  Alta: "bg-orange-100 text-orange-700",
  Critica: "bg-red-100 text-red-700",
};

// Iconos para dispositivos
const DISPOSITIVO_ICONS: Record<string, React.ReactNode> = {
  Escritorio: <Monitor size={14} />,
  Móvil: <Smartphone size={14} />,
  Tablet: <Tablet size={14} />,
};

interface Stats {
  total: number;
  pendientes: number;
  enProgreso: number;
  resueltos: number;
  descartados: number;
  criticos: number;
  altos: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * FeedbackAdminPage - Panel de administración de feedback
 */
export default function FeedbackAdminPage() {
  const [reportes, setReportes] = useState<FeedbackReporte[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReporte, setSelectedReporte] = useState<FeedbackReporte | null>(null);
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<FeedbackEstado | "">("");
  const [filtroPrioridad, setFiltroPrioridad] = useState<FeedbackPrioridad | "">("");
  const [filtroTipo, setFiltroTipo] = useState<FeedbackTipo | "">("");
  const [busqueda, setBusqueda] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Cargar reportes
  const fetchReportes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.append("estado", filtroEstado);
      if (filtroPrioridad) params.append("prioridad", filtroPrioridad);
      if (filtroTipo) params.append("tipo", filtroTipo);
      if (busqueda) params.append("busqueda", busqueda);
      params.append("page", page.toString());
      params.append("limit", "20");

      const response = await fetch(`/api/admin/feedback?${params}`);
      const data = await response.json();

      if (data.success) {
        setReportes(data.reportes);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || "Error al cargar reportes");
      }
    } catch (error) {
      console.error("Error al cargar reportes:", error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  }, [filtroEstado, filtroPrioridad, filtroTipo, busqueda, page]);

  useEffect(() => {
    fetchReportes();
  }, [fetchReportes]);

  // Actualizar estado de un reporte
  const actualizarEstado = async (id: string, nuevoEstado: FeedbackEstado) => {
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Estado actualizado a "${nuevoEstado}"`);
        fetchReportes();
        if (selectedReporte?._id === id) {
          setSelectedReporte({ ...selectedReporte, estado: nuevoEstado });
        }
      } else {
        toast.error(data.error || "Error al actualizar estado");
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      toast.error("Error al conectar con el servidor");
    }
  };

  // Actualizar prioridad de un reporte
  const actualizarPrioridad = async (id: string, nuevaPrioridad: FeedbackPrioridad) => {
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prioridad: nuevaPrioridad }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Prioridad actualizada a "${nuevaPrioridad}"`);
        fetchReportes();
        if (selectedReporte?._id === id) {
          setSelectedReporte({ ...selectedReporte, prioridad: nuevaPrioridad });
        }
      } else {
        toast.error(data.error || "Error al actualizar prioridad");
      }
    } catch (error) {
      console.error("Error al actualizar prioridad:", error);
      toast.error("Error al conectar con el servidor");
    }
  };

  // Eliminar reporte
  const eliminarReporte = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este reporte?")) return;

    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Reporte eliminado");
        fetchReportes();
        if (selectedReporte?._id === id) {
          setSelectedReporte(null);
        }
      } else {
        toast.error(data.error || "Error al eliminar reporte");
      }
    } catch (error) {
      console.error("Error al eliminar reporte:", error);
      toast.error("Error al conectar con el servidor");
    }
  };

  // Crear issue en GitHub
  const crearGitHubIssue = async (id: string) => {
    setIsCreatingIssue(true);
    try {
      const response = await fetch(`/api/admin/feedback/${id}/github-issue`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Github size={16} />
            <span>Issue #{data.issueNumber} creado</span>
          </div>
        );
        fetchReportes();
        if (selectedReporte?._id === id) {
          setSelectedReporte({
            ...selectedReporte,
            githubIssueUrl: data.issueUrl,
            githubIssueNumber: data.issueNumber,
          });
        }
      } else {
        toast.error(data.error || "Error al crear issue en GitHub");
      }
    } catch (error) {
      console.error("Error al crear issue en GitHub:", error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setIsCreatingIssue(false);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha: Date | string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto bg-white min-h-screen shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <Header
          title="Panel de Feedback"
          subtitle="Gestión de reportes de beta-testers"
          icon={MessageSquare}
          backHref="/admin"
          backText="Volver a Administración"
          rightContent={
            <Button
              variant="ghost"
              onClick={fetchReportes}
              className="text-white hover:bg-white/10"
              title="Recargar"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </Button>
          }
        />

        {/* Stats Cards */}
        {stats && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 uppercase">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-xl shadow-sm border border-yellow-100">
                <p className="text-xs text-yellow-600 uppercase">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.pendientes}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl shadow-sm border border-blue-100">
                <p className="text-xs text-blue-600 uppercase">En Progreso</p>
                <p className="text-2xl font-bold text-blue-700">{stats.enProgreso}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl shadow-sm border border-green-100">
                <p className="text-xs text-green-600 uppercase">Resueltos</p>
                <p className="text-2xl font-bold text-green-700">{stats.resueltos}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase">Descartados</p>
                <p className="text-2xl font-bold text-gray-700">{stats.descartados}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl shadow-sm border border-red-100">
                <p className="text-xs text-red-600 uppercase">Críticos</p>
                <p className="text-2xl font-bold text-red-700">{stats.criticos}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl shadow-sm border border-orange-100">
                <p className="text-xs text-orange-600 uppercase">Altos</p>
                <p className="text-2xl font-bold text-orange-700">{stats.altos}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por título o descripción..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
              />
            </div>
            <Button
              variant={showFilters ? "primary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                    <select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value as FeedbackEstado | "")}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-accent-primary focus:outline-none"
                    >
                      <option value="">Todos</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En progreso">En progreso</option>
                      <option value="Resuelto">Resuelto</option>
                      <option value="Descartado">Descartado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Prioridad</label>
                    <select
                      value={filtroPrioridad}
                      onChange={(e) => setFiltroPrioridad(e.target.value as FeedbackPrioridad | "")}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-accent-primary focus:outline-none"
                    >
                      <option value="">Todas</option>
                      <option value="Critica">Crítica</option>
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
                    <select
                      value={filtroTipo}
                      onChange={(e) => setFiltroTipo(e.target.value as FeedbackTipo | "")}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-accent-primary focus:outline-none"
                    >
                      <option value="">Todos</option>
                      <option value="Bug">Bug/Defecto</option>
                      <option value="Mejora">Sugerencia</option>
                      <option value="Pregunta">Duda/Consulta</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Lista de Reportes */}
          <div className={`flex-1 overflow-y-auto ${selectedReporte ? "hidden lg:block lg:w-1/2 lg:border-r" : "w-full"}`}>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 size={32} className="animate-spin text-accent-primary" />
              </div>
            ) : reportes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <MessageSquare size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay reportes</p>
                <p className="text-sm">Los reportes de feedback aparecerán aquí</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {reportes.map((reporte) => (
                  <motion.div
                    key={reporte._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedReporte?._id === reporte._id ? "bg-accent-primary/5" : ""
                    } ${!reporte.leidoEn ? "border-l-4 border-l-accent-primary" : ""}`}
                    onClick={() => setSelectedReporte(reporte)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Tipos */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {reporte.tipo.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                            >
                              {TIPO_ICONS[t]}
                              {t}
                            </span>
                          ))}
                        </div>
                        {/* Título */}
                        <h3 className="font-semibold text-gray-900 truncate">{reporte.titulo}</h3>
                        {/* Descripción truncada */}
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {reporte.descripcion}
                        </p>
                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
                          <span>{formatearFecha(reporte.creadoAt)}</span>
                          {reporte.userEmail && (
                            <>
                              <span>•</span>
                              <span>{reporte.userEmail}</span>
                            </>
                          )}
                          {reporte.metadata?.dispositivo && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                {DISPOSITIVO_ICONS[reporte.metadata.dispositivo] || <Monitor size={12} />}
                                {reporte.metadata.dispositivo}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Estado y Prioridad */}
                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${ESTADO_COLORS[reporte.estado]}`}>
                          {ESTADO_ICONS[reporte.estado]}
                          {reporte.estado}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORIDAD_COLORS[reporte.prioridad]}`}>
                          {reporte.prioridad}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-500">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>

          {/* Detalle del Reporte */}
          <AnimatePresence mode="wait">
            {selectedReporte && (
              <motion.div
                key={selectedReporte._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full lg:w-1/2 overflow-y-auto bg-white"
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedReporte(null)}
                      className="lg:hidden"
                    >
                      <ArrowLeft size={18} />
                      Volver
                    </Button>
                    <div className="flex items-center gap-2">
                      {/* Botón para crear issue en GitHub */}
                      {selectedReporte.githubIssueUrl ? (
                        <a
                          href={selectedReporte.githubIssueUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                          title="Ver issue en GitHub"
                        >
                          <Github size={16} />
                          #{selectedReporte.githubIssueNumber}
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => crearGitHubIssue(selectedReporte._id!)}
                          disabled={isCreatingIssue}
                          className="text-gray-700 hover:bg-gray-100"
                          title="Crear issue en GitHub"
                        >
                          {isCreatingIssue ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Github size={18} />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => eliminarReporte(selectedReporte._id!)}
                        className="text-red-500 hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-6">
                  {/* Tipos */}
                  <div className="flex flex-wrap gap-2">
                    {selectedReporte.tipo.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                      >
                        {TIPO_ICONS[t]}
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Título */}
                  <h2 className="text-xl font-bold text-gray-900">{selectedReporte.titulo}</h2>

                  {/* Estado y Prioridad - Editable */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                      <select
                        value={selectedReporte.estado}
                        onChange={(e) => actualizarEstado(selectedReporte._id!, e.target.value as FeedbackEstado)}
                        className={`w-full px-3 py-2 border-2 rounded-xl font-medium ${ESTADO_COLORS[selectedReporte.estado]}`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En progreso">En progreso</option>
                        <option value="Resuelto">Resuelto</option>
                        <option value="Descartado">Descartado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Prioridad</label>
                      <select
                        value={selectedReporte.prioridad}
                        onChange={(e) => actualizarPrioridad(selectedReporte._id!, e.target.value as FeedbackPrioridad)}
                        className={`w-full px-3 py-2 border-2 rounded-xl font-medium ${PRIORIDAD_COLORS[selectedReporte.prioridad]}`}
                      >
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                        <option value="Critica">Crítica</option>
                      </select>
                    </div>
                  </div>

                  {/* Categorías */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Categorías</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedReporte.categorias.map((cat) => (
                        <span
                          key={cat}
                          className="px-3 py-1 rounded-full text-sm font-medium bg-accent-primary/10 text-accent-primary"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Descripción</label>
                    <div className="bg-gray-50 p-4 rounded-xl text-gray-700 whitespace-pre-wrap">
                      {selectedReporte.descripcion}
                    </div>
                  </div>

                  {/* Screenshots */}
                  {selectedReporte.screenshots.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Capturas de Pantalla</label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedReporte.screenshots.map((src, index) => (
                          <a
                            key={index}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={src}
                              alt={`Screenshot ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-accent-primary transition-colors"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata técnica */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Información Técnica</label>
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
                      {selectedReporte.metadata && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Navegador:</span>
                            <span className="font-medium">{selectedReporte.metadata.navegador}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Dispositivo:</span>
                            <span className="font-medium">{selectedReporte.metadata.dispositivo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Sistema Operativo:</span>
                            <span className="font-medium">{selectedReporte.metadata.sistemaOperativo || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Resolución:</span>
                            <span className="font-medium">{selectedReporte.metadata.resolucionPantalla || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">URL:</span>
                            <span className="font-medium truncate max-w-[200px]">{selectedReporte.metadata.url}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Info del usuario */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Usuario</label>
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="font-medium">{selectedReporte.userEmail || "No proporcionado"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Enviado:</span>
                        <span className="font-medium">{formatearFecha(selectedReporte.creadoAt)}</span>
                      </div>
                      {selectedReporte.leidoEn && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Leído:</span>
                          <span className="font-medium">{formatearFecha(selectedReporte.leidoEn)}</span>
                        </div>
                      )}
                      {selectedReporte.resolvedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Resuelto:</span>
                          <span className="font-medium">{formatearFecha(selectedReporte.resolvedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* GitHub Issue */}
                  {selectedReporte.githubIssueUrl && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">GitHub Issue</label>
                      <a
                        href={selectedReporte.githubIssueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                      >
                        <Github size={24} />
                        <div className="flex-1">
                          <p className="font-medium">Issue #{selectedReporte.githubIssueNumber}</p>
                          <p className="text-sm text-gray-400">Clic para ver en GitHub</p>
                        </div>
                        <ExternalLink size={18} className="text-gray-400" />
                      </a>
                    </div>
                  )}

                  {/* Historial */}
                  {selectedReporte.historial.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Historial</label>
                      <div className="space-y-2">
                        {selectedReporte.historial.map((entry, index) => (
                          <div key={index} className="flex items-start gap-3 text-sm">
                            <div className="w-2 h-2 mt-1.5 rounded-full bg-accent-primary" />
                            <div className="flex-1">
                              <p className="text-gray-700">{entry.mensaje}</p>
                              <p className="text-xs text-gray-400">{formatearFecha(entry.fecha)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
