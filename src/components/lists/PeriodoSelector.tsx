"use client";

type Periodo = "semana" | "mes" | "año";

const OPCIONES: Array<{ value: Periodo; label: string }> = [
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
  { value: "año", label: "Año" },
];

export function PeriodoSelector({
  periodo,
  onChange,
}: {
  periodo: Periodo;
  onChange: (periodo: Periodo) => void;
}) {
  return (
    <div className="inline-flex bg-gray-100 dark:bg-dark-card rounded-lg p-1">
      {OPCIONES.map((opcion) => (
        <button
          key={opcion.value}
          onClick={() => onChange(opcion.value)}
          className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
            periodo === opcion.value
              ? "bg-white dark:bg-dark-surface text-cyan-600 dark:text-cyan-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          {opcion.label}
        </button>
      ))}
    </div>
  );
}
