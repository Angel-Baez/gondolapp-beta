"use client";

import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

/**
 * Modal - Componente de modal adaptativo
 * 
 * En móvil: Se muestra como Bottom Sheet (desde abajo, con gesto de arrastre)
 * En desktop: Se muestra como modal centrado tradicional
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Manejar el gesto de arrastre (solo para móvil)
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Cerrar si se arrastra más de 100px hacia abajo o con velocidad alta
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose]
  );

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {isMobile ? (
            /* Bottom Sheet para móvil */
            <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ 
                  type: "spring", 
                  damping: 30, 
                  stiffness: 300 
                }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={handleDragEnd}
                onClick={(e) => e.stopPropagation()}
                className={`w-full ${sizeClasses[size]} bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col`}
              >
                {/* Handle Indicator - Área de arrastre */}
                <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                {title && (
                  <div className="px-4 pb-3 pt-1 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button
                      onClick={onClose}
                      className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition"
                      aria-label="Cerrar"
                    >
                      <X size={24} />
                    </button>
                  </div>
                )}

                {/* Body */}
                <div className="p-4 overflow-y-auto flex-1">{children}</div>
              </motion.div>
            </div>
          ) : (
            /* Modal centrado para desktop */
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden`}
              >
                {/* Header */}
                {title && (
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button
                      onClick={onClose}
                      className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition"
                      aria-label="Cerrar"
                    >
                      <X size={24} />
                    </button>
                  </div>
                )}

                {/* Body */}
                <div className="p-4 max-h-[70vh] overflow-y-auto">{children}</div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
