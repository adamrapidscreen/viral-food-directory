'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      const response = await fetch('/api/trending-dishes');
      const data: ApiResponse<TrendingDish[]> = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setState({
        dishes: data.data || [],
        loading: false,
        error: null,
      });
    } catch (err) {
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🔥 Trending Now
          </h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Updated hourly
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800"
            >
              <div className="h-40 w-full bg-gray-200 dark:bg-slate-700" />
              <div className="p-4">
                <div className="mb-2 h-5 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="mb-3 h-4 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="flex justify-between">
                  <div className="h-4 w-20 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-700" />
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🔥 Trending Now
          </h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Updated hourly
          </p>
        </div>
        <div className="rounded-2xl bg-red-50 p-6 text-center dark:bg-red-900/20">
          <p className="mb-4 text-red-700 dark:text-red-300">{state.error}</p>
          <button
            onClick={fetchTrendingDishes}
            className="rounded-xl bg-teal-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🔥 Trending Now
          </h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Updated hourly
          </p>
        </div>
        <div className="rounded-2xl bg-gray-50 p-8 text-center dark:bg-slate-800">
          <p className="text-gray-600 dark:text-gray-400">
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

  return (
    <div
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${dish.dishName} at ${dish.restaurantName || 'restaurant'}`}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800"
    >
      {/* Image */}
      <div className="relative h-40 w-full overflow-hidden bg-gray-100 dark:bg-slate-700">
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
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Dish name + Price */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="flex-1 text-lg font-semibold text-gray-900 dark:text-white">
            {dish.dishName}
          </h3>
          {dish.price > 0 && (
            <span className="shrink-0 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
              RM {dish.price.toFixed(0)}
            </span>
          )}
        </div>

        {/* Description */}
        {dish.description && (
          <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {dish.description}
          </p>
        )}

        {/* Restaurant row */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {dish.restaurantName || 'Restaurant'}
          </span>
          {dish.restaurantIsHalal && (
            <HalalBadge isHalal={true} size="sm" />
          )}
        </div>

        {/* Stats */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-1 text-xs font-semibold text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
            🚀 {dish.mentionCount} mentions
          </span>
          <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
            {dish.recommendPercentage}% recommend
          </span>
        </div>
      </div>
    </div>
  );
}

