import type { Transition } from "framer-motion";

/**
 * Física de animación compartida (OneUI × iOS 26).
 * Todos los componentes nuevos importan de acá en vez de
 * definir springs ad-hoc, para que la app se mueva "igual".
 */

/** Interacciones rápidas: chips, tabs, cards flotantes. */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 32,
};

/** Transiciones de contenido: colapso de header, expandir cards. */
export const springGentle: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

/** Sheets y modales (mismo feel que el BottomSheet existente). */
export const springSheet: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 26,
  mass: 0.8,
};
