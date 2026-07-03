"use client";

import { useOutboxStore } from "@/store/outbox";
import { CloudOff } from "lucide-react";

/** Indicador discreto de cambios guardados localmente a la espera de conexión. */
export function OutboxBadge() {
  const pendingCount = useOutboxStore((s) => s.pendingCount);
  if (pendingCount === 0) return null;

  return (
    <div
      className="flex items-center gap-1 h-8 px-2.5 rounded-full bg-surface-2 text-fg-tertiary text-caption font-semibold"
      title={`${pendingCount} cambio${pendingCount === 1 ? "" : "s"} sin sincronizar`}
    >
      <CloudOff size={14} />
      <span className="tabular-nums">{pendingCount}</span>
    </div>
  );
}
