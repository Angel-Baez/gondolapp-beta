import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ActiveView = "reposicion" | "vencimiento";

interface ViewFilters {
  busqueda: string;
  orden: string;
}

interface UiState {
  activeView: ActiveView;
  /** Búsqueda/orden por vista: cambiar de tab no pierde lo tipeado. */
  filters: Record<ActiveView, ViewFilters>;
  scannerOpen: boolean;
  setActiveView: (view: ActiveView) => void;
  setFilter: (view: ActiveView, patch: Partial<ViewFilters>) => void;
  openScanner: () => void;
  closeScanner: () => void;
}

const FILTROS_INICIALES: Record<ActiveView, ViewFilters> = {
  reposicion: { busqueda: "", orden: "recientes" },
  vencimiento: { busqueda: "", orden: "vencimiento" },
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeView: "reposicion",
      filters: FILTROS_INICIALES,
      scannerOpen: false,
      setActiveView: (view) => set({ activeView: view }),
      setFilter: (view, patch) =>
        set((s) => ({
          filters: { ...s.filters, [view]: { ...s.filters[view], ...patch } },
        })),
      openScanner: () => set({ scannerOpen: true }),
      closeScanner: () => set({ scannerOpen: false }),
    }),
    {
      name: "gondolapp-ui",
      // Solo la vista activa sobrevive al cierre; búsquedas viejas no.
      partialize: (s) => ({ activeView: s.activeView }),
    }
  )
);
