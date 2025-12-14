'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Share2 } from 'lucide-react';
import { Restaurant, Review } from '@/types';
import HalalBadge from './HalalBadge';
import { useToast } from '@/contexts/ToastContext';
import { formatPrice, isOpenNow, formatDate, getCurrentDayHours } from '@/lib/utils';

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
    google: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    tripadvisor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles[source]}`}
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
  const isOpen = isOpenNow(restaurant.operatingHours);
  const isTrending = restaurant.trendingScore > 75;
  const currentDayHours = getCurrentDayHours(restaurant.operatingHours);
  const displayedReviews = reviews.slice(0, 10); // Limit to 10 reviews
  const currentDay = dayNames[new Date().getDay()].key;

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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden bg-gradient-to-br from-teal-600 to-teal-800">
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
          className="absolute left-6 top-6 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800"
          aria-label="Go back"
        >
          <svg
            className="h-5 w-5 text-gray-900 dark:text-white"
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
          className="absolute right-6 top-6 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800"
          aria-label="Share restaurant"
        >
          <Share2 className="h-5 w-5 text-gray-900 dark:text-white" />
        </button>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl font-bold text-white">{restaurant.name}</h1>
          <p className="mt-1 text-sm text-white/80">{restaurant.address}</p>

          {/* Badges Row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm text-white backdrop-blur-sm">
              {categoryEmoji[restaurant.category]} {categoryLabel[restaurant.category]}
            </span>

            {restaurant.isHalal && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                ✅ {restaurant.halalCertNumber ? 'Halal Certified' : 'Halal'}
              </span>
            )}

            {isTrending && (
              <span className="rounded-full bg-pink-500/80 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                🔥 Trending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 border-b border-gray-200 bg-white py-6 px-6 dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            ⭐ {restaurant.aggregateRating != null ? restaurant.aggregateRating.toFixed(1) : 'N/A'}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Rating</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {restaurant.priceRange}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formatPrice(restaurant.priceRange)}
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentDayHours === null ? '—' : currentDayHours === 'Closed' ? '—' : '🕐'}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {currentDayHours === null ? 'Hours not available' : currentDayHours === 'Closed' ? 'Closed' : currentDayHours}
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
        {isOpen === true && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Open Now
          </span>
        )}
        {isOpen === false && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            Closed
          </span>
        )}
        {isOpen === null && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400">
            <span className="h-2 w-2 rounded-full bg-gray-400"></span>
            Hours not available
          </span>
        )}

        {restaurant.isHalal && (
          <HalalBadge
            isHalal={true}
            certNumber={restaurant.halalCertNumber}
            size="sm"
          />
        )}

        {restaurant.distance && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            📍 {restaurant.distance.toFixed(1)} km away
          </span>
        )}
      </div>

      {/* Must-Try Section */}
      {restaurant.mustTryDish && (
        <div className="mx-6 my-6 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-teal-50/50 p-6 dark:from-teal-900/30 dark:to-teal-900/20 dark:border-teal-800">
          <div className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">
            ⭐ MUST TRY
          </div>
          <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
            {restaurant.mustTryDish}
          </div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {restaurant.mustTryConfidence}% recommend
          </div>
        </div>
      )}

      {/* Operating Hours */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
        {!restaurant.operatingHours || Object.keys(restaurant.operatingHours).length === 0 ? (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Hours
            </h3>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-3">
              Hours not available in our database
            </p>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-500 hover:text-teal-400 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium inline-flex items-center gap-1"
            >
              📍 Check hours on Google Maps →
            </a>
          </div>
        ) : (
          <>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Hours
            </h2>
            <div className="space-y-2">
              {dayNames.map((day) => {
                const hours = restaurant.operatingHours[day.key] || 'Closed';
                const isCurrentDay = day.key === currentDay;

                return (
                  <div
                    key={day.key}
                    className={`flex items-center justify-between text-sm ${
                      isCurrentDay
                        ? 'font-semibold text-teal-600 dark:text-teal-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCurrentDay && (
                        <span className="h-2 w-2 rounded-full bg-teal-600 dark:bg-teal-400"></span>
                      )}
                      <span>{day.label}</span>
                    </div>
                    <span>{hours}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Reviews Section */}
      <div className="bg-white px-6 py-6 dark:bg-slate-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Top Reviews
        </h2>

        {displayedReviews.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          <div className="space-y-4">
            {displayedReviews.map((review, index) => (
              <div
                key={review.id}
                className={`pb-4 ${
                  index < displayedReviews.length - 1
                    ? 'border-b border-gray-200 dark:border-slate-700'
                    : ''
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  <SourceBadge source={review.source} />
                </div>
                <p className="mb-2 line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
                  {review.text}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{review.author}</span>
                  <span>{formatDate(review.createdDate)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Button - Sticky Bottom */}
      <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 pb-6 pt-4 dark:border-slate-700 dark:bg-slate-800">
        <button
          onClick={handleGetDirections}
          className="w-full rounded-2xl bg-teal-600 py-4 text-lg font-semibold text-white transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
        >
          Get Directions
        </button>
      </div>
    </div>
  );
}
