"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect } from "react";
import { BottomSheet } from "./BottomSheet";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /**
   * Forzar el uso de BottomSheet en móviles (default: true)
   * Si es false, siempre usará el modal centrado tradicional
   */
  useBottomSheetOnMobile?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  useBottomSheetOnMobile = true,
}: ModalProps) {
  const isMobile = useIsMobile();
  const useBottomSheet = isMobile && useBottomSheetOnMobile;

  // Solo bloquear scroll para modal desktop (BottomSheet maneja su propio scroll lock)
  useEffect(() => {
    if (useBottomSheet) return; // BottomSheet maneja su propio scroll lock
    
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, useBottomSheet]);

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
  };

  // En móviles, usar BottomSheet para mejor ergonomía
  if (useBottomSheet) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
        {children}
      </BottomSheet>
    );
  }

  // En desktop, usar modal centrado tradicional
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

          {/* Modal */}
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
                  >
                    <X size={24} />
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="p-4 max-h-[70vh] overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
