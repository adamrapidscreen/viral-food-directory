export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Hero Skeleton */}
      <div className="relative h-80 animate-pulse bg-gray-200 dark:bg-slate-700">
        <div className="absolute left-6 top-6 h-10 w-10 rounded-full bg-white/50" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mb-2 h-8 w-3/4 rounded bg-white/50" />
          <div className="mb-3 h-4 w-1/2 rounded bg-white/50" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-white/50" />
            <div className="h-6 w-24 rounded-full bg-white/50" />
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-3 gap-4 border-b border-gray-200 bg-white px-6 py-6 dark:border-slate-700 dark:bg-slate-800">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="mx-auto mb-2 h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
            <div className="mx-auto h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6 bg-white px-6 py-6 dark:bg-slate-800">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        <div className="h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    </div>
  );
}
