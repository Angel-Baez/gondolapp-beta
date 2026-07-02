export function StatTile({
  label,
  value,
  colorClass = "text-gray-900 dark:text-gray-100",
}: {
  label: string;
  value: string | number;
  colorClass?: string;
}) {
  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-dark-border">
      <div className={`text-xl sm:text-2xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}
