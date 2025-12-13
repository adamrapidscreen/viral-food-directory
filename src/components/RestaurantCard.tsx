'use client';

import { Restaurant } from '@/types';
import HalalBadge from './HalalBadge';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick?: () => void;
}

export default function RestaurantCard({ restaurant, onClick }: RestaurantCardProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:shadow-md dark:bg-gray-800"
    >
      {/* Top section with badges */}
      <div className="mb-1 flex gap-1 text-xs">
        {/* Halal Badge - displayed before category */}
        <HalalBadge
          isHalal={restaurant.isHalal}
          certNumber={restaurant.halalCertNumber}
        />

        {/* Category Badge */}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          {restaurant.cuisine}
        </span>
      </div>

      {/* Restaurant Name */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {restaurant.name}
      </h3>

      {/* Address */}
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
        {restaurant.address}
      </p>

      {/* Rating and Review Count */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
          ⭐ {restaurant.rating}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({restaurant.reviewCount} reviews)
        </span>
      </div>

      {/* Optional: Image placeholder */}
      {restaurant.imageUrl && (
        <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl">
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

