import { create } from "zustand";

interface FeedbackUIState {
  // Estado del modal de feedback
  isModalOpen: boolean;
  isSubmitting: boolean;
  submitSuccess: boolean;
  submitError: string | null;
  
  // Acciones
  openModal: () => void;
  closeModal: () => void;
  setSubmitting: (value: boolean) => void;
  setSubmitSuccess: (value: boolean) => void;
  setSubmitError: (error: string | null) => void;
  resetState: () => void;
}

export const useFeedbackStore = create<FeedbackUIState>((set) => ({
  // Estado inicial
  isModalOpen: false,
  isSubmitting: false,
  submitSuccess: false,
  submitError: null,

  // Acciones
  openModal: () => set({ isModalOpen: true, submitSuccess: false, submitError: null }),
  closeModal: () => set({ isModalOpen: false }),
  setSubmitting: (value) => set({ isSubmitting: value }),
  setSubmitSuccess: (value) => set({ submitSuccess: value }),
  setSubmitError: (error) => set({ submitError: error }),
  resetState: () => set({
    isModalOpen: false,
    isSubmitting: false,
    submitSuccess: false,
    submitError: null,
  }),
}));
