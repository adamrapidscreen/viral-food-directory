'use client';

import { Restaurant } from '@/types';
import HalalBadge from './HalalBadge';

interface PlaceDetailProps {
  restaurant: Restaurant;
  isTrending?: boolean;
}

export default function PlaceDetail({ restaurant, isTrending = false }: PlaceDetailProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
      {/* Header with badges */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Category Badge */}
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          {restaurant.cuisine}
        </span>

        {/* Halal Badge */}
        <HalalBadge
          isHalal={restaurant.isHalal}
          certNumber={restaurant.halalCertNumber}
          className="px-3 py-1 text-sm"
        />

        {/* Trending Badge */}
        {isTrending && (
          <span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-semibold text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
            🔥 Trending
          </span>
        )}

        {/* Non-Halal Badge (optional - skipped as per requirements) */}
        {/* {!restaurant.isHalal && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
            Non-Halal
          </span>
        )} */}
      </div>

      {/* Restaurant Name */}
      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {restaurant.name}
      </h1>

      {/* Address */}
      <p className="mb-4 text-gray-600 dark:text-gray-400">{restaurant.address}</p>

      {/* Rating and Review Count */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-lg font-semibold text-teal-600 dark:text-teal-400">
            ⭐ {restaurant.rating}
          </span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          ({restaurant.reviewCount} reviews)
        </span>
      </div>

      {/* Additional details can be added here */}
    </div>
  );
}

