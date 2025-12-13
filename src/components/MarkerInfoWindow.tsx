'use client';

import { useState } from 'react';
import Image from 'next/image';
import { InfoWindow } from '@vis.gl/react-google-maps';
import { Restaurant } from '@/types';
import HalalBadge from './HalalBadge';

interface MarkerInfoWindowProps {
  restaurant: Restaurant | null;
  onClose: () => void;
  onViewDetails: (id: string) => void;
}

export default function MarkerInfoWindow({
  restaurant,
  onClose,
  onViewDetails,
}: MarkerInfoWindowProps) {
  const [imageError, setImageError] = useState(false);

  if (!restaurant) {
    return null;
  }

  const isTrending = restaurant.trendingScore > 75;
  const thumbnailUrl = restaurant.photos?.[0];
  const distanceText = restaurant.distance
    ? `${restaurant.distance.toFixed(1)} km`
    : '';

  return (
    <InfoWindow
      position={{ lat: restaurant.lat, lng: restaurant.lng }}
      onCloseClick={onClose}
      pixelOffset={[0, -50]}
    >
      <div className="relative max-w-xs rounded-xl bg-white p-4 shadow-xl dark:bg-slate-800">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex gap-3">
          {/* Thumbnail */}
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-700">
            {thumbnailUrl && !imageError ? (
              <Image
                src={thumbnailUrl}
                alt={restaurant.name}
                fill
                sizes="64px"
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">
                🍽️
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <h3 className="line-clamp-1 font-semibold text-gray-900 dark:text-white">
              {restaurant.name}
            </h3>

            {/* Category + Distance */}
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="capitalize">{restaurant.category}</span>
              {distanceText && (
                <>
                  <span>•</span>
                  <span>{distanceText}</span>
                </>
              )}
            </div>

            {/* Rating + Badges row */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ⭐ {restaurant.aggregateRating != null ? restaurant.aggregateRating.toFixed(1) : 'N/A'}
                </span>
              </div>

              {/* Halal Badge */}
              <HalalBadge
                isHalal={restaurant.isHalal}
                certNumber={restaurant.halalCertNumber}
                size="sm"
              />

              {/* Trending Badge */}
              {isTrending && (
                <span className="inline-flex items-center rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                  🔥 Trending
                </span>
              )}
            </div>

            {/* View Details Button */}
            <button
              onClick={() => onViewDetails(restaurant.id)}
              className="mt-3 w-full rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </InfoWindow>
  );
}
