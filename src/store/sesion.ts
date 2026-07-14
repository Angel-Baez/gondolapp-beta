"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RolTienda = "admin" | "empleado";

interface SesionState {
  /** Tienda activa persistida: necesaria para el buster del cache y las
   * query keys en arranque frío offline, cuando la membresía no se puede
   * consultar (docs/SPECMULTIUSER.md §4.4). */
  tiendaActivaId: string | null;
  rol: RolTienda | null;
  setTienda: (tiendaId: string | null, rol: RolTienda | null) => void;
}

export const useSesionStore = create<SesionState>()(
  persist(
    (set) => ({
      tiendaActivaId: null,
      rol: null,
      setTienda: (tiendaId, rol) => set({ tiendaActivaId: tiendaId, rol }),
    }),
    { name: "gondolapp-sesion" }
  )
);
