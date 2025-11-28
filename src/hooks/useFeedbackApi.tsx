/**
 * Custom hook para operaciones de API del sistema de feedback
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de operaciones de API
 * - DIP: Abstrae las llamadas al servidor
 * - OCP: Fácil de extender con nuevas operaciones
 */

import { useState, useCallback } from "react";
import { FeedbackReporte, FeedbackEstado, FeedbackPrioridad, FeedbackTipo } from "@/types";
import toast from "react-hot-toast";
import { Github } from "lucide-react";

export interface FeedbackStats {
  total: number;
  pendientes: number;
  enProgreso: number;
  resueltos: number;
  descartados: number;
  criticos: number;
  altos: number;
}

export interface FeedbackPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FeedbackFilters {
  estado: FeedbackEstado | "";
  prioridad: FeedbackPrioridad | "";
  tipo: FeedbackTipo | "";
  busqueda: string;
  page: number;
}

export interface UseFeedbackApiResult {
  reportes: FeedbackReporte[];
  stats: FeedbackStats | null;
  pagination: FeedbackPagination | null;
  isLoading: boolean;
  isCreatingIssue: boolean;
  fetchReportes: () => Promise<void>;
  actualizarEstado: (id: string, nuevoEstado: FeedbackEstado) => Promise<boolean>;
  actualizarPrioridad: (id: string, nuevaPrioridad: FeedbackPrioridad) => Promise<boolean>;
  eliminarReporte: (id: string) => Promise<boolean>;
  crearGitHubIssue: (id: string) => Promise<{ issueUrl?: string; issueNumber?: number } | null>;
}

/**
 * Hook personalizado para gestionar operaciones de feedback
 */
export function useFeedbackApi(filters: FeedbackFilters): UseFeedbackApiResult {
  const [reportes, setReportes] = useState<FeedbackReporte[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [pagination, setPagination] = useState<FeedbackPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);

  /**
   * Cargar reportes con filtros
   */
  const fetchReportes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.estado) params.append("estado", filters.estado);
      if (filters.prioridad) params.append("prioridad", filters.prioridad);
      if (filters.tipo) params.append("tipo", filters.tipo);
      if (filters.busqueda) params.append("busqueda", filters.busqueda);
      params.append("page", filters.page.toString());
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
  }, [filters.estado, filters.prioridad, filters.tipo, filters.busqueda, filters.page]);

  /**
   * Actualizar estado de un reporte
   */
  const actualizarEstado = useCallback(async (id: string, nuevoEstado: FeedbackEstado): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Estado actualizado a "${nuevoEstado}"`);
        return true;
      } else {
        toast.error(data.error || "Error al actualizar estado");
        return false;
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      toast.error("Error al conectar con el servidor");
      return false;
    }
  }, []);

  /**
   * Actualizar prioridad de un reporte
   */
  const actualizarPrioridad = useCallback(async (id: string, nuevaPrioridad: FeedbackPrioridad): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prioridad: nuevaPrioridad }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Prioridad actualizada a "${nuevaPrioridad}"`);
        return true;
      } else {
        toast.error(data.error || "Error al actualizar prioridad");
        return false;
      }
    } catch (error) {
      console.error("Error al actualizar prioridad:", error);
      toast.error("Error al conectar con el servidor");
      return false;
    }
  }, []);

  /**
   * Eliminar un reporte
   */
  const eliminarReporte = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Reporte eliminado");
        return true;
      } else {
        toast.error(data.error || "Error al eliminar reporte");
        return false;
      }
    } catch (error) {
      console.error("Error al eliminar reporte:", error);
      toast.error("Error al conectar con el servidor");
      return false;
    }
  }, []);

  /**
   * Crear issue en GitHub
   */
  const crearGitHubIssue = useCallback(async (id: string): Promise<{ issueUrl?: string; issueNumber?: number } | null> => {
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
        return { issueUrl: data.issueUrl, issueNumber: data.issueNumber };
      } else {
        toast.error(data.error || "Error al crear issue en GitHub");
        return null;
      }
    } catch (error) {
      console.error("Error al crear issue en GitHub:", error);
      toast.error("Error al conectar con el servidor");
      return null;
    } finally {
      setIsCreatingIssue(false);
    }
  }, []);

  return {
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
  };
}
