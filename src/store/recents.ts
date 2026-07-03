import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentEntry {
  varianteId: string;
  nombre: string;
  marca?: string;
  tamano?: string;
  count: number;
  lastUsed: number;
}

interface RecentsState {
  entries: Record<string, RecentEntry>;
  registrarUso: (p: {
    varianteId: string;
    nombre: string;
    marca?: string;
    tamano?: string;
  }) => void;
}

const MAX_ENTRADAS = 40;

export const useRecentsStore = create<RecentsState>()(
  persist(
    (set) => ({
      entries: {},
      registrarUso: (p) =>
        set((s) => {
          const previo = s.entries[p.varianteId];
          const entries = {
            ...s.entries,
            [p.varianteId]: {
              varianteId: p.varianteId,
              nombre: p.nombre,
              marca: p.marca,
              tamano: p.tamano,
              count: (previo?.count ?? 0) + 1,
              lastUsed: Date.now(),
            },
          };
          // Recorte simple: si crece demasiado, tirar las menos usadas
          // recientemente (client-side, no hace falta ser preciso).
          const claves = Object.keys(entries);
          if (claves.length > MAX_ENTRADAS) {
            const aBorrar = claves
              .map((k) => entries[k])
              .sort((a, b) => a.lastUsed - b.lastUsed)
              .slice(0, claves.length - MAX_ENTRADAS);
            for (const e of aBorrar) delete entries[e.varianteId];
          }
          return { entries };
        }),
    }),
    { name: "gondolapp-recents" }
  )
);

export function useRecientes(limit = 8): RecentEntry[] {
  const entries = useRecentsStore((s) => s.entries);
  return Object.values(entries)
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .slice(0, limit);
}

export function useFrecuentes(limit = 8): RecentEntry[] {
  const entries = useRecentsStore((s) => s.entries);
  return Object.values(entries)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
