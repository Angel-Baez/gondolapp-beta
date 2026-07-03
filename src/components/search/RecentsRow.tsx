"use client";

import { RecentEntry, useFrecuentes, useRecientes } from "@/store/recents";
import { useState } from "react";

export interface RecentsRowProps {
  onSelect: (entry: RecentEntry) => void;
}

/** Chips horizontales de "Recientes" / "Frecuentes" para agregar en 1 tap sin escanear. */
export function RecentsRow({ onSelect }: RecentsRowProps) {
  const [tab, setTab] = useState<"recientes" | "frecuentes">("recientes");
  const recientes = useRecientes(8);
  const frecuentes = useFrecuentes(8);
  const items = tab === "recientes" ? recientes : frecuentes;

  if (recientes.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        {(["recientes", "frecuentes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tap-compact px-3 rounded-chip text-footnote font-semibold capitalize transition-colors ${
              tab === t ? "bg-accent text-on-accent" : "text-fg-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
        {items.map((entry) => (
          <button
            key={entry.varianteId}
            onClick={() => onSelect(entry)}
            className="flex-shrink-0 max-w-[9.5rem] px-3.5 py-2 rounded-field bg-surface-2 text-left"
          >
            <p className="text-subhead font-medium text-fg truncate">{entry.nombre}</p>
            {entry.marca && (
              <p className="text-caption text-fg-secondary truncate">{entry.marca}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
