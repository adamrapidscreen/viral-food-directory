'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { TrendingDish, ApiResponse } from '@/types';
import HalalBadge from './HalalBadge';

interface TrendingDishesState {
  dishes: TrendingDish[];
  loading: boolean;
  error: string | null;
}

export default function TrendingDishes() {
  const router = useRouter();
  const [state, setState] = useState<TrendingDishesState>({
    dishes: [],
    loading: true,
    error: null,
  });

  const fetchTrendingDishes = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Fetch top trending restaurants (no location filter = nationwide)
      const res = await fetch('/api/restaurants?trending=true&limit=10');
      const { data } = await res.json();
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response from API');
      }

      // Transform restaurants into "trending dishes" format
      const dishes = data.slice(0, 10).map((r: any) => ({
        id: r.id,
        dishName: r.mustTryDish || 'House Special',
        description: `Popular dish at ${r.name}`,
        price: r.priceRange === '$' ? 9 : r.priceRange === '$$' ? 15 : 25,
        restaurantId: r.id,
        restaurantName: r.name,
        restaurantIsHalal: r.isHalal || false,
        mentionCount: Math.floor((r.trendingScore || 50) * 3) || 50,
        recommendPercentage: Math.floor(75 + ((r.aggregateRating || r.googleRating || 4) * 5)),
        viralScore: r.trendingScore || 50,
        photoUrl: r.photos?.[0] || '',
      }));

      setState({
        dishes: dishes || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching trending:', err);
      setState({
        dishes: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load trending dishes',
      });
    }
  };

  useEffect(() => {
    fetchTrendingDishes();
  }, []);

  const handleCardClick = (restaurantId: string) => {
    router.push(`/place/${restaurantId}`);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    restaurantId: string
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(restaurantId);
    }
  };

  // Loading skeleton
  if (state.loading) {
    return (
      <section className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-100">
            🔥 Trending Now
          </h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">
            Updated hourly
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass animate-pulse overflow-hidden rounded-2xl"
            >
              <div className="h-40 w-full bg-surface-solid/50" />
              <div className="p-4">
                <div className="mb-2 h-5 w-3/4 rounded bg-surface-solid/50" />
                <div className="mb-3 h-4 w-1/2 rounded bg-surface-solid/50" />
                <div className="flex justify-between">
                  <div className="h-4 w-20 rounded bg-surface-solid/50" />
                  <div className="h-4 w-24 rounded bg-surface-solid/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (state.error) {
    return (
      <section className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-100">
            🔥 Trending Now
          </h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">
            Updated hourly
          </p>
        </div>
        <div className="glass rounded-2xl p-6 text-center border border-red-500/20 bg-red-500/10">
          <p className="mb-4 text-red-400">{state.error}</p>
          <button
            onClick={fetchTrendingDishes}
            className="rounded-xl bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  // Empty state
  if (state.dishes.length === 0) {
    return (
      <section className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-100">
            🔥 Trending Now
          </h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">
            Updated hourly
          </p>
        </div>
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-slate-400">
            No trending dishes right now. Check back soon! 🍜
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          🔥 Trending Now
        </h2>
        <p className="mt-1 text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Updated hourly
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {state.dishes.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            onClick={() => handleCardClick(dish.restaurantId)}
            onKeyDown={(e) => handleKeyDown(e, dish.restaurantId)}
          />
        ))}
      </div>
    </section>
  );
}

// Separate component for dish card to handle image state
function DishCard({
  dish,
  onClick,
  onKeyDown,
}: {
  dish: TrendingDish;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking heart
    setIsLiked(!isLiked);
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${dish.dishName} at ${dish.restaurantName || 'restaurant'}`}
      className="glass group cursor-pointer overflow-hidden rounded-2xl transition-all hover:shadow-lg"
    >
      {/* Image Container with 4:3 Aspect Ratio */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-solid/50">
        {dish.photoUrl && !imageError ? (
          <Image
            src={dish.photoUrl}
            alt={dish.dishName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            🍽️
          </div>
        )}

        {/* Gradient Overlay - transparent to black/80 at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Heart Icon Button - Top Right */}
        <button
          onClick={handleHeartClick}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white transition-all hover:bg-black/60 hover:scale-110"
          aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`h-5 w-5 transition-all ${
              isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'
            }`}
          />
        </button>

        {/* Title and Price - Inside Image at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
          <div className="flex items-end justify-between gap-3">
            {/* Title */}
            <h3 className="flex-1 text-xl font-bold text-white drop-shadow-lg line-clamp-2">
              {dish.dishName}
            </h3>
            {/* Price */}
            {dish.price > 0 && (
              <span className="shrink-0 rounded-xl bg-white/90 backdrop-blur-sm px-3 py-1.5 text-sm font-bold text-slate-900">
                RM {dish.price.toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Minimal Footer - Secondary Info */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-white/10">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <span>🚀</span>
          <span>{dish.mentionCount} mentions</span>
        </span>
        <span className="text-xs font-semibold text-emerald-400">
          {dish.recommendPercentage}% recommend
        </span>
      </div>
    </div>
  );
}

