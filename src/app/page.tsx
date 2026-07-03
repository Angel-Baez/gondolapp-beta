"use client";

import { ScanFlow } from "@/components/scanner/ScanFlow";
import { ProductSearchSheet } from "@/components/search/ProductSearchSheet";
import { AppShell } from "@/components/shell/AppShell";
import { CollapsingHeader } from "@/components/shell/CollapsingHeader";
import { TabBar } from "@/components/shell/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReposicionList } from "@/components/reposicion/ReposicionList";
import { VencimientoList } from "@/components/vencimiento/VencimientoList";
import { springGentle } from "@/lib/motion";
import { ActiveView, useUiStore } from "@/store/ui";
import { AnimatePresence, motion as m } from "framer-motion";
import { History, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const VISTA_META: Record<ActiveView, { titulo: string; subtitulo: string }> = {
  reposicion: { titulo: "Reposición", subtitulo: "Tu lista de reposición" },
  vencimiento: { titulo: "Vencimientos", subtitulo: "Productos por vencer" },
};

// Loading fallback para Suspense
function HomePageLoading() {
  return (
    <div className="h-dvh bg-canvas flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );
}

/**
 * HomePage — shell nativo OneUI × iOS 26:
 * header grande colapsable + tab bar flotante con botón de escaneo central.
 *
 * PWA Shortcuts:
 * - ?action=scan → abre el escáner (se limpia solo `action` de la URL)
 * - ?view=reposicion | vencimiento → cambia la vista (queda en la URL,
 *   así un refresh restaura la tab activa)
 */
function HomePageContent() {
  const searchParams = useSearchParams();
  const { activeView, setActiveView, scannerOpen, openScanner, closeScanner } =
    useUiStore();
  const [searchOpen, setSearchOpen] = useState(false);

  // Manejar URL params (shortcuts PWA y deep links)
  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "reposicion" || view === "vencimiento") {
      setActiveView(view);
    }

    const action = searchParams.get("action");
    if (action === "scan") {
      // Pequeño delay para asegurar que la UI está lista
      const timer = setTimeout(() => {
        openScanner();
        const params = new URLSearchParams(window.location.search);
        params.delete("action");
        const qs = params.toString();
        window.history.replaceState({}, "", qs ? `/?${qs}` : "/");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setActiveView, openScanner]);

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
    window.history.replaceState({}, "", `/?view=${view}`);
  };

  const meta = VISTA_META[activeView];
  const direccion = activeView === "vencimiento" ? 1 : -1;

  return (
    <>
      <AppShell
        renderHeader={(scrollRef) => (
          <CollapsingHeader
            title={meta.titulo}
            subtitle={meta.subtitulo}
            scrollContainerRef={scrollRef}
            rightActions={
              <>
                <Link
                  href={`/${activeView}/historial`}
                  aria-label="Ver historial"
                  className="w-11 h-11 flex items-center justify-center rounded-full text-fg-secondary hover:bg-surface-2 transition-colors"
                >
                  <History size={22} />
                </Link>
                <ThemeToggle />
              </>
            }
            bottomSlot={
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full h-12 px-4 rounded-full bg-surface-2 flex items-center gap-2.5 text-fg-tertiary"
              >
                <Search size={18} />
                <span className="text-body">Buscar producto...</span>
              </button>
            }
          />
        )}
        bottomBar={
          <TabBar
            active={activeView}
            onChange={handleViewChange}
            onScan={openScanner}
          />
        }
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <m.div
            key={activeView}
            initial={{ opacity: 0, x: direccion * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direccion * -24 }}
            transition={springGentle}
          >
            {activeView === "reposicion" ? (
              <ReposicionList />
            ) : (
              <VencimientoList />
            )}
          </m.div>
        </AnimatePresence>
      </AppShell>

      {/* Flujo de escaneo: cámara + auto-agregado / alta de vencimiento */}
      {scannerOpen && (
        <ScanFlow
          scanMode={activeView}
          onClose={closeScanner}
          onRequestSearch={() => {
            closeScanner();
            setSearchOpen(true);
          }}
        />
      )}

      {/* Agregar sin cámara: búsqueda por nombre/marca + recientes/frecuentes */}
      <ProductSearchSheet
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        mode={activeView}
      />
    </>
  );
}

// Componente principal con Suspense boundary para useSearchParams
export default function HomePage() {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageContent />
    </Suspense>
  );
}
