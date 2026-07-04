"use client";

export const MIN_ITEMS_FOR_COLLAPSE = 10;
const COLLAPSED_HEIGHT = "300px";

interface CollapsibleSectionProps {
  children: React.ReactNode;
  isExpanded: boolean;
  itemCount: number;
}

/**
 * Envoltorio que colapsa una sección con más de MIN_ITEMS_FOR_COLLAPSE items.
 * Expandida se renderiza sin tope de altura: scrollea la página, no una caja
 * interna (el max-height + overflow-y-auto anterior creaba un scroll anidado
 * que en móvil convertía cada gesto en una lotería de cuál lista se movía).
 */
export function CollapsibleSection({
  children,
  isExpanded,
  itemCount,
}: CollapsibleSectionProps) {
  const shouldCollapse = itemCount >= MIN_ITEMS_FOR_COLLAPSE;

  if (!shouldCollapse || isExpanded) {
    return <div className="space-y-2">{children}</div>;
  }

  return (
    <div className="relative">
      <div
        className="overflow-hidden relative"
        style={{ maxHeight: COLLAPSED_HEIGHT }}
      >
        <div className="space-y-2">{children}</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-canvas to-transparent pointer-events-none" />
    </div>
  );
}
