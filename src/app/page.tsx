"use client";

import { MainContent } from "@/components/HomePage/MainContent";
import { ScanWorkflow } from "@/components/HomePage/ScanWorkflow";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BottomTabBar, FloatingActionButton, TabItem } from "@/components/ui";
import { ScanMode } from "@/types";
import { AnimatePresence, motion as m } from "framer-motion";
import { ListChecks, Clock, Settings, Loader2, Scan } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useMemo } from "react";

type ActiveView = "reposicion" | "vencimiento";

// Loading fallback para Suspense
function HomePageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <m.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-10 h-10 text-cyan-500" />
        </m.div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando...</p>
      </div>
    </div>
  );
}

/**
 * HomePage - Rediseño Native Mobile Experience
 *
 * ✅ Patrones nativos iOS/Android:
 * - Bottom Tab Bar para navegación principal
 * - Floating Action Button para escaneo
 * - Header compacto estilo app store
 * - Transiciones fluidas con spring physics
 * - Safe area support para notch/home indicator
 *
 * ✅ PWA Shortcuts Support:
 * - ?action=scan → Abre el escáner automáticamente
 * - ?view=reposicion → Muestra vista de reposición
 * - ?view=vencimiento → Muestra vista de vencimientos
 */
function HomePageContent() {
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<ActiveView>("reposicion");
  const [showScanWorkflow, setShowScanWorkflow] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("reposicion");

  // Tabs para bottom navigation
  const tabs: TabItem[] = useMemo(
    () => [
      { id: "reposicion", label: "Reposición", icon: ListChecks },
      { id: "vencimiento", label: "Vencimientos", icon: Clock },
    ],
    []
  );

  // Manejar URL params de shortcuts PWA
  useEffect(() => {
    const action = searchParams.get("action");
    const view = searchParams.get("view");

    // Cambiar vista según el parámetro
    if (view === "reposicion" || view === "vencimiento") {
      setActiveView(view);
      setScanMode(view);
      // Clean up URL after handling
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Abrir escáner si action=scan
    if (action === "scan") {
      // Pequeño delay para asegurar que la UI está lista
      const timer = setTimeout(() => {
        setShowScanWorkflow(true);
        // Clean up URL after handling
        window.history.replaceState({}, "", window.location.pathname);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveView(tabId as ActiveView);
  };

  const handleOpenScanner = () => {
    const newScanMode =
      activeView === "reposicion" ? "reposicion" : "vencimiento";
    setScanMode(newScanMode);
    setShowScanWorkflow(true);
  };

  const handleCloseScanWorkflow = () => {
    setShowScanWorkflow(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg font-sans transition-colors flex flex-col">
      {/* Native-style Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-surface/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-dark-border/50 transition-colors safe-area-top">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo/Title */}
            <div className="flex items-center gap-2">
              <m.div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  activeView === "reposicion"
                    ? "bg-gradient-to-br from-cyan-500 to-cyan-600"
                    : "bg-gradient-to-br from-red-500 to-red-600"
                } shadow-lg`}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Scan size={18} className="text-white" />
              </m.div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  GondolApp
                </h1>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 -mt-0.5">
                  Gestor de Inventario
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Link
                href="/admin"
                className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-card active:bg-gray-200 dark:active:bg-dark-border rounded-xl transition-colors"
              >
                <m.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <Settings size={22} className="text-gray-600 dark:text-gray-400" />
                </m.div>
              </Link>
            </div>
          </div>

          {/* Segmented Control - More native iOS feel */}
          <div className="px-4 pb-3">
            <div className="relative flex bg-gray-100 dark:bg-dark-card p-1 rounded-xl">
              {/* Animated indicator */}
              <m.div
                layoutId="segment-indicator"
                className={`absolute inset-y-1 rounded-lg shadow-sm ${
                  activeView === "reposicion"
                    ? "bg-white dark:bg-dark-surface"
                    : "bg-white dark:bg-dark-surface"
                }`}
                style={{
                  left: activeView === "reposicion" ? "4px" : "50%",
                  right: activeView === "reposicion" ? "50%" : "4px",
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
              
              <button
                onClick={() => handleTabChange("reposicion")}
                className={`relative flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 z-10 transition-colors duration-150 select-none touch-manipulation ${
                  activeView === "reposicion"
                    ? "text-cyan-600 dark:text-cyan-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <ListChecks size={18} />
                Reposición
              </button>
              
              <button
                onClick={() => handleTabChange("vencimiento")}
                className={`relative flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 z-10 transition-colors duration-150 select-none touch-manipulation ${
                  activeView === "vencimiento"
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <Clock size={18} />
                Vencimientos
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-lg mx-auto h-full">
          <AnimatePresence mode="wait">
            <m.div
              key={activeView}
              initial={{ opacity: 0, x: activeView === "reposicion" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeView === "reposicion" ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <MainContent activeView={activeView} />
            </m.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Action Button for scanning */}
      <AnimatePresence>
        {!showScanWorkflow && (
          <FloatingActionButton
            onClick={handleOpenScanner}
            icon={Scan}
            label="Escanear"
            variant={activeView === "reposicion" ? "primary" : "secondary"}
            bottomOffset={88}
          />
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar */}
      <BottomTabBar
        tabs={tabs}
        activeTab={activeView}
        onTabChange={handleTabChange}
        accentColor={activeView === "reposicion" ? "cyan" : "red"}
      />

      {/* Scan Workflow - Maneja todo el flujo de escaneo y modales */}
      <AnimatePresence>
        {showScanWorkflow && (
          <ScanWorkflow scanMode={scanMode} onClose={handleCloseScanWorkflow} />
        )}
      </AnimatePresence>
    </div>
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
