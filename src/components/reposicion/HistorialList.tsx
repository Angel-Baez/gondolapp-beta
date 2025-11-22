"use client";

import { HistorialCard } from "@/components/reposicion/HistorialCard";
import { SkeletonCard } from "@/components/reposicion/SkeletonCard";
import { useReposicionStore } from "@/store/reposicion";
import { ListaReposicionHistorial } from "@/types";
import { motion as m } from "framer-motion";
import { History } from "lucide-react";
import { useEffect, useState } from "react";

interface HistorialListProps {
  filtros?: {
    desde?: Date;
    hasta?: Date;
    limite?: number;
  };
}

export function HistorialList({ filtros }: HistorialListProps) {
  const [listas, setListas] = useState<ListaReposicionHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const { obtenerHistorial } = useReposicionStore();

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const historial = await obtenerHistorial(filtros);
      setListas(historial);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [filtros]);

  const handleDeleted = () => {
    // Recargar el historial después de eliminar una lista
    cargarHistorial();
  };

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (listas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-gray-500">
        <m.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <History
            size={48}
            className="mb-3 sm:mb-4 opacity-50 sm:w-16 sm:h-16"
          />
        </m.div>
        <p className="text-base sm:text-lg font-semibold text-center">
          No hay listas guardadas
        </p>
        <p className="text-xs sm:text-sm text-center mt-1">
          Las listas que guardes aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listas.map((lista) => (
        <HistorialCard key={lista.id} lista={lista} onDeleted={handleDeleted} />
      ))}
    </div>
  );
}
