'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Share2 } from 'lucide-react';
import { Restaurant, Review } from '@/types';
import HalalBadge from './HalalBadge';
import { useToast } from '@/contexts/ToastContext';
import { formatPrice, isOpenNow, formatDate, getCurrentDayHours, formatRelativeTime } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import { usePlaceHours } from '@/hooks/usePlaceHours';
import { generateDishName, toTitleCase, generateRecommendation, getRecommendPhrase } from '@/utils/dishName';
import { getSimpleOpenStatus } from '@/utils/formatHours';

interface PlaceDetailProps {
  restaurant: Restaurant;
  reviews: Review[];
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

// Day names for operating hours
const dayNames = [
  { key: 'sunday', label: 'Sunday' },
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
];

// Star rating component
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={`full-${i}`} className="text-yellow-400">⭐</span>
      ))}
      {hasHalfStar && <span className="text-yellow-400">⭐</span>}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span key={`empty-${i}`} className="text-gray-300 dark:text-gray-600">⭐</span>
      ))}
    </div>
  );
}

// Source badge component
function SourceBadge({ source }: { source: 'google' | 'tripadvisor' }) {
  const styles = {
    google: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    tripadvisor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  };

  return (
    <span
      className={`rounded-xl px-2 py-0.5 text-xs font-semibold ${styles[source]}`}
    >
      {source === 'google' ? 'Google' : 'TripAdvisor'}
    </span>
  );
}

