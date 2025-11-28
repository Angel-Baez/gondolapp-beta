/**
 * FeedbackReporteDetail - Componente para mostrar el detalle de un reporte
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de renderizar el detalle de un reporte
 * - OCP: Fácil de extender con nuevas secciones
 */

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Trash2,
  Github,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui";
import { FeedbackReporte, FeedbackEstado, FeedbackPrioridad } from "@/types";
import {
  TIPO_ICONS,
  ESTADO_COLORS,
  PRIORIDAD_COLORS,
  ESTADO_OPTIONS,
  PRIORIDAD_OPTIONS,
} from "./constants";
import { formatearFecha } from "./utils";

interface FeedbackReporteDetailProps {
  reporte: FeedbackReporte;
  isCreatingIssue: boolean;
  onClose: () => void;
  onEstadoChange: (nuevoEstado: FeedbackEstado) => void;
  onPrioridadChange: (nuevaPrioridad: FeedbackPrioridad) => void;
  onEliminar: () => void;
  onCrearGitHubIssue: () => void;
}

/**
 * Vista detallada de un reporte de feedback
 */
export function FeedbackReporteDetail({
  reporte,
  isCreatingIssue,
  onClose,
  onEstadoChange,
  onPrioridadChange,
  onEliminar,
  onCrearGitHubIssue,
}: FeedbackReporteDetailProps) {
  return (
    <motion.div
      key={reporte._id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full lg:w-1/2 overflow-y-auto bg-white"
    >
      {/* Header fijo */}
      <DetailHeader
        reporte={reporte}
        isCreatingIssue={isCreatingIssue}
        onClose={onClose}
        onEliminar={onEliminar}
        onCrearGitHubIssue={onCrearGitHubIssue}
      />

      {/* Contenido */}
      <div className="p-4 space-y-6">
        <TiposSection tipos={reporte.tipo} />
        <TituloSection titulo={reporte.titulo} />
        <EstadoPrioridadSection
          estado={reporte.estado}
          prioridad={reporte.prioridad}
          onEstadoChange={onEstadoChange}
          onPrioridadChange={onPrioridadChange}
        />
        <CategoriasSection categorias={reporte.categorias} />
        <DescripcionSection descripcion={reporte.descripcion} />
        {reporte.screenshots.length > 0 && (
          <ScreenshotsSection screenshots={reporte.screenshots} />
        )}
        <MetadataSection metadata={reporte.metadata} />
        <UsuarioSection reporte={reporte} />
        {reporte.githubIssueUrl && (
          <GitHubIssueSection
            issueUrl={reporte.githubIssueUrl}
            issueNumber={reporte.githubIssueNumber}
          />
        )}
        {reporte.historial.length > 0 && (
          <HistorialSection historial={reporte.historial} />
        )}
      </div>
    </motion.div>
  );
}

// ============ SUB-COMPONENTES ============

interface DetailHeaderProps {
  reporte: FeedbackReporte;
  isCreatingIssue: boolean;
  onClose: () => void;
  onEliminar: () => void;
  onCrearGitHubIssue: () => void;
}

function DetailHeader({ reporte, isCreatingIssue, onClose, onEliminar, onCrearGitHubIssue }: DetailHeaderProps) {
  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onClose}
          className="lg:hidden"
        >
          <ArrowLeft size={18} />
          Volver
        </Button>
        <div className="flex items-center gap-2">
          {/* Botón para crear issue en GitHub */}
          {reporte.githubIssueUrl ? (
            <a
              href={reporte.githubIssueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              title="Ver issue en GitHub"
            >
              <Github size={16} />
              #{reporte.githubIssueNumber}
              <ExternalLink size={14} />
            </a>
          ) : (
            <Button
              variant="ghost"
              onClick={onCrearGitHubIssue}
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
            onClick={onEliminar}
            className="text-red-500 hover:bg-red-50"
            title="Eliminar"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TiposSection({ tipos }: { tipos: FeedbackReporte["tipo"] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tipos.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
        >
          {TIPO_ICONS[t]}
          {t}
        </span>
      ))}
    </div>
  );
}

function TituloSection({ titulo }: { titulo: string }) {
  return <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>;
}

interface EstadoPrioridadSectionProps {
  estado: FeedbackEstado;
  prioridad: FeedbackPrioridad;
  onEstadoChange: (nuevoEstado: FeedbackEstado) => void;
  onPrioridadChange: (nuevaPrioridad: FeedbackPrioridad) => void;
}

function EstadoPrioridadSection({
  estado,
  prioridad,
  onEstadoChange,
  onPrioridadChange,
}: EstadoPrioridadSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
        <select
          value={estado}
          onChange={(e) => onEstadoChange(e.target.value as FeedbackEstado)}
          className={`w-full px-3 py-2 border-2 rounded-xl font-medium ${ESTADO_COLORS[estado]}`}
        >
          {ESTADO_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Prioridad</label>
        <select
          value={prioridad}
          onChange={(e) => onPrioridadChange(e.target.value as FeedbackPrioridad)}
          className={`w-full px-3 py-2 border-2 rounded-xl font-medium ${PRIORIDAD_COLORS[prioridad]}`}
        >
          {PRIORIDAD_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt === "Critica" ? "Crítica" : opt}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function CategoriasSection({ categorias }: { categorias: string[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2">Categorías</label>
      <div className="flex flex-wrap gap-2">
        {categorias.map((cat) => (
          <span
            key={cat}
            className="px-3 py-1 rounded-full text-sm font-medium bg-accent-primary/10 text-accent-primary"
          >
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}

function DescripcionSection({ descripcion }: { descripcion: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2">Descripción</label>
      <div className="bg-gray-50 p-4 rounded-xl text-gray-700 whitespace-pre-wrap">
        {descripcion}
      </div>
    </div>
  );
}

function ScreenshotsSection({ screenshots }: { screenshots: string[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2">Capturas de Pantalla</label>
      <div className="grid grid-cols-2 gap-2">
        {screenshots.map((src, index) => (
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
  );
}

function MetadataSection({ metadata }: { metadata?: FeedbackReporte["metadata"] }) {
  if (!metadata) return null;

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2">Información Técnica</label>
      <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
        <MetadataRow label="Navegador" value={metadata.navegador} />
        <MetadataRow label="Dispositivo" value={metadata.dispositivo} />
        <MetadataRow label="Sistema Operativo" value={metadata.sistemaOperativo || "N/A"} />
        <MetadataRow label="Resolución" value={metadata.resolucionPantalla || "N/A"} />
        <MetadataRow label="URL" value={metadata.url} truncate />
      </div>
    </div>
  );
}

function MetadataRow({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}:</span>
      <span className={`font-medium ${truncate ? "truncate max-w-[200px]" : ""}`}>{value}</span>
    </div>
  );
}

function UsuarioSection({ reporte }: { reporte: FeedbackReporte }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2">Usuario</label>
      <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
        <MetadataRow label="Email" value={reporte.userEmail || "No proporcionado"} />
        <MetadataRow label="Enviado" value={formatearFecha(reporte.creadoAt)} />
        {reporte.leidoEn && (
          <MetadataRow label="Leído" value={formatearFecha(reporte.leidoEn)} />
        )}
        {reporte.resolvedAt && (
          <MetadataRow label="Resuelto" value={formatearFecha(reporte.resolvedAt)} />
        )}
      </div>
    </div>
  );
}

function GitHubIssueSection({ issueUrl, issueNumber }: { issueUrl: string; issueNumber?: number }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2">GitHub Issue</label>
      <a
        href={issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
      >
        <Github size={24} />
        <div className="flex-1">
          <p className="font-medium">Issue #{issueNumber}</p>
          <p className="text-sm text-gray-400">Clic para ver en GitHub</p>
        </div>
        <ExternalLink size={18} className="text-gray-400" />
      </a>
    </div>
  );
}

function HistorialSection({ historial }: { historial: FeedbackReporte["historial"] }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2">Historial</label>
      <div className="space-y-2">
        {historial.map((entry, index) => (
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
  );
}
