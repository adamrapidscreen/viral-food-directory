'use client';

import { useState } from 'react';
import Image from 'next/image';
import { InfoWindow } from '@vis.gl/react-google-maps';
import { Restaurant } from '@/types';
import HalalBadge from './HalalBadge';
import { useLazyImage } from '@/hooks/useLazyImage';

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
  if (!restaurant) {
    return null;
  }

  const isTrending = restaurant.trendingScore > 75;
  const thumbnailUrl = restaurant.photos?.[0];
  
  // Use Intersection Observer to lazy load images
  // For info windows, load immediately when visible (threshold 0)
  const { imgRef, shouldLoad, imageError, setImageError } = useLazyImage(thumbnailUrl, {
    rootMargin: '0px',
    threshold: 0, // Load as soon as any part is visible
  });

  const distanceText = restaurant.distance
    ? `${restaurant.distance.toFixed(1)} km`
    : '';

  return (
    <InfoWindow
      position={{ lat: restaurant.lat, lng: restaurant.lng }}
      onCloseClick={onClose}
      pixelOffset={[0, -50]}
    >
      <div className="glass relative max-w-xs rounded-2xl p-4 shadow-xl">
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
          {/* Thumbnail - Lazy loaded with Intersection Observer */}
          <div 
            ref={imgRef}
            className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-surface-solid/50"
          >
            {shouldLoad && thumbnailUrl && !imageError ? (
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
            <h3 className="line-clamp-1 font-semibold text-slate-100">
              {restaurant.name}
            </h3>

            {/* Category + Distance */}
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
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
                <span className="text-sm font-semibold text-slate-100">
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
                <span className="inline-flex items-center rounded-xl bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/30">
                  🔥 Trending
                </span>
              )}
            </div>

            {/* View Details Button */}
            <button
              onClick={() => onViewDetails(restaurant.id)}
              className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </InfoWindow>
  );
}
