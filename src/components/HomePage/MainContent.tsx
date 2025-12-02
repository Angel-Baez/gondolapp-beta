import { ReposicionList } from "@/components/reposicion/ReposicionList";
import { VencimientoList } from "@/components/vencimiento/VencimientoList";

type ActiveView = "reposicion" | "vencimiento";

interface MainContentProps {
  activeView: ActiveView;
}

/**
 * MainContent component para HomePage
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de mostrar el contenido principal
 * - LSP: Componentes intercambiables
 * 
 * ✅ Native Mobile:
 * - Padding bottom para FAB y bottom tab bar
 * - Native scroll con overscroll behavior
 */
export function MainContent({ activeView }: MainContentProps) {
  return (
    <main 
      className="flex-1 overflow-y-auto p-4 pb-40 bg-gray-50 dark:bg-dark-bg transition-colors native-scroll"
      style={{ paddingBottom: "max(10rem, calc(10rem + env(safe-area-inset-bottom)))" }}
    >
      {activeView === "reposicion" ? <ReposicionList /> : <VencimientoList />}
    </main>
  );
}
