"use client";

/**
 * FeedbackAdminPage - Panel de administración de feedback
 * 
 * ✅ SOLID Principles aplicados:
 * - SRP: Solo responsable de composición y estado de la página
 * - OCP: Extensible mediante componentes modulares
 * - LSP: Componentes intercambiables
 * - ISP: Interfaces específicas por componente
 * - DIP: Depende de abstracciones (hooks y componentes)
 */

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { MessageSquare, RefreshCw, Loader2 } from "lucide-react";
import { Button, Header } from "@/components/ui";
import { FeedbackReporte, FeedbackEstado, FeedbackPrioridad, FeedbackTipo } from "@/types";
import { useFeedbackApi, FeedbackFilters } from "@/hooks/useFeedbackApi";
import {
  FeedbackStatsCards,
  FeedbackSearchAndFilters,
  FeedbackReporteListItem,
  FeedbackReporteDetail,
} from "@/components/feedback/admin";

/**
 * Página principal del panel de administración de feedback
 */
export default function FeedbackAdminPage() {
  // Estado de selección
  const [selectedReporte, setSelectedReporte] = useState<FeedbackReporte | null>(null);

  // Estado de filtros
  const [filters, setFilters] = useState<FeedbackFilters>({
    estado: "",
    prioridad: "",
    tipo: "",
    busqueda: "",
    page: 1,
  });

  // Hook para operaciones de API
  const {
    reportes,
    stats,
    pagination,
    isLoading,
    isCreatingIssue,
    fetchReportes,
    actualizarEstado,
    actualizarPrioridad,
    eliminarReporte,
    crearGitHubIssue,
  } = useFeedbackApi(filters);

  // Cargar reportes al montar y cuando cambien los filtros
  useEffect(() => {
    fetchReportes();
  }, [fetchReportes]);

  // Handlers de filtros
  const handleBusquedaChange = (value: string) => {
    setFilters((prev) => ({ ...prev, busqueda: value, page: 1 }));
  };

  const handleEstadoFilterChange = (value: FeedbackEstado | "") => {
    setFilters((prev) => ({ ...prev, estado: value, page: 1 }));
  };

  const handlePrioridadFilterChange = (value: FeedbackPrioridad | "") => {
    setFilters((prev) => ({ ...prev, prioridad: value, page: 1 }));
  };

  const handleTipoFilterChange = (value: FeedbackTipo | "") => {
    setFilters((prev) => ({ ...prev, tipo: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Handlers de operaciones sobre reportes
  const handleEstadoChange = async (nuevoEstado: FeedbackEstado) => {
    if (!selectedReporte?._id) return;
    const success = await actualizarEstado(selectedReporte._id, nuevoEstado);
    if (success) {
      setSelectedReporte({ ...selectedReporte, estado: nuevoEstado });
      fetchReportes();
    }
  };

  const handlePrioridadChange = async (nuevaPrioridad: FeedbackPrioridad) => {
    if (!selectedReporte?._id) return;
    const success = await actualizarPrioridad(selectedReporte._id, nuevaPrioridad);
    if (success) {
      setSelectedReporte({ ...selectedReporte, prioridad: nuevaPrioridad });
      fetchReportes();
    }
  };

  const handleEliminar = async () => {
    if (!selectedReporte?._id) return;
    if (!confirm("¿Estás seguro de que deseas eliminar este reporte?")) return;
    
    const success = await eliminarReporte(selectedReporte._id);
    if (success) {
      setSelectedReporte(null);
      fetchReportes();
    }
  };

  const handleCrearGitHubIssue = async () => {
    if (!selectedReporte?._id) return;
    const result = await crearGitHubIssue(selectedReporte._id);
    if (result) {
      setSelectedReporte({
        ...selectedReporte,
        githubIssueUrl: result.issueUrl,
        githubIssueNumber: result.issueNumber,
      });
      fetchReportes();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg font-sans transition-colors">
      <div className="max-w-6xl mx-auto bg-white dark:bg-dark-surface min-h-screen shadow-2xl overflow-hidden flex flex-col transition-colors">
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
              className="bg-white/10 hover:bg-white/20"
              title="Recargar"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </Button>
          }
        />

        {/* Stats Cards */}
        {stats && <FeedbackStatsCards stats={stats} />}

        {/* Search and Filters */}
        <FeedbackSearchAndFilters
          busqueda={filters.busqueda}
          filtroEstado={filters.estado}
          filtroPrioridad={filters.prioridad}
          filtroTipo={filters.tipo}
          onBusquedaChange={handleBusquedaChange}
          onEstadoChange={handleEstadoFilterChange}
          onPrioridadChange={handlePrioridadFilterChange}
          onTipoChange={handleTipoFilterChange}
        />

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Lista de Reportes */}
          <ReportesList
            reportes={reportes}
            isLoading={isLoading}
            selectedReporte={selectedReporte}
            pagination={pagination}
            page={filters.page}
            onSelectReporte={setSelectedReporte}
            onPageChange={handlePageChange}
          />

          {/* Detalle del Reporte */}
          <AnimatePresence mode="wait">
            {selectedReporte && (
              <FeedbackReporteDetail
                reporte={selectedReporte}
                isCreatingIssue={isCreatingIssue}
                onClose={() => setSelectedReporte(null)}
                onEstadoChange={handleEstadoChange}
                onPrioridadChange={handlePrioridadChange}
                onEliminar={handleEliminar}
                onCrearGitHubIssue={handleCrearGitHubIssue}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============ SUB-COMPONENTES DE LA PÁGINA ============

interface ReportesListProps {
  reportes: FeedbackReporte[];
  isLoading: boolean;
  selectedReporte: FeedbackReporte | null;
  pagination: { page: number; totalPages: number } | null;
  page: number;
  onSelectReporte: (reporte: FeedbackReporte) => void;
  onPageChange: (page: number) => void;
}

/**
 * Lista de reportes con paginación
 */
function ReportesList({
  reportes,
  isLoading,
  selectedReporte,
  pagination,
  page,
  onSelectReporte,
  onPageChange,
}: ReportesListProps) {
  return (
    <div className={`flex-1 overflow-y-auto ${selectedReporte ? "hidden lg:block lg:w-1/2 lg:border-r lg:border-gray-200 lg:dark:border-dark-border" : "w-full"}`}>
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 size={32} className="animate-spin text-accent-primary" />
        </div>
      ) : reportes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-dark-border">
          {reportes.map((reporte) => (
            <FeedbackReporteListItem
              key={reporte._id}
              reporte={reporte}
              isSelected={selectedReporte?._id === reporte._id}
              onClick={() => onSelectReporte(reporte)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-dark-border flex items-center justify-between transition-colors">
          <Button
            variant="outline"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => onPageChange(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Estado vacío cuando no hay reportes
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
      <MessageSquare size={48} className="mb-4 opacity-50" />
      <p className="text-lg font-medium">No hay reportes</p>
      <p className="text-sm">Los reportes de feedback aparecerán aquí</p>
    </div>
  );
}
