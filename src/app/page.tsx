"use client";

import { MainContent } from "@/components/HomePage/MainContent";
import { NavigationTabs } from "@/components/HomePage/NavigationTabs";
import { ScanWorkflow } from "@/components/HomePage/ScanWorkflow";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Header, BottomNavigation } from "@/components/ui";
import { ScanMode } from "@/types";
import { motion as m } from "framer-motion";
import { Archive, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type ActiveView = "reposicion" | "vencimiento";

// Loading fallback para Suspense
function HomePageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
    </div>
  );
}

/**
 * HomePage - Refactorizada siguiendo principios SOLID
 *
 * ✅ SOLID Principles aplicados:
 * - SRP: Solo responsable de composición de componentes
 * - OCP: Extensible sin modificar código existente
 * - LSP: Componentes intercambiables
 * - DIP: Depende de abstracciones (componentes reutilizables)
 *
 * ✅ PWA Shortcuts Support:
 * - ?action=scan → Abre el escáner automáticamente
 * - ?view=reposicion → Muestra vista de reposición
 * - ?view=vencimiento → Muestra vista de vencimientos
 * 
 * ✅ Native Mobile UI:
 * - Bottom Tab Navigation (iOS/Android style)
 * - Floating Scan Button in center
 * - Safe area insets support
 */
function HomePageContent() {
  const router = useRouter();
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

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
    setScanMode(view);
  };

  const handleSyncClick = () => {
    // Navigate to admin page with sync panel open
    router.push("/admin?panel=sync");
  };

  const handleAdminClick = () => {
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg font-sans transition-colors">
      <div className="max-w-lg mx-auto bg-white dark:bg-dark-surface min-h-screen sm:rounded-3xl sm:my-4 shadow-2xl overflow-hidden flex flex-col transition-colors pb-bottom-nav">
        <Header
          variant="main"
          title="GondolApp"
          subtitle="Gestor de Inventario Inteligente"
          icon={Archive}
          animateIcon
          rightContent={
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          }
        />
        <NavigationTabs activeView={activeView} onViewChange={handleViewChange} />
        <MainContent activeView={activeView} />
      </div>

      {/* Bottom Navigation - Native mobile style */}
      <BottomNavigation
        activeView={activeView}
        onViewChange={handleViewChange}
        onScanClick={handleOpenScanner}
        onSyncClick={handleSyncClick}
        onAdminClick={handleAdminClick}
      />

      {/* Scan Workflow - Maneja todo el flujo de escaneo y modales */}
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
