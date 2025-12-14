'use client';

export default function RestaurantCardSkeleton() {
  return (
    <div className="glass flex cursor-pointer gap-4 rounded-2xl p-5">
      {/* Left: Image Skeleton */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
        <div className="h-full w-full animate-shimmer bg-gradient-to-r from-surface-solid/50 via-slate-600/30 to-surface-solid/50 bg-[length:200%_100%]" />
      </div>

      {/* Right: Content Skeleton */}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-5 w-16 animate-shimmer rounded-xl bg-gradient-to-r from-surface-solid/50 via-slate-600/30 to-surface-solid/50 bg-[length:200%_100%]" />
          <div className="h-5 w-12 animate-shimmer rounded-xl bg-gradient-to-r from-surface-solid/50 via-slate-600/30 to-surface-solid/50 bg-[length:200%_100%]" />
        </div>

        {/* Name */}
        <div className="h-5 w-3/4 animate-shimmer rounded bg-gradient-to-r from-surface-solid/50 via-slate-600/30 to-surface-solid/50 bg-[length:200%_100%]" />

        {/* Category + Distance */}
        <div className="h-4 w-1/2 animate-shimmer rounded bg-gradient-to-r from-surface-solid/50 via-slate-600/30 to-surface-solid/50 bg-[length:200%_100%]" />

        {/* Rating row */}
        <div className="h-4 w-24 animate-shimmer rounded bg-gradient-to-r from-surface-solid/50 via-slate-600/30 to-surface-solid/50 bg-[length:200%_100%]" />
      </div>
    </div>
  );
}
