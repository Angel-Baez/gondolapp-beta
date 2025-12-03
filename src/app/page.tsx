"use client";

import { MainContent } from "@/components/HomePage/MainContent";
import { ScanWorkflow } from "@/components/HomePage/ScanWorkflow";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BottomNavBar, NativeHeader, ScanFAB } from "@/components/ui";
import { ActiveView, ScanMode } from "@/types";
import { motion as m } from "framer-motion";
import { Archive, Loader2, Scan, Settings } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// Loading fallback para Suspense
function HomePageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
      <m.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Archive className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="absolute -bottom-1 -right-1 w-6 h-6 animate-spin text-cyan-500" />
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cargando...</p>
      </m.div>
    </div>
  );
}

/**
 * HomePage - Native Mobile PWA Design
 *
 * ✅ Native Mobile Features:
 * - Bottom navigation bar for thumb-friendly access
 * - Floating Action Button (FAB) for primary scan action
 * - iOS-style large title header
 * - Full-screen scanner overlay
 * - Safe area insets support
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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg font-sans transition-colors">
      {/* Main container with max-width for tablets */}
      <div className="max-w-lg mx-auto bg-white dark:bg-dark-surface min-h-screen flex flex-col transition-colors relative">
        {/* Native Header */}
        <NativeHeader
          title="GondolApp"
          subtitle="Gestor de Inventario Inteligente"
          icon={Archive}
          accentColor={activeView === "reposicion" ? "cyan" : "red"}
          rightContent={
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Link
                href="/admin"
                className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Administración"
              >
                <m.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <Settings size={22} />
                </m.div>
              </Link>
            </div>
          }
        />

        {/* Main Content Area - with padding for bottom nav */}
        <main className="flex-1 overflow-y-auto pb-36 native-scroll">
          <MainContent activeView={activeView} />
        </main>

        {/* Floating Scan Button */}
        <ScanFAB
          icon={Scan}
          onClick={handleOpenScanner}
          activeView={activeView}
        />

        {/* Bottom Navigation */}
        <BottomNavBar activeView={activeView} onViewChange={setActiveView} />
      </div>

      {/* Scan Workflow - Full screen overlay */}
      {showScanWorkflow && (
        <ScanWorkflow scanMode={scanMode} onClose={handleCloseScanWorkflow} />
      )}
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
