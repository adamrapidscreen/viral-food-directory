'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Restaurant } from '@/types';
import { formatReviewCount } from '@/lib/utils';
import { useLazyImage } from '@/hooks/useLazyImage';
import { getTripAdvisorData } from '@/services/tripAdvisor';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isSelected: boolean;
  isHovered?: boolean;
  onClick: () => void;
  index?: number;
}

// Category emoji mapping
const categoryEmoji: Record<Restaurant['category'], string> = {
  hawker: '🍜',
  restaurant: '🍽️',
  cafe: '☕',
  foodcourt: '🏪',
};

export default function RestaurantCard({
  restaurant,
  isSelected,
  isHovered,
  onClick,
  index = 0,
}: RestaurantCardProps) {
  const thumbnailUrl = restaurant.photos?.[0];
  
  // Use Intersection Observer to lazy load images
  const { imgRef, shouldLoad, imageError, setImageError } = useLazyImage(thumbnailUrl, {
    rootMargin: '100px', // Start loading 100px before card is visible
    threshold: 0.1,
  });

  // Get TripAdvisor data from cache (0 credits, instant lookup)
  const tripAdvisorData = getTripAdvisorData(restaurant.name);
  const distanceText = restaurant.distance
    ? `${restaurant.distance.toFixed(1)} km`
    : null;
  const categoryEmojiIcon = categoryEmoji[restaurant.category];

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

  // Use TripAdvisor data from cache if available, otherwise fall back to restaurant data
  const displayPriceText = tripAdvisorData?.priceText || restaurant.tripAdvisorPriceText;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1],
      }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${restaurant.name}`}
      className={`flex flex-row items-center gap-3 rounded-2xl bg-white dark:bg-slate-900 p-3 shadow-sm cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-slate-800 ${
        isSelected 
          ? 'ring-2 ring-emerald-500' 
          : isHovered 
          ? 'ring-2 ring-emerald-400/50' 
          : ''
      }`}
    >
      {/* Left: Image */}
      <div 
        ref={imgRef}
        className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-800"
      >
        {shouldLoad && thumbnailUrl && !imageError ? (
          <Image
            src={thumbnailUrl}
            alt={restaurant.name}
            fill
            sizes="128px"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            {categoryEmojiIcon}
          </div>
        )}
      </div>

      {/* Right: Content */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        {/* Title - Bold on top */}
        <h3 className="line-clamp-2 text-base font-bold text-gray-900 dark:text-slate-100">
          {restaurant.name}
        </h3>

        {/* Price Pill - Below title */}
        {displayPriceText && (
          <div className="inline-flex w-fit items-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {displayPriceText}
          </div>
        )}

        {/* Footer: Mentions/Match Stats - Muted grey */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
          {/* Mentions */}
          {reviewCount > 0 && (
            <span>
              {reviewCountText} mentions
            </span>
          )}
          
          {/* Match indicator (rating) */}
          {restaurant.aggregateRating != null && (
            <>
              {reviewCount > 0 && <span>•</span>}
              <span className="flex items-center gap-1">
                <span>⭐</span>
                <span>{restaurant.aggregateRating.toFixed(1)}</span>
              </span>
            </>
          )}

          {/* Distance */}
          {distanceText && (
            <>
              {(reviewCount > 0 || restaurant.aggregateRating != null) && <span>•</span>}
              <span>{distanceText}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
