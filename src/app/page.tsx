"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Settings } from "lucide-react";
import { motion as m } from "framer-motion";
import { Header } from "@/components/ui";
import { NavigationTabs } from "@/components/HomePage/NavigationTabs";
import { ScanButton } from "@/components/HomePage/ScanButton";
import { MainContent } from "@/components/HomePage/MainContent";
import { ScanWorkflow } from "@/components/HomePage/ScanWorkflow";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScanMode } from "@/types";

type ActiveView = "reposicion" | "vencimiento";

/**
 * HomePage - Refactorizada siguiendo principios SOLID
 * 
 * ✅ SOLID Principles aplicados:
 * - SRP: Solo responsable de composición de componentes
 * - OCP: Extensible sin modificar código existente
 * - LSP: Componentes intercambiables
 * - DIP: Depende de abstracciones (componentes reutilizables)
 */
export default function HomePage() {
  const [activeView, setActiveView] = useState<ActiveView>("reposicion");
  const [showScanWorkflow, setShowScanWorkflow] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("reposicion");

  const handleOpenScanner = () => {
    const newScanMode = activeView === "reposicion" ? "reposicion" : "vencimiento";
    console.log("handleOpenScanner called. activeView:", activeView, "newScanMode:", newScanMode);
    setScanMode(newScanMode);
    setShowScanWorkflow(true);
  };

  const handleCloseScanWorkflow = () => {
    setShowScanWorkflow(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg font-sans transition-colors">
      <div className="max-w-lg mx-auto bg-white dark:bg-dark-surface min-h-screen sm:rounded-3xl sm:my-4 shadow-2xl overflow-hidden flex flex-col transition-colors">
        <Header
          variant="main"
          title="GondolApp"
          subtitle="Gestor de Inventario Inteligente"
          icon={Archive}
          animateIcon
          rightContent={
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/admin"
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <m.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}>
                  <Settings size={20} />
                </m.div>
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </div>
          }
        />
        <NavigationTabs activeView={activeView} onViewChange={setActiveView} />
        <ScanButton activeView={activeView} onScanClick={handleOpenScanner} />
        <MainContent activeView={activeView} />
      </div>

      {/* Scan Workflow - Maneja todo el flujo de escaneo y modales */}
      {showScanWorkflow && (
        <ScanWorkflow
          scanMode={scanMode}
          onClose={handleCloseScanWorkflow}
        />
      )}
    </div>
  );
}
