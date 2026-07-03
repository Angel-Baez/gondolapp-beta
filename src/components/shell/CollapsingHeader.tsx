"use client";

import { motion as m, useScroll, useTransform } from "framer-motion";
import React, { RefObject } from "react";

export interface CollapsingHeaderProps {
  title: string;
  subtitle?: string;
  /** Contenedor scrolleable que maneja el colapso (el <main> del AppShell). */
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  /** Acciones a la derecha de la barra compacta (siempre visibles). */
  rightActions?: React.ReactNode;
  /** Slot bajo el título grande (ej. pill de búsqueda). Scrollea con el contenido. */
  bottomSlot?: React.ReactNode;
  /** Contenido a la izquierda de la barra compacta (ej. botón volver). */
  leftAction?: React.ReactNode;
}

/**
 * Header grande colapsable estilo OneUI: el título display scrollea y se
 * desvanece mientras una barra compacta glass aparece fija arriba.
 * Usa sticky dentro del contenedor de scroll (no fixed) para evitar el
 * bug de position:fixed + teclado en iOS Safari.
 */
export function CollapsingHeader({
  title,
  subtitle,
  scrollContainerRef,
  rightActions,
  bottomSlot,
  leftAction,
}: CollapsingHeaderProps) {
  const { scrollY } = useScroll({ container: scrollContainerRef });

  const largeOpacity = useTransform(scrollY, [0, 72], [1, 0]);
  const largeY = useTransform(scrollY, [0, 96], [0, -8]);
  const compactTitleOpacity = useTransform(scrollY, [56, 96], [0, 1]);
  const compactTitleY = useTransform(scrollY, [56, 96], [6, 0]);
  const barBgOpacity = useTransform(scrollY, [24, 72], [0, 1]);

  return (
    <>
      {/* Barra compacta: sticky, fondo glass que aparece al scrollear */}
      <div className="sticky top-0 z-20">
        <m.div
          style={{ opacity: barBgOpacity }}
          className="absolute inset-0 glass border-x-0 border-t-0"
          aria-hidden
        />
        <div className="relative safe-area-top">
          <div className="h-[var(--header-h-collapsed)] px-4 flex items-center gap-2">
            {leftAction}
            <m.span
              style={{ opacity: compactTitleOpacity, y: compactTitleY }}
              className="text-headline text-fg flex-1 truncate"
            >
              {title}
            </m.span>
            <div className="flex items-center gap-1">{rightActions}</div>
          </div>
        </div>
      </div>

      {/* Bloque de título grande: scrollea bajo la barra y se desvanece */}
      <div className="px-5 pt-1 pb-3">
        <m.div style={{ opacity: largeOpacity, y: largeY }}>
          <h1 className="text-display text-fg">{title}</h1>
          {subtitle && (
            <p className="text-subhead text-fg-secondary mt-1">{subtitle}</p>
          )}
        </m.div>
        {bottomSlot && <div className="mt-4">{bottomSlot}</div>}
      </div>
    </>
  );
}
