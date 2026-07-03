export function SkeletonCard() {
  return (
    <div className="p-4 island animate-pulse flex gap-3 items-center">
      <div className="w-14 h-14 bg-surface-2 rounded-field" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-surface-2 rounded w-2/3" />
        <div className="h-3 bg-surface-2 rounded w-1/2" />
        <div className="flex gap-2 mt-2">
          <div className="h-3 w-12 bg-surface-2 rounded" />
          <div className="h-3 w-16 bg-surface-2 rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="w-10 h-10 bg-surface-2 rounded" />
        <div className="w-10 h-10 bg-surface-2 rounded" />
      </div>
    </div>
  );
}
