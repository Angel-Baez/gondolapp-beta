export function StatTile({
  label,
  value,
  colorClass = "text-fg",
}: {
  label: string;
  value: string | number;
  colorClass?: string;
}) {
  return (
    <div className="island p-3.5">
      <div className={`text-title2 ${colorClass}`}>{value}</div>
      <div className="text-footnote text-fg-secondary mt-1">{label}</div>
    </div>
  );
}
