"use client";

import Link from "next/link";
import { motion as m } from "framer-motion";
import { ArrowLeft, LucideIcon } from "lucide-react";
import React from "react";

export interface HeaderProps {
  /** Título principal del header */
  title: string;
  /** Subtítulo o descripción */
  subtitle?: string;
  /** Icono a mostrar junto al título */
  icon?: LucideIcon;
  /** URL para el botón de "volver" */
  backHref?: string;
  /** Texto del botón de volver */
  backText?: string;
  /** Contenido personalizado en el lado derecho del header */
  rightContent?: React.ReactNode;
  /** Si el icono debe tener animación */
  animateIcon?: boolean;
  /** Variante del header: 'default' muestra icono a la izquierda, 'main' es para la página principal */
  variant?: "default" | "main";
}

/**
 * Header - Componente reutilizable para headers de la PWA
 * 
 * Proporciona consistencia visual en todas las páginas de la aplicación.
 * 
 * @example
 * // Header básico con navegación
 * <Header
 *   title="Administración"
 *   subtitle="Gestiona tu catálogo de productos"
 *   icon={Database}
 *   backHref="/"
 *   backText="Volver al Inventario"
 * />
 * 
 * @example
 * // Header principal (HomePage)
 * <Header
 *   variant="main"
 *   title="GondolApp"
 *   subtitle="Gestor de Inventario Inteligente"
 *   icon={Archive}
 *   animateIcon
 *   rightContent={<AdminButton />}
 * />
 */
export function Header({
  title,
  subtitle,
  icon: Icon,
  backHref,
  backText = "Volver",
  rightContent,
  animateIcon = false,
  variant = "default",
}: HeaderProps) {
  const renderIcon = () => {
    if (!Icon) return null;

    const iconElement = <Icon className="w-8 h-8 text-accent-primary" />;

    if (animateIcon) {
      return (
        <m.div
          animate={{
            y: [0, -5, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {variant === "main" ? (
            <Icon size={28} className="text-accent-primary" />
          ) : (
            iconElement
          )}
        </m.div>
      );
    }

    if (variant === "main") {
      return <Icon size={28} className="text-accent-primary" />;
    }

    return iconElement;
  };

  // Variante principal (HomePage)
  if (variant === "main") {
    return (
      <header className="bg-gray-900 dark:bg-dark-surface text-white p-6 shadow-lg transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              {renderIcon()}
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          {rightContent}
        </div>
      </header>
    );
  }

  // Variante por defecto (páginas internas)
  return (
    <header className="bg-gray-900 dark:bg-dark-surface text-white p-6 shadow-lg transition-colors">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center text-accent-primary hover:text-cyan-400 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backText}
        </Link>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-accent-primary/20 rounded-lg">
              {renderIcon()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {rightContent}
      </div>
    </header>
  );
}
