"use client";

import { SkeletonCard } from "@/components/lists/SkeletonCard";
import { useHistorialVencimiento } from "@/hooks/useVencimiento";
import { motion as m } from "framer-motion";
import { History } from "lucide-react";
import { HistorialCard } from "./HistorialCard";

interface HistorialListProps {
  filtros?: {
    desde?: Date;
    hasta?: Date;
    limite?: number;
  };
}

export function HistorialList({ filtros }: HistorialListProps) {
  const { data: retirados = [], isLoading } = useHistorialVencimiento(filtros);

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (retirados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-fg-tertiary">
        <m.div
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <History size={48} className="mb-4 opacity-50" />
        </m.div>
        <p className="text-headline text-fg-secondary text-center">No hay productos retirados</p>
        <p className="text-footnote text-center mt-1">
          Los productos que retires aparecerán acá
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {retirados.map((item) => (
        <HistorialCard key={item.id} item={item} />
      ))}
    </div>
  );
}
