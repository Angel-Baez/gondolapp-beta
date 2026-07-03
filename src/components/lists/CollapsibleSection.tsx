"use client";

import { motion as m } from "framer-motion";

export const MIN_ITEMS_FOR_COLLAPSE = 10;
const EXPANDED_HEIGHT = "600px";
const COLLAPSED_HEIGHT = "300px";

interface CollapsibleSectionProps {
  children: React.ReactNode;
  isExpanded: boolean;
  itemCount: number;
}

/** Envoltorio que colapsa una sección con más de MIN_ITEMS_FOR_COLLAPSE items, con fade de salida. */
export function CollapsibleSection({
  children,
  isExpanded,
  itemCount,
}: CollapsibleSectionProps) {
  const shouldCollapse = itemCount >= MIN_ITEMS_FOR_COLLAPSE;

  if (!shouldCollapse) {
    return <div className="space-y-2">{children}</div>;
  }

  return (
    <div className="relative">
      <m.div
        initial={false}
        animate={{ maxHeight: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={isExpanded ? "overflow-y-auto relative" : "overflow-hidden relative"}
      >
        <div className="space-y-2">{children}</div>
      </m.div>
      {!isExpanded && (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-canvas to-transparent pointer-events-none" />
      )}
    </div>
  );
}
