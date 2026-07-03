"use client";

import React, { RefObject, useRef } from "react";

export interface AppShellProps {
  /** Header renderizado dentro del contenedor de scroll (recibe el ref para el colapso). */
  renderHeader: (
    scrollRef: RefObject<HTMLDivElement | null>
  ) => React.ReactNode;
  children: React.ReactNode;
  /** Barra flotante inferior (TabBar en home; omitir en subpáginas). */
  bottomBar?: React.ReactNode;
}

/**
 * Marco de la app: canvas OneUI, ancho de teléfono centrado y un único
 * contenedor de scroll que aloja al header colapsable (sticky) y al
 * contenido, con clearance para la tab bar flotante.
 */
export function AppShell({ renderHeader, children, bottomBar }: AppShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-dvh bg-canvas">
      <div className="max-w-lg mx-auto h-full relative">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto native-scroll"
          style={{
            paddingBottom: bottomBar ? "var(--tabbar-clearance)" : undefined,
          }}
        >
          {renderHeader(scrollRef)}
          <div className="px-4">{children}</div>
        </div>
        {bottomBar}
      </div>
    </div>
  );
}
