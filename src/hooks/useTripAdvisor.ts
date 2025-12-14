'use client';

import { useState, useCallback, useRef } from 'react';
import { Restaurant } from '@/types';

interface TripAdvisorData {
  rank?: string;
  priceText?: string;
  tags?: string[];
  topReviewSnippet?: string;
}

interface UseTripAdvisorState {
  data: TripAdvisorData | null;
  loading: boolean;
  error: string | null;
}

// In-memory cache to prevent duplicate fetches in same session
const cache = new Map<string, TripAdvisorData>();

/**
 * Custom hook for lazy loading TripAdvisor enrichment data
 * @param restaurantId - Restaurant ID
 * @param restaurantName - Restaurant name (for API call)
 * @param city - City name (for API call, optional)
 */
export function useTripAdvisor(
  restaurantId: string,
  restaurantName: string,
  city?: string
) {
  const [state, setState] = useState<UseTripAdvisorState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    // Return early if already cached
    if (cache.has(restaurantId)) {
      setState({
        data: cache.get(restaurantId) || null,
        loading: false,
        error: null,
      });
      return;
    }

    // Return early if already fetching
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/enrich`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to enrich restaurant: ${response.statusText}`);
      }

      const result = await response.json();
      const restaurant: Restaurant = result.data;

      // Extract TripAdvisor data
      const tripAdvisorData: TripAdvisorData = {
        rank: restaurant.tripAdvisorRank,
        priceText: restaurant.tripAdvisorPriceText,
        tags: restaurant.tripAdvisorTags,
        topReviewSnippet: restaurant.tripAdvisorTopReviewSnippet,
      };

      // Store in cache
      cache.set(restaurantId, tripAdvisorData);

      setState({
        data: tripAdvisorData,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching TripAdvisor data:', error);
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch TripAdvisor data',
      });
    } finally {
      fetchingRef.current = false;
    }
  }, [restaurantId]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    fetchData,
  };
}
