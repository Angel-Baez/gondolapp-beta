"use client";

import { FeedbackFAB, FeedbackForm } from "@/components/feedback";

/**
 * FeedbackProvider - Wrapper para los componentes de feedback
 * 
 * Este componente cliente proporciona el FAB flotante y el formulario modal
 * para que los beta-testers puedan enviar feedback desde cualquier página.
 */
export function FeedbackProvider() {
  return (
    <>
      <FeedbackFAB />
      <FeedbackForm />
    </>
  );
}
