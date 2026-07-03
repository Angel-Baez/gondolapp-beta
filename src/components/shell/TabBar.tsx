"use client";

import { springSnappy } from "@/lib/motion";
import type { ActiveView } from "@/store/ui";
import { motion as m } from "framer-motion";
import { Clock, ListChecks, ScanBarcode } from "lucide-react";
import { useEffect, useState } from "react";

export interface TabBarProps {
  active: ActiveView;
  onChange: (view: ActiveView) => void;
  /** Botón central prominente; escanea en el modo de la vista activa. */
  onScan: () => void;
}

const esCampoDeTexto = (el: EventTarget | null): boolean =>
  el instanceof HTMLElement &&
  el.matches(
    'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]'
  );

/**
 * Tab bar flotante glass (iOS 26): Reposición | Escanear | Vencimientos.
 * Se esconde mientras un campo de texto tiene foco para no chocar con el
 * teclado en iOS Safari (position:fixed salta con el teclado abierto).
 */
export function TabBar({ active, onChange, onScan }: TabBarProps) {
  const [oculta, setOculta] = useState(false);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (esCampoDeTexto(e.target)) setOculta(true);
    };
    const onFocusOut = () => setOculta(false);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <m.nav
      style={{ x: "-50%", bottom: "max(12px, env(safe-area-inset-bottom))" }}
      animate={{ y: oculta ? 120 : 0, opacity: oculta ? 0 : 1 }}
      transition={springSnappy}
      className="fixed left-1/2 z-30 w-[min(100%-24px,26rem)]"
      aria-label="Navegación principal"
    >
      <div className="glass rounded-full shadow-float h-[var(--tabbar-h)] grid grid-cols-3 items-stretch px-2">
        <TabItem
          label="Reposición"
          icon={<ListChecks size={22} />}
          activo={active === "reposicion"}
          onClick={() => onChange("reposicion")}
        />

        {/* ScanFab central elevado */}
        <div className="relative flex justify-center">
          <m.button
            whileTap={{ scale: 0.88 }}
            transition={springSnappy}
            onClick={onScan}
            aria-label="Escanear producto"
            className="absolute -top-7 w-[60px] h-[60px] rounded-full bg-accent text-on-accent shadow-float flex items-center justify-center"
          >
            <ScanBarcode size={28} />
          </m.button>
        </div>

        <TabItem
          label="Vencimientos"
          icon={<Clock size={22} />}
          activo={active === "vencimiento"}
          onClick={() => onChange("vencimiento")}
        />
      </div>
    </m.nav>
  );
}

function TabItem({
  label,
  icon,
  activo,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={activo ? "page" : undefined}
      className="relative flex flex-col items-center justify-center gap-0.5 no-select"
    >
      {activo && (
        <m.div
          layoutId="tab-pill"
          transition={springSnappy}
          className="absolute inset-x-2 inset-y-2 rounded-full bg-accent/10"
          aria-hidden
        />
      )}
      <span
        className={`relative transition-colors ${
          activo ? "text-accent" : "text-fg-tertiary"
        }`}
      >
        {icon}
      </span>
      <span
        className={`relative text-caption font-semibold transition-colors ${
          activo ? "text-accent" : "text-fg-tertiary"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
