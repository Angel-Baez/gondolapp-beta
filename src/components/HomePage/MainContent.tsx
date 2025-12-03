import { ReposicionList } from "@/components/reposicion/ReposicionList";
import { VencimientoList } from "@/components/vencimiento/VencimientoList";
import { motion as m, AnimatePresence } from "framer-motion";
import { ActiveView } from "@/types";

interface MainContentProps {
  activeView: ActiveView;
}

/**
 * MainContent component para HomePage
 * 
 * ✅ Native Mobile Features:
 * - Animated view transitions
 * - Proper padding for content
 * - Smooth scroll behavior
 */
export function MainContent({ activeView }: MainContentProps) {
  return (
    <div className="flex-1 p-4">
      <AnimatePresence mode="wait">
        {activeView === "reposicion" ? (
          <m.div
            key="reposicion"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <ReposicionList />
          </m.div>
        ) : (
          <m.div
            key="vencimiento"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <VencimientoList />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
