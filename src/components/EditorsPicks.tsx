'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, Trophy } from 'lucide-react';
import { Restaurant } from '@/types';
import { toSlug } from '@/utils/slug';
import cacheData from '@/data/tripAdvisorCache.json';

interface TripAdvisorCacheEntry {
  ranking?: string | null;
  priceRange?: string | null;
  lastUpdated: string;
}

interface TripAdvisorCache {
  [key: string]: TripAdvisorCacheEntry;
}

const tripAdvisorCache = cacheData as TripAdvisorCache;

interface EditorsPicksState {
  restaurants: Array<Restaurant & { tripAdvisor: any }>;
  loading: boolean;
  error: string | null;
}

export default function EditorsPicks() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEditorsPicks = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch restaurants from API
        const res = await fetch('/api/restaurants?limit=100');
        const result = await res.json();

        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid response from API');
        }

        // Store restaurants - don't reset to empty array
        setRestaurants(result.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching editors picks:', error);
        setError(error instanceof Error ? error.message : 'Failed to load editors picks');
        setLoading(false);
      }
    };

    fetchEditorsPicks();
  }, []);

  // Filter to only restaurants with TripAdvisor cache entries (any entry)
  const enrichedRestaurants = useMemo(() => {
    if (!restaurants?.length) return [];
    
    return restaurants
      .filter((r) => {
        const slug = toSlug(r.name);
        const cacheEntry = tripAdvisorCache[slug as keyof typeof tripAdvisorCache];
        
        // Just check if entry exists
        return cacheEntry !== undefined;
      })
      .map((r) => {
        const slug = toSlug(r.name);
        const cacheEntry = tripAdvisorCache[slug as keyof typeof tripAdvisorCache];
        return {
          ...r,
          tripAdvisor: cacheEntry,
        };
      })
      .sort((a, b) => (b.aggregateRating || 0) - (a.aggregateRating || 0))
      .slice(0, 10);
  }, [restaurants]);

  const handleCardClick = (restaurantId: string) => {
    router.push(`/place/${restaurantId}`);
  };

  if (loading) {
    return (
      <div className="overflow-x-auto scrollbar-hide pb-4">
        <div className="flex gap-4 px-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-72 flex-shrink-0 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
            >
              <div className="h-40 bg-surface-solid/50" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-surface-solid/50 rounded w-3/4" />
                <div className="h-3 bg-surface-solid/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !enrichedRestaurants.length) {
    return null; // Don't show section if no enriched restaurants
  }

  return (
    <div className="overflow-x-auto scrollbar-hide pb-4">
      <div className="flex gap-4 px-4">
        {enrichedRestaurants.map((restaurant) => {
          const imageUrl = restaurant.photos?.[0] || '';
          const googleRating = restaurant.googleRating || restaurant.aggregateRating || 0;
          const slug = toSlug(restaurant.name);
          const cacheEntry = tripAdvisorCache[slug as keyof typeof tripAdvisorCache];

          return (
            <div
              key={restaurant.id}
              onClick={() => handleCardClick(restaurant.id)}
              className="relative w-72 flex-shrink-0 rounded-2xl bg-white/5 border border-white/10 overflow-hidden group hover:bg-white/10 transition-all cursor-pointer"
            >
              {/* Dual Verified Ribbon */}
              <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-amber-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                ✓ Dual Verified
              </div>

              {/* Image */}
              <div className="h-40 overflow-hidden bg-surface-solid/50">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={restaurant.name}
                    width={288}
                    height={160}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🍽️
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-white truncate text-lg">{restaurant.name}</h3>

                {/* Dual Ratings Row */}
                <div className="flex items-center gap-3">
                  {googleRating > 0 && (
                    <span className="flex items-center gap-1 text-amber-400 text-sm font-semibold">
                      <Star className="w-4 h-4 fill-amber-400" /> {googleRating.toFixed(1)}
                    </span>
                  )}
                  {cacheEntry?.ranking && (
                    <span className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                      <Trophy className="w-4 h-4" /> {cacheEntry.ranking.split(' ')[0]}
                    </span>
                  )}
                </div>

                {/* TripAdvisor Info */}
                <div className="flex flex-col gap-1">
                  {cacheEntry?.priceRange && (
                    <div className="text-slate-400 text-sm font-medium">{cacheEntry.priceRange}</div>
                )}
                  {!cacheEntry?.ranking && !cacheEntry?.priceRange && (
                    <span className="text-blue-400 text-xs">✓ TripAdvisor Listed</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
