import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificacionesState {
  /** Preferencia del usuario (además del permiso del navegador): apagarla
   * silencia las alertas sin tocar los permisos del sitio. */
  habilitadas: boolean;
  setHabilitadas: (habilitadas: boolean) => void;
}

export const useNotificacionesStore = create<NotificacionesState>()(
  persist(
    (set) => ({
      habilitadas: false,
      setHabilitadas: (habilitadas) => set({ habilitadas }),
    }),
    { name: "gondolapp-notificaciones" }
  )
);
