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
    <div className="inline-flex bg-surface-2 rounded-full p-1">
      {OPCIONES.map((opcion) => (
        <button
          key={opcion.value}
          onClick={() => onChange(opcion.value)}
          className={`tap-compact px-3 text-subhead font-semibold rounded-full transition-colors ${
            periodo === opcion.value
              ? "bg-surface text-accent shadow-island"
              : "text-fg-secondary"
          }`}
        >
          {opcion.label}
        </button>
      ))}
    </div>
  );
}
