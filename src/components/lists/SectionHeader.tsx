"use client";

import { motion as m } from "framer-motion";
import { ChevronDown, ChevronUp, LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  count: number;
  icon: LucideIcon;
  /** Color del ícono + acento del label (token, ej. "text-estado-pendiente"). */
  colorClass: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  showToggleButton?: boolean;
}

/** Label de sección OneUI: chico, en mayúsculas, fuera de la isla — sin fondo de color. */
export function SectionHeader({
  title,
  count,
  icon: Icon,
  colorClass,
  isExpanded,
  onToggle,
  showToggleButton,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1 mb-2">
      <div className="flex items-center gap-1.5">
        <Icon size={14} className={colorClass} />
        <h3 className="text-footnote font-semibold text-fg-secondary uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-footnote text-fg-tertiary">{count}</span>
      </div>
      {showToggleButton && onToggle && (
        <m.button
          onClick={onToggle}
          whileTap={{ scale: 0.9 }}
          className="tap-compact px-2 rounded-chip text-fg-tertiary flex items-center"
          aria-label={isExpanded ? "Colapsar sección" : "Expandir sección"}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </m.button>
      )}
    </div>
  );
}
