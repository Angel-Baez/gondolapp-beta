"use client";

import { useEffect } from "react";
import InstallBanner from "@/components/InstallBanner";
import { initializeServices } from "@/core/container/serviceConfig";

export default function PWAProvider() {
  // Inicializar servicios SOLID al montar la aplicación
  useEffect(() => {
    initializeServices();
  }, []);

  return <InstallBanner />;
}
