'use client';

import { Restaurant } from '@/types';
import HalalBadge from './HalalBadge';

interface TrendingDish {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  restaurant: Restaurant;
  viewCount?: number;
  likeCount?: number;
}

interface TrendingDishesProps {
  dishes: TrendingDish[];
}

export default function TrendingDishes({ dishes }: TrendingDishesProps) {
  if (dishes.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
        🔥 Trending Dishes
      </h2>
      <div className="space-y-4">
        {dishes.map((dish) => (
          <div
            key={dish.id}
            className="rounded-xl border border-gray-200 p-4 transition-shadow duration-300 ease-out hover:shadow-md dark:border-gray-700"
          >
            {/* Dish Name */}
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {dish.name}
            </h3>

            {/* Restaurant Name Row with Halal Status */}
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {dish.restaurant.name}
              </span>
              <HalalBadge
                isHalal={dish.restaurant.isHalal}
                certNumber={dish.restaurant.halalCertNumber}
              />
            </div>

            {/* Description */}
            {dish.description && (
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                {dish.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              {dish.viewCount !== undefined && (
                <span>👁️ {dish.viewCount.toLocaleString()} views</span>
              )}
              {dish.likeCount !== undefined && (
                <span>❤️ {dish.likeCount.toLocaleString()} likes</span>
              )}
              <span className="text-teal-600 dark:text-teal-400">
                ⭐ {dish.restaurant.rating}
              </span>
            </div>

            {/* Dish Image */}
            {dish.imageUrl && (
              <div className="mt-3 aspect-video w-full overflow-hidden rounded-lg">
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

