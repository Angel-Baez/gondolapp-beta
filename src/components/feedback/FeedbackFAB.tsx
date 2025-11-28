"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, X } from "lucide-react";
import { useFeedbackStore } from "@/store/feedback";

/**
 * FeedbackFAB - Floating Action Button para reportar feedback
 * 
 * Componente flotante discreto que permite a los beta-testers
 * acceder rápidamente al formulario de feedback.
 */
export function FeedbackFAB() {
  const { isModalOpen, openModal, closeModal } = useFeedbackStore();

  const handleClick = () => {
    if (isModalOpen) {
      closeModal();
    } else {
      openModal();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-accent-primary text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label={isModalOpen ? "Cerrar formulario de feedback" : "Reportar problema o sugerencia"}
      title={isModalOpen ? "Cerrar" : "Reportar problema o sugerencia"}
    >
      <AnimatePresence mode="wait">
        {isModalOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X size={24} />
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MessageSquarePlus size={24} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
