"use client";

import { useCerrarSesion } from "@/hooks/useCerrarSesion";
import { Loader2, LogOut } from "lucide-react";

/** Botón de logout del header (mismo formato que las demás acciones). */
export function BotonCerrarSesion() {
  const { cerrarSesion, cerrando } = useCerrarSesion();

  return (
    <button
      onClick={cerrarSesion}
      disabled={cerrando}
      aria-label="Cerrar sesión"
      className="w-11 h-11 flex items-center justify-center rounded-full text-fg-secondary hover:bg-surface-2 transition-colors disabled:opacity-50"
    >
      {cerrando ? (
        <Loader2 size={22} className="animate-spin" />
      ) : (
        <LogOut size={22} />
      )}
    </button>
  );
}
