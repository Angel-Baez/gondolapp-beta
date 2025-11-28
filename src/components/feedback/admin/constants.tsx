/**
 * Constantes y configuración para el sistema de feedback
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de definir constantes de UI
 * - OCP: Fácil de extender sin modificar código existente
 */

import React from "react";
import {
  Bug,
  Lightbulb,
  HelpCircle,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { FeedbackTipo, FeedbackEstado, FeedbackPrioridad } from "@/types";

// Iconos para tipos de feedback
export const TIPO_ICONS: Record<FeedbackTipo, React.ReactNode> = {
  Bug: <Bug size={14} />,
  Mejora: <Lightbulb size={14} />,
  Pregunta: <HelpCircle size={14} />,
  Otro: <MoreHorizontal size={14} />,
};

// Colores para estados
export const ESTADO_COLORS: Record<FeedbackEstado, string> = {
  Pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  "En progreso": "bg-blue-100 text-blue-800 border-blue-300",
  Resuelto: "bg-green-100 text-green-800 border-green-300",
  Descartado: "bg-gray-100 text-gray-800 border-gray-300",
};

// Iconos para estados
export const ESTADO_ICONS: Record<FeedbackEstado, React.ReactNode> = {
  Pendiente: <Clock size={14} />,
  "En progreso": <Loader2 size={14} className="animate-spin" />,
  Resuelto: <CheckCircle size={14} />,
  Descartado: <XCircle size={14} />,
};

// Colores para prioridades
export const PRIORIDAD_COLORS: Record<FeedbackPrioridad, string> = {
  Baja: "bg-gray-100 text-gray-700",
  Media: "bg-blue-100 text-blue-700",
  Alta: "bg-orange-100 text-orange-700",
  Critica: "bg-red-100 text-red-700",
};

// Iconos para dispositivos
export const DISPOSITIVO_ICONS: Record<string, React.ReactNode> = {
  Escritorio: <Monitor size={14} />,
  Móvil: <Smartphone size={14} />,
  Tablet: <Tablet size={14} />,
};

// Opciones para filtros
export const ESTADO_OPTIONS: FeedbackEstado[] = ["Pendiente", "En progreso", "Resuelto", "Descartado"];
export const PRIORIDAD_OPTIONS: FeedbackPrioridad[] = ["Critica", "Alta", "Media", "Baja"];
export const TIPO_OPTIONS: FeedbackTipo[] = ["Bug", "Mejora", "Pregunta", "Otro"];