export default function PlaceDetail({ restaurant, reviews }: PlaceDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const [imageError, setImageError] = useState(false);
  const heroImage = restaurant.photos?.[0];
  const isTrending = restaurant.trendingScore > 75;
  const displayedReviews = reviews.slice(0, 10); // Limit to 10 reviews
  const currentDay = dayNames[new Date().getDay()].key;
  
  // Fetch hours from cache (with fallback to smart defaults)
  const { hours, status: hoursStatus, loading: hoursLoading, isEstimated } = usePlaceHours(
    restaurant.id,
    restaurant.name,
    restaurant.tripAdvisorTags // Use TripAdvisor tags as types if available
  );
  
  // Generate smart dish name
  const dishName = generateDishName(restaurant.name);
  
  // Generate varied recommendation percentage
  const recommendPercent = generateRecommendation(restaurant.name);
  const recommendPhrase = getRecommendPhrase(recommendPercent);
  
  // Get simple open/closed status for header (replaces old isOpenNow)
  const { isOpen, text: openText } = getSimpleOpenStatus(hours);

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    // Get current URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const currentUrl = `${baseUrl}${pathname}`;

    const shareData = {
      title: restaurant.name,
      text: 'Check out this viral spot!',
      url: currentUrl,
    };

    // Try Web Share API first (mobile-friendly)
    if (typeof navigator !== 'undefined' && navigator.share) {
      // Check if canShare is available and if data is shareable
      const canShare =
        typeof navigator.canShare === 'function'
          ? navigator.canShare(shareData)
          : true;

      if (canShare) {
        try {
          await navigator.share(shareData);
          showToast('Shared successfully!', 'success');
          return;
        } catch (error) {
          // User cancelled share dialog - don't show error
          if ((error as Error).name === 'AbortError') {
            return;
          }
          // Other errors - fall through to clipboard
          console.error('Error sharing:', error);
        }
      }
    }

    // Fallback: Copy to clipboard
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
        showToast('Link copied to clipboard!', 'success');
      } else {
        // Fallback for older browsers - create temporary input element
        const textArea = document.createElement('textarea');
        textArea.value = currentUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Link copied to clipboard!', 'success');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showToast('Failed to share. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
        {heroImage && !imageError ? (
          <Image
            src={heroImage}
            alt={restaurant.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">
            {categoryEmoji[restaurant.category]}
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="glass absolute left-6 top-6 rounded-xl p-2 shadow-lg transition-all hover:bg-surface-solid"
          aria-label="Go back"
        >
          <svg
            className="h-5 w-5 text-slate-100"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="glass absolute right-6 top-6 rounded-xl p-2 shadow-lg transition-all hover:bg-surface-solid"
          aria-label="Share restaurant"
        >
          <Share2 className="h-5 w-5 text-slate-100" />
        </button>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl font-bold text-white font-serif tracking-tight">{restaurant.name}</h1>
          <p className="mt-1 text-sm text-white/80">{restaurant.address}</p>

          {/* Badges Row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-white/20 px-3 py-1 text-sm text-white backdrop-blur-sm border border-white/10">
              {categoryEmoji[restaurant.category]} {categoryLabel[restaurant.category]}
            </span>

            {restaurant.isHalal && (
              <span className="rounded-xl bg-white/20 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm border border-white/10">
                ✅ {restaurant.halalCertNumber ? 'Halal Certified' : 'Halal'}
              </span>
            )}

            {isTrending && (
              <span className="rounded-xl bg-rose-500/80 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm border border-rose-400/30">
                🔥 Trending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="glass grid grid-cols-1 gap-4 border-b border-white/10 py-6 px-6 sm:grid-cols-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">
            ⭐ {restaurant.aggregateRating != null ? restaurant.aggregateRating.toFixed(1) : 'N/A'}
          </div>
          <div className="mt-1 text-xs text-slate-400">Rating</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-slate-100">
            {restaurant.priceRange}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {formatPrice(restaurant.priceRange)}
          </div>
        </div>

        <div className="text-center">
          {isOpen ? (
            <>
              <div className="text-2xl font-bold text-emerald-400">Open</div>
              <div className="mt-1 text-xs text-slate-400">Now</div>
            </>
          ) : openText === 'Closed' ? (
            <>
              <div className="text-2xl font-bold text-red-400">Closed</div>
              <div className="mt-1 text-xs text-slate-400">Now</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-slate-500">—</div>
              <div className="mt-1 text-xs text-slate-400">Hours Not Listed</div>
            </>
          )}
        </div>
      </div>

      {/* Status Indicators */}
      <div className="glass flex flex-wrap items-center gap-3 border-b border-white/10 px-6 py-4">
        {restaurant.isHalal && (
          <HalalBadge
            isHalal={true}
            certNumber={restaurant.halalCertNumber}
            size="sm"
          />
        )}

        {restaurant.distance && (
          <span className="text-sm text-slate-400">
            📍 {restaurant.distance.toFixed(1)} km away
          </span>
        )}
      </div>

      {/* TripAdvisor Section */}
      {(restaurant.tripAdvisorRank || restaurant.tripAdvisorPriceText || restaurant.tripAdvisorTags?.length || restaurant.tripAdvisorTopReviewSnippet) && (
        <div className="glass border-b border-white/10 px-6 py-6">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-slate-100">
              TripAdvisor Insights
            </h2>
          </div>

          <div className="space-y-4">
            {/* Ranking */}
            {restaurant.tripAdvisorRank && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-400 border border-emerald-500/30">
                  <Trophy className="h-4 w-4" />
                  {restaurant.tripAdvisorRank}
                </span>
              </div>
            )}

            {/* Price */}
            {restaurant.tripAdvisorPriceText && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                  Price Range
                </div>
                <div className="text-base font-medium text-emerald-400">
                  {restaurant.tripAdvisorPriceText}
                </div>
              </div>
            )}

            {/* Tags */}
            {restaurant.tripAdvisorTags && restaurant.tripAdvisorTags.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Attributes
                </div>
                <div className="flex flex-wrap gap-2">
                  {restaurant.tripAdvisorTags.map((tag, index) => (
                    <span
                      key={index}
                      className="rounded-xl bg-surface-solid/50 px-2.5 py-1 text-xs font-medium text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Review Snippet */}
            {restaurant.tripAdvisorTopReviewSnippet && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Top Review
                </div>
                <p className="text-sm leading-relaxed text-slate-300 italic">
                  "{restaurant.tripAdvisorTopReviewSnippet}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Must-Try Section */}
      <div className="glass mx-6 my-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-amber-400">⭐</span>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Must Try</span>
        </div>
        <h3 className="text-white font-bold text-xl">{dishName}</h3>
        <p className="text-slate-400 text-sm mt-1">{recommendPhrase}</p>
      </div>

      {/* Operating Hours - Full Weekly Schedule */}
      <div className="glass border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">Hours</h3>
          {isEstimated && (
            <span className="text-xs text-slate-500 italic">Estimated</span>
          )}
        </div>
        
        {hoursLoading ? (
          <div className="animate-pulse space-y-2">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="h-4 bg-white/10 rounded w-48" />
            ))}
          </div>
        ) : hours?.weekdayText?.length ? (
          <div className="space-y-2">
            {hours.weekdayText.map((dayText: string, index: number) => {
              const [day, time] = dayText.split(': ');
              const today = new Date().getDay();
              const isToday = (index === (today === 0 ? 6 : today - 1));
              
              return (
                <div 
                  key={index} 
                  className={`flex justify-between text-sm ${
                    isToday ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <span>{toTitleCase(day)}</span>
                  <span>{time || 'Closed'}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Hours Not Available</p>
        )}
      </div>

      {/* Reviews Section */}
      <div className="glass px-6 py-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">
          Top Reviews
        </h2>

        {displayedReviews.length === 0 ? (
          <p className="text-sm text-slate-400">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          <div className="space-y-4">
            {displayedReviews.map((review, index) => (
              <div
                key={review.id}
                className={`pb-4 ${
                  index < displayedReviews.length - 1
                    ? 'border-b border-white/10'
                    : ''
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  <SourceBadge source={review.source} />
                </div>
                <p className="mb-2 line-clamp-3 text-sm text-slate-300">
                  {review.text}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{review.author}</span>
                  <span>{formatDate(review.createdDate)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Button - Sticky Bottom */}
      <div className="glass sticky bottom-0 border-t border-white/10 px-6 pb-6 pt-4">
        <button
          onClick={handleGetDirections}
          className="w-full rounded-2xl bg-emerald-500 py-4 text-lg font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          Get Directions
        </button>
      </div>
    </div>
  );
}
