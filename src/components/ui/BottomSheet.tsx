"use client";

import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect, useCallback, useId } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /**
   * Clases CSS adicionales para el header
   */
  headerClassName?: string;
}

// iOS-like spring configuration for native feel
const springConfig = {
  type: "spring" as const,
  damping: 26,
  stiffness: 400,
  mass: 0.8,
};

// Drag-to-close thresholds
const DRAG_CLOSE_OFFSET = 80; // pixels dragged down to trigger close
const DRAG_CLOSE_VELOCITY = 300; // velocity threshold to trigger close

/**
 * BottomSheet - Modal que se desliza desde abajo para dispositivos móviles
 * 
 * Características:
 * - Se desliza desde la parte inferior de la pantalla
 * - Soporta gesto de arrastre para cerrar (drag-to-close)
 * - Máximo 85vh de altura con scroll interno
 * - Handle visual para indicar que es arrastrable
 * - Accesibilidad: role="dialog", aria-modal, aria-labelledby
 * - Animación tipo iOS con spring suave
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  headerClassName,
}: BottomSheetProps) {
  const titleId = useId();
  
  // Bloquear scroll del body cuando está abierto
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

  // Manejar el gesto de arrastre con velocity-based threshold
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const shouldClose = 
        info.offset.y > DRAG_CLOSE_OFFSET ||
        info.velocity.y > DRAG_CLOSE_VELOCITY;
      
      if (shouldClose) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <AnimatePresence mode="sync">
      {isOpen && (
        <>
          {/* Backdrop with faster animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Bottom Sheet with iOS-like spring */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springConfig}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-surface rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col touch-none select-none safe-area-bottom transition-colors"
            style={{ willChange: "transform" }}
          >
            {/* Handle para arrastrar - visible and accessible */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-dark-border rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className={`px-4 pb-3 border-b border-gray-100 dark:border-dark-border flex items-center justify-between ${headerClassName || ""}`}>
                <h3 id={titleId} className={`text-xl font-bold ${headerClassName ? "" : "text-gray-900 dark:text-gray-100"}`}>{title}</h3>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "tween", duration: 0.1 }}
                  onClick={onClose}
                  className={`p-2 rounded-full transition-colors touch-manipulation ${headerClassName ? "hover:bg-white/20 active:bg-white/30 text-current" : "hover:bg-gray-100 dark:hover:bg-dark-card active:bg-gray-200 dark:active:bg-dark-border text-gray-500 dark:text-gray-400"}`}
                  aria-label="Cerrar"
                >
                  <X size={24} />
                </motion.button>
              </div>
            )}

            {/* Body con scroll nativo */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 native-scroll">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
