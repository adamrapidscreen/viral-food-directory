'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Restaurant } from '@/types';
import HalalBadge from './HalalBadge';
import { formatReviewCount } from '@/lib/utils';
import { useLazyImage } from '@/hooks/useLazyImage';
import { getTripAdvisorData } from '@/services/tripAdvisor';
import { usePlaceHours } from '@/hooks/usePlaceHours';
import { generateDishName, toTitleCase } from '@/utils/dishName';

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

  // Fetch hours from cache (with fallback to smart defaults)
  const { status: hoursStatus, loading: hoursLoading } = usePlaceHours(
    restaurant.id,
    restaurant.name,
    restaurant.tripAdvisorTags // Use TripAdvisor tags as types if available
  );

  // Get TripAdvisor data from cache (0 credits, instant lookup)
  const tripAdvisorData = getTripAdvisorData(restaurant.name);

  // Generate smart dish name
  const dishName = generateDishName(restaurant.name);

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

  // Use TripAdvisor data from cache if available, otherwise fall back to restaurant data
  const displayRank = tripAdvisorData?.rank || restaurant.tripAdvisorRank;
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
      className={`glass flex cursor-pointer gap-4 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg ${
        isSelected 
          ? 'ring-2 ring-emerald-500' 
          : isHovered 
          ? 'ring-2 ring-emerald-400/50 bg-emerald-500/5' 
          : ''
      }`}
    >
      {/* Left: Image - Lazy loaded with Intersection Observer */}
      <div 
        ref={imgRef}
        className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-surface-solid/50"
      >
        {shouldLoad && thumbnailUrl && !imageError ? (
          <>
            <Image
              src={thumbnailUrl}
              alt={restaurant.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              onError={() => setImageError(true)}
            />
            {/* Must Try Badge Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-amber-400 text-xs">⭐</span>
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">Must Try</span>
              </div>
              <p className="text-white font-bold text-xs leading-tight line-clamp-1">{dishName}</p>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            {categoryEmojiIcon}
          </div>
        )}
      </div>

      {/* Right: Content */}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category pill */}
          <span className="rounded-xl bg-surface-solid/50 px-2.5 py-1 font-medium text-slate-300">
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
            <span className="inline-flex items-center rounded-xl bg-rose-500/20 px-2.5 py-1 font-semibold text-rose-400 border border-rose-500/30">
              🔥 Trending
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="line-clamp-1 text-base font-semibold text-slate-100">
          {restaurant.name}
        </h3>

        {/* Category emoji + Distance */}
        {distanceText && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>{categoryEmojiIcon}</span>
            <span>{categoryName}</span>
            <span>•</span>
            <span>{distanceText}</span>
          </div>
        )}

        {/* Rating row */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-100">
            ⭐ {restaurant.aggregateRating != null ? restaurant.aggregateRating.toFixed(1) : 'N/A'}
          </span>
          {reviewCount > 0 && (
            <span className="text-xs text-slate-400">
              ({reviewCountText} reviews)
            </span>
          )}
          
          {/* TripAdvisor Rank Badge */}
          {displayRank && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30"
            >
              <Trophy className="h-3 w-3" />
              <span className="line-clamp-1">{displayRank}</span>
            </motion.span>
          )}
        </div>

        {/* Price Display */}
        {displayPriceText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-xs font-medium text-emerald-400"
          >
            {displayPriceText}
          </motion.div>
        )}

        {/* Hours Display */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">🕐</span>
          {hoursLoading ? (
            <span className="text-slate-500 animate-pulse">...</span>
          ) : (
            <span className={hoursStatus.startsWith('Open') ? 'text-emerald-400' : 'text-orange-400'}>
              {hoursStatus}
            </span>
          )}
        </div>

        {/* Must-try section */}
        {hasMustTry && (
          <div className="mt-3 rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/20">
            <div className="mb-1 text-xs font-bold text-emerald-400">
              Must Try
            </div>
            <div className="text-sm font-medium text-slate-100">
              {restaurant.mustTryDish}
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              {restaurant.mustTryConfidence}% recommend
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
