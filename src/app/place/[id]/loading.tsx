export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Skeleton */}
      <div className="relative h-80 animate-pulse bg-surface-solid/50">
        <div className="absolute left-6 top-6 h-10 w-10 rounded-xl bg-white/10" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mb-2 h-8 w-3/4 rounded bg-white/10" />
          <div className="mb-3 h-4 w-1/2 rounded bg-white/10" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-xl bg-white/10" />
            <div className="h-6 w-24 rounded-xl bg-white/10" />
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="glass grid grid-cols-3 gap-4 border-b border-white/10 px-6 py-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="mx-auto mb-2 h-8 w-16 animate-pulse rounded bg-surface-solid/50" />
            <div className="mx-auto h-4 w-20 animate-pulse rounded bg-surface-solid/50" />
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="glass space-y-6 px-6 py-6">
        <div className="h-6 w-32 animate-pulse rounded bg-surface-solid/50" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-surface-solid/50" />
        <div className="h-6 w-24 animate-pulse rounded bg-surface-solid/50" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded bg-surface-solid/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
