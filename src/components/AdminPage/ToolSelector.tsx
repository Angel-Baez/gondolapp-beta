import Link from "next/link";
import { 
  Cloud, 
  FileSpreadsheet, 
  Zap, 
  ScanBarcode, 
  Database, 
  ChevronRight,
  Settings 
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
            cyan: "bg-cyan-100 text-cyan-700 group-hover:bg-cyan-200",
            green: "bg-green-100 text-green-700 group-hover:bg-green-200",
            purple: "bg-purple-100 text-purple-700 group-hover:bg-purple-200",
            orange: "bg-orange-100 text-orange-700 group-hover:bg-orange-200",
          }[tool.color] || "bg-gray-100 text-gray-700";

          return (
            <button
              key={tool.id}
              onClick={tool.action}
              className="group flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all text-left active:scale-[0.99]"
            >
              <div className={`p-3 rounded-lg transition-colors ${colorClasses}`}>
                <Icon size={24} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 leading-tight">
                  {tool.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5 truncate">
                  {tool.desc}
                </p>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-gray-500 transition-colors" size={20} />
            </button>
          );
        })}

        {/* SECCIÓN 2: MongoDB Compass Admin (Diferenciado) */}
        <Link href="/admin/mongo" className="block mt-2">
          <div className="group flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-100 hover:shadow-md hover:border-indigo-300 transition-all active:scale-[0.99] cursor-pointer">
            
            {/* Ícono de Base de Datos destacado */}
            <div className="p-3 bg-indigo-600 text-white rounded-lg shadow-sm group-hover:bg-indigo-700 transition-colors">
              <Database size={24} strokeWidth={2} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-indigo-900 leading-tight">
                  MongoDB Compass Admin
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-200 text-indigo-800 border border-indigo-200">
                  CRUD
                </span>
              </div>
              <p className="text-sm text-indigo-600/80 mt-0.5 truncate font-medium">
                Gestión avanzada, edición y fusión de datos
              </p>
            </div>

            <div className="p-2 bg-white rounded-full text-indigo-400 group-hover:text-indigo-600 transition-colors shadow-sm">
              <Settings size={18} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}