import { create } from "zustand";

/** Estado de UI (no de negocio) para reflejar la cola offline: cuántas
 * operaciones esperan sincronizarse y si hay una corrida de sync en curso. */
interface OutboxState {
  pendingCount: number;
  isSyncing: boolean;
  setPendingCount: (n: number) => void;
  setSyncing: (v: boolean) => void;
}

export const useOutboxStore = create<OutboxState>((set) => ({
  pendingCount: 0,
  isSyncing: false,
  setPendingCount: (n) => set({ pendingCount: n }),
  setSyncing: (v) => set({ isSyncing: v }),
}));
