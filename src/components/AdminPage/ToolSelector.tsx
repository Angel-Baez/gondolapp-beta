import Link from "next/link";
import { 
  Cloud, 
  FileSpreadsheet, 
  Zap, 
  ScanBarcode, 
  Database, 
  ChevronRight,
  Settings,
  MessageSquare
} from "lucide-react";

type ActiveTool = "import" | "preset" | "sync" | "addProducts" | null;

interface ToolSelectorProps {
  onSelectTool: (tool: ActiveTool) => void;
  onOpenPreset: () => void;
}

export function ToolSelector({ onSelectTool, onOpenPreset }: ToolSelectorProps) {
  // Herramientas que ejecutan acciones en la misma página
  const tools = [
    {
      id: "sync",
      title: "Sincronización Cloud",
      desc: "Estado del backup y nube",
      icon: Cloud,
      color: "cyan",
      action: () => onSelectTool("sync"),
    },
    {
      id: "import",
      title: "Importar Excel",
      desc: "Carga masiva de datos",
      icon: FileSpreadsheet,
      color: "green",
      action: () => onSelectTool("import"),
    },
    {
      id: "preset",
      title: "Presets Rápidos",
      desc: "Plantillas de productos",
      icon: Zap,
      color: "purple",
      action: onOpenPreset,
    },
    {
      id: "addProducts",
      title: "Scanner de Ingreso",
      desc: "Añadir stock manualmente",
      icon: ScanBarcode,
      color: "orange",
      action: () => onSelectTool("addProducts"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        {/* SECCIÓN 1: Herramientas Operativas */}
        {tools.map((tool) => {
          const Icon = tool.icon;
          const colorClasses = {
            cyan: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/60",
            green: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 group-hover:bg-green-200 dark:group-hover:bg-green-900/60",
            purple: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/60",
            orange: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60",
          }[tool.color] || "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";

          return (
            <button
              key={tool.id}
              onClick={tool.action}
              className="group flex items-center gap-4 p-4 bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-dark-border hover:shadow-md hover:border-gray-200 dark:hover:border-dark-card transition-all text-left active:scale-[0.99]"
            >
              <div className={`p-3 rounded-lg transition-colors ${colorClasses}`}>
                <Icon size={24} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {tool.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {tool.desc}
                </p>
              </div>
              <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" size={20} />
            </button>
          );
        })}

        {/* SECCIÓN 2: Panel de Feedback Beta-Testers */}
        <Link href="/admin/feedback" className="block mt-2">
          <div className="group flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 dark:from-amber-900/30 to-white dark:to-dark-surface rounded-xl shadow-sm border border-amber-100 dark:border-amber-800/50 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all active:scale-[0.99] cursor-pointer">
            
            {/* Ícono de Feedback destacado */}
            <div className="p-3 bg-amber-500 text-white rounded-lg shadow-sm group-hover:bg-amber-600 transition-colors">
              <MessageSquare size={24} strokeWidth={2} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-900 dark:text-amber-100 leading-tight">
                  Panel de Feedback
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                  BETA
                </span>
              </div>
              <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-0.5 truncate font-medium">
                Gestión de reportes de beta-testers
              </p>
            </div>

            <div className="p-2 bg-white dark:bg-dark-card rounded-full text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors shadow-sm">
              <ChevronRight size={18} />
            </div>
          </div>
        </Link>

        {/* SECCIÓN 3: MongoDB Compass Admin (Diferenciado) */}
        <Link href="/admin/mongo" className="block mt-2">
          <div className="group flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 dark:from-indigo-900/30 to-white dark:to-dark-surface rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-800/50 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all active:scale-[0.99] cursor-pointer">
            
            {/* Ícono de Base de Datos destacado */}
            <div className="p-3 bg-indigo-600 text-white rounded-lg shadow-sm group-hover:bg-indigo-700 transition-colors">
              <Database size={24} strokeWidth={2} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-100 leading-tight">
                  MongoDB Compass Admin
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
                  CRUD
                </span>
              </div>
              <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80 mt-0.5 truncate font-medium">
                Gestión avanzada, edición y fusión de datos
              </p>
            </div>

            <div className="p-2 bg-white dark:bg-dark-card rounded-full text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors shadow-sm">
              <Settings size={18} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}