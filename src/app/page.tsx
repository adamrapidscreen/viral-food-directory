'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Restaurant, FilterState, ApiResponse } from '@/types';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDebounce } from '@/hooks/useDebounce';
import { buildRestaurantQuery } from '@/lib/queryBuilder';
import Map from '@/components/Map';
import RestaurantCard from '@/components/RestaurantCard';
import FilterBar from '@/components/FilterBar';
import TrendingDishes from '@/components/TrendingDishes';

const DEFAULT_FILTERS: FilterState = {
  nearMe: false,
  openNow: false,
  category: null,
  priceRange: null,
  halal: false,
  searchQuery: '',
};

export default function HomePage() {
  // State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'list'>('map');

  // Geolocation
  const geo = useGeolocation();

  // Refs
  const listContainerRef = useRef<HTMLDivElement>(null);
  const selectedCardRef = useRef<HTMLDivElement>(null);

  // Transform geolocation to userLocation format
  const userLocation = useMemo(() => {
    if (geo.loading || !geo.latitude || !geo.longitude) return null;
    return { lat: geo.latitude, lng: geo.longitude };
  }, [geo.loading, geo.latitude, geo.longitude]);

  // Determine location for API call
  const apiLocation = useMemo(() => {
    if (filters.nearMe && userLocation) {
      return userLocation;
    }
    // Default to KL center if not using nearMe
    return { lat: 3.139, lng: 101.6869 };
  }, [filters.nearMe, userLocation]);

  // Debounce filters to avoid excessive API calls
  const debouncedFilters = useDebounce(filters, 300);

  // Fetch restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      // Wait for geolocation if nearMe is enabled
      if (filters.nearMe && geo.loading) return;

      setLoading(true);
      setError(null);

      try {
        const query = buildRestaurantQuery(debouncedFilters, apiLocation);
        const response = await fetch(`/api/restaurants?${query}`);
        const data: ApiResponse<Restaurant[]> = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          setRestaurants(data.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [debouncedFilters, apiLocation, filters.nearMe, geo.loading]);

  // Scroll to selected card in list view
  useEffect(() => {
    if (selectedId && selectedCardRef.current && view === 'list') {
      setTimeout(() => {
        selectedCardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [selectedId, view]);

  // Handle card click
  const handleCardClick = (id: string) => {
    setSelectedId(id);
    if (view === 'list') {
      // Scroll will be handled by useEffect
    }
  };

  // Handle marker click
  const handleMarkerClick = (id: string | null) => {
    setSelectedId(id);
    if (id && view === 'list') {
      // Scroll will be handled by useEffect
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Clear selection when filters change
    setSelectedId(null);
  };

  // Handle halal badge clear
  const handleClearHalal = () => {
    setFilters({ ...filters, halal: false });
  };

  // Get empty state message
  const getEmptyMessage = () => {
    if (filters.searchQuery) return `No restaurants found for "${filters.searchQuery}"`;
    if (filters.halal) return "No halal restaurants match your filters";
    if (filters.category) return `No ${filters.category} restaurants found`;
    if (filters.openNow) return "No restaurants are currently open";
    return "No restaurants match your filters";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-800 md:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
            🍜 Viral Eats MY
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Discover Malaysia's Hottest Food Spots
          </p>
          <p className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
            ✅ Malaysia's #1 Halal Food Discovery App
          </p>
        </div>
      </header>

      {/* Trending Dishes */}
      <TrendingDishes />

      {/* FilterBar - Sticky */}
      <div className="sticky top-0 z-40">
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />
        
        {/* Halal Filter Badge */}
        {filters.halal && (
          <div className="mx-4 mt-2 flex items-center justify-between rounded-xl bg-green-100 px-4 py-2 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300 md:mx-6">
            <span>✅ Showing Halal Restaurants Only</span>
            <button
              onClick={handleClearHalal}
              className="rounded-full p-1 hover:bg-green-200 dark:hover:bg-green-800"
              aria-label="Clear halal filter"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Mobile Layout */}
        <div className="md:hidden">
          {view === 'map' ? (
            <div className="relative h-[60vh] mb-4 rounded-xl">
              <Map
                restaurants={restaurants}
                selectedId={selectedId}
                onSelectRestaurant={handleMarkerClick}
                userLocation={userLocation}
                centerRestaurantId={selectedId}
              />
            </div>
          ) : (
            <div
              ref={listContainerRef}
              className="mb-20 max-h-[60vh] space-y-4 overflow-y-auto"
            >
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse rounded-2xl bg-white p-5 dark:bg-slate-800">
                      <div className="mb-3 h-20 w-20 rounded-xl bg-gray-200 dark:bg-slate-700" />
                      <div className="mb-2 h-5 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
                      <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-xl bg-red-50 p-6 text-center dark:bg-red-900/20">
                  <p className="mb-4 text-red-700 dark:text-red-300">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Retry
                  </button>
                </div>
              ) : restaurants.length === 0 ? (
                <div className="rounded-xl bg-white p-8 text-center dark:bg-slate-800">
                  <p className="text-gray-600 dark:text-gray-400">{getEmptyMessage()}</p>
                </div>
              ) : (
                restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    ref={restaurant.id === selectedId ? selectedCardRef : null}
                  >
                    <RestaurantCard
                      restaurant={restaurant}
                      isSelected={restaurant.id === selectedId}
                      onClick={() => handleCardClick(restaurant.id)}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {/* View Toggle Button - Mobile */}
          <button
            onClick={() => setView(view === 'map' ? 'list' : 'map')}
            className="fixed bottom-6 right-6 z-50 rounded-full bg-teal-600 px-6 py-3 text-white shadow-lg transition-all hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
            aria-label={`Switch to ${view === 'map' ? 'list' : 'map'} view`}
          >
            {view === 'map' ? '📋 List' : '📍 Map'}
          </button>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-[60%_40%] md:gap-6 md:py-6">
          {/* Map */}
          <div className="relative h-[calc(100vh-300px)] rounded-xl">
            <Map
              restaurants={restaurants}
              selectedId={selectedId}
              onSelectRestaurant={handleMarkerClick}
              userLocation={userLocation}
              centerRestaurantId={selectedId}
            />
          </div>

          {/* List */}
          <div
            ref={listContainerRef}
            className="h-[calc(100vh-300px)] space-y-4 overflow-y-auto pr-2"
          >
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse rounded-2xl bg-white p-5 dark:bg-slate-800">
                    <div className="mb-3 h-20 w-20 rounded-xl bg-gray-200 dark:bg-slate-700" />
                    <div className="mb-2 h-5 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
                    <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl bg-red-50 p-6 text-center dark:bg-red-900/20">
                <p className="mb-4 text-red-700 dark:text-red-300">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="rounded-xl bg-white p-8 text-center dark:bg-slate-800">
                <p className="text-gray-600 dark:text-gray-400">{getEmptyMessage()}</p>
              </div>
            ) : (
              restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  ref={restaurant.id === selectedId ? selectedCardRef : null}
                >
                  <RestaurantCard
                    restaurant={restaurant}
                    isSelected={restaurant.id === selectedId}
                    onClick={() => handleCardClick(restaurant.id)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
