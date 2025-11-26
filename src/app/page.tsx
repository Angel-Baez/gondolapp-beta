"use client";

import { useState } from "react";
import { Header } from "@/components/HomePage/Header";
import { NavigationTabs } from "@/components/HomePage/NavigationTabs";
import { ScanButton } from "@/components/HomePage/ScanButton";
import { MainContent } from "@/components/HomePage/MainContent";
import { ScanWorkflow } from "@/components/HomePage/ScanWorkflow";
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
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-lg mx-auto bg-white min-h-screen sm:rounded-3xl sm:my-4 shadow-2xl overflow-hidden flex flex-col">
        <Header />
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
