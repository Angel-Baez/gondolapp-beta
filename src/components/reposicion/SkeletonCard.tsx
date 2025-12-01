export function SkeletonCard() {
  return (
    <div className="p-4 sm:p-5 bg-gray-100 dark:bg-dark-surface rounded-xl animate-pulse flex gap-3 items-center transition-colors">
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-300 dark:bg-dark-card rounded-lg" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 sm:h-5 bg-gray-300 dark:bg-dark-card rounded w-2/3" />
        <div className="h-3 sm:h-4 bg-gray-200 dark:bg-dark-border rounded w-1/2" />
        <div className="flex gap-2 mt-2">
          <div className="h-3 w-12 bg-gray-200 dark:bg-dark-border rounded" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-dark-border rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="w-10 h-10 bg-gray-300 dark:bg-dark-card rounded" />
        <div className="w-10 h-10 bg-gray-300 dark:bg-dark-card rounded" />
      </div>
    </div>
  );
}
