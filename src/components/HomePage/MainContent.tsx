import { ReposicionList } from "@/components/reposicion/ReposicionList";
import { VencimientoList } from "@/components/vencimiento/VencimientoList";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { motion as m, AnimatePresence } from "framer-motion";
import { ActiveView } from "@/types";
import { useReposicionStore } from "@/store/reposicion";
import { useCallback } from "react";

// Visual feedback delay for pull-to-refresh (ms)
const REFRESH_FEEDBACK_DELAY = 300;

interface MainContentProps {
  activeView: ActiveView;
}

/**
 * MainContent component para HomePage
 * 
 * ✅ Native Mobile Features:
 * - Animated view transitions
 * - Pull-to-refresh gesture support
 * - Proper padding for content
 * - Smooth scroll behavior
 */
export function MainContent({ activeView }: MainContentProps) {
  const { cargarItems } = useReposicionStore();

  // Refresh handler for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    // Reload items from IndexedDB
    await cargarItems();
    // Add a small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, REFRESH_FEEDBACK_DELAY));
  }, [cargarItems]);

  return (
    <div className="flex-1 p-4">
      <PullToRefresh onRefresh={handleRefresh}>
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
      </PullToRefresh>
    </div>
  );
}
