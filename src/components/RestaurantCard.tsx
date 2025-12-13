'use client';

import { useState } from 'react';
import { Restaurant } from '@/types';
import HalalBadge from './HalalBadge';
import { formatReviewCount } from '@/lib/utils';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isSelected: boolean;
  onClick: () => void;
}

// Category emoji mapping
const categoryEmoji: Record<Restaurant['category'], string> = {
  hawker: '🍜',
  restaurant: '🍽️',
  cafe: '☕',
  foodcourt: '🏪',
};

// Category label mapping
const categoryLabel: Record<Restaurant['category'], string> = {
  hawker: 'Hawker',
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  foodcourt: 'Foodcourt',
};

export default function RestaurantCard({
  restaurant,
  isSelected,
  onClick,
}: RestaurantCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const thumbnailUrl = restaurant.photos?.[0];
  const isTrending = restaurant.trendingScore > 75;
  const hasMustTry = restaurant.mustTryDish && restaurant.mustTryConfidence > 50;
  const distanceText = restaurant.distance
    ? `${restaurant.distance.toFixed(1)} km`
    : null;
  const categoryEmojiIcon = categoryEmoji[restaurant.category];
  const categoryName = categoryLabel[restaurant.category];

  // Calculate review count (using viralMentions as proxy if needed, or use a default)
  // Note: We don't have reviewCount in Restaurant interface, so we'll use viralMentions
  // This might need adjustment based on actual data structure
  const reviewCount = restaurant.viralMentions || 0;
  const reviewCountText = reviewCount > 0 ? formatReviewCount(reviewCount) : '0';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${restaurant.name}`}
      className={`flex cursor-pointer gap-4 rounded-2xl bg-white p-5 transition-shadow duration-300 hover:shadow-md dark:bg-slate-800 ${
        isSelected ? 'ring-2 ring-teal-600' : ''
      }`}
    >
      {/* Left: Image */}
      <div className="relative h-20 w-20 flex-shrink-0">
        {imageLoading && (
          <div className="absolute inset-0 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        )}
        {thumbnailUrl && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={restaurant.name}
            className="h-20 w-20 rounded-xl object-cover"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-100 text-3xl dark:bg-slate-700">
            {categoryEmojiIcon}
          </div>
        )}
      </div>

      {/* Right: Content */}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category pill */}
          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700 dark:bg-slate-700 dark:text-gray-300">
            {categoryName}
          </span>

          {/* Halal Badge */}
          <HalalBadge
            isHalal={restaurant.isHalal}
            certNumber={restaurant.halalCertNumber}
            size="sm"
          />

          {/* Trending Badge */}
          {isTrending && (
            <span className="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-1 font-semibold text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
              🔥 Trending
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="line-clamp-1 text-base font-semibold text-gray-900 dark:text-white">
          {restaurant.name}
        </h3>

        {/* Category emoji + Distance */}
        {distanceText && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span>{categoryEmojiIcon}</span>
            <span>{categoryName}</span>
            <span>•</span>
            <span>{distanceText}</span>
          </div>
        )}

        {/* Rating row */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-900 dark:text-white">
            ⭐ {restaurant.aggregateRating.toFixed(1)}
          </span>
          {reviewCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({reviewCountText} reviews)
            </span>
          )}
        </div>

        {/* Must-try section */}
        {hasMustTry && (
          <div className="mt-3 rounded-xl bg-teal-50 p-3 dark:bg-teal-900/20">
            <div className="mb-1 text-xs font-bold text-teal-700 dark:text-teal-300">
              Must Try
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {restaurant.mustTryDish}
            </div>
            <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
              {restaurant.mustTryConfidence}% recommend
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
