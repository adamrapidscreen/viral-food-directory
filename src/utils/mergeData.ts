import { Restaurant } from '@/types';
import { toSlug } from './slug';

interface TripAdvisorCacheEntry {
  priceRange?: string;
  ranking?: string;
  tags?: string[];
  reviewSnippet?: string;
  lastUpdated: string;
}

type TripAdvisorCache = Record<string, TripAdvisorCacheEntry>;

/**
 * Get restaurants that have been enriched with TripAdvisor data
 * @param restaurants - Array of restaurants from API
 * @param cache - TripAdvisor cache data
 * @returns Filtered and merged restaurants with TripAdvisor data
 */
export const getEnrichedRestaurants = (
  restaurants: Restaurant[],
  cache: TripAdvisorCache
): Array<Restaurant & { tripAdvisor: TripAdvisorCacheEntry }> => {
  return restaurants
    .filter((r) => {
      const slug = toSlug(r.name);
      return cache[slug] !== undefined;
    })
    .map((r) => {
      const slug = toSlug(r.name);
      return { ...r, tripAdvisor: cache[slug] };
    });
};
