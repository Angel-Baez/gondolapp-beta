"use client";

import { useAuth } from "@/components/AuthProvider";
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
  /** Entradas por tienda (Fase 2 multi-tienda, spec §4.4): los recientes
   * de una tienda no aparecen en otra. */
  entries: Record<string, Record<string, RecentEntry>>;
  registrarUso: (
    tiendaId: string,
    p: {
      varianteId: string;
      nombre: string;
      marca?: string;
      tamano?: string;
    }
  ) => void;
}

const MAX_ENTRADAS = 40;

export const useRecentsStore = create<RecentsState>()(
  persist(
    (set) => ({
      entries: {},
      registrarUso: (tiendaId, p) =>
        set((s) => {
          const deTienda = s.entries[tiendaId] ?? {};
          const previo = deTienda[p.varianteId];
          const actualizadas = {
            ...deTienda,
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
          const claves = Object.keys(actualizadas);
          if (claves.length > MAX_ENTRADAS) {
            const aBorrar = claves
              .map((k) => actualizadas[k])
              .sort((a, b) => a.lastUsed - b.lastUsed)
              .slice(0, claves.length - MAX_ENTRADAS);
            for (const e of aBorrar) delete actualizadas[e.varianteId];
          }
          return { entries: { ...s.entries, [tiendaId]: actualizadas } };
        }),
    }),
    {
      name: "gondolapp-recents",
      // v1: entries pasa de plano (por variante) a anidado (por tienda).
      // El shape viejo no sabe de qué tienda era: se descarta.
      version: 1,
      migrate: () => ({ entries: {} }) as RecentsState,
    }
  )
);

const SIN_ENTRADAS: Record<string, RecentEntry> = {};

function useEntradasDeTienda(): Record<string, RecentEntry> {
  const { tiendaActiva } = useAuth();
  const entries = useRecentsStore((s) => s.entries);
  return (tiendaActiva && entries[tiendaActiva]) || SIN_ENTRADAS;
}

export function useRecientes(limit = 8): RecentEntry[] {
  const entries = useEntradasDeTienda();
  return Object.values(entries)
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .slice(0, limit);
}

export function useFrecuentes(limit = 8): RecentEntry[] {
  const entries = useEntradasDeTienda();
  return Object.values(entries)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
