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
 */
export function MainContent({ activeView }: MainContentProps) {
  return (
    <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
      {activeView === "reposicion" ? <ReposicionList /> : <VencimientoList />}
    </main>
  );
}
