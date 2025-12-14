'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Restaurant, FilterState, ApiResponse } from '@/types';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/contexts/ToastContext';
import { AnimatePresence } from 'framer-motion';
import Map from '@/components/Map';
import MapModal from '@/components/MapModal';
import RestaurantCard from '@/components/RestaurantCard';
import RestaurantCardSkeleton from '@/components/RestaurantCardSkeleton';
import FilterBar from '@/components/FilterBar';
import EditorsPicks from '@/components/EditorsPicks';
import TrendingDishes from '@/components/TrendingDishes';
import BottomNav from '@/components/BottomNav';

const DEFAULT_FILTERS: FilterState = {
  nearMe: false,
  openNow: false,
  category: null,
  priceRange: null,
  halal: false,
  searchQuery: '',
};

const KUALA_LUMPUR_LOCATION = { latitude: 3.139, longitude: 101.6869 };

export default function HomePage() {
  // State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 3.139, lng: 101.6869 });

  // Geolocation
  const geo = useGeolocation();
  const { showToast } = useToast();

  // Refs
  const listContainerRef = useRef<HTMLDivElement>(null);
  const selectedCardRef = useRef<HTMLDivElement>(null);

  // Store user location in state when geolocation is available
  useEffect(() => {
    if (!geo.loading) {
      if (geo.error) {
        // Location denied or unavailable - default to KL
        setUserLocation(null);
        showToast('Location unavailable. Showing KL area.', 'info');
      } else if (geo.latitude && geo.longitude) {
        // User location available - store it
        setUserLocation({ latitude: geo.latitude, longitude: geo.longitude });
      }
    }
  }, [geo.loading, geo.latitude, geo.longitude, geo.error, showToast]);

  // Transform userLocation to map format
  const userLocationForMap = useMemo(() => {
    if (!userLocation) return null;
    return { lat: userLocation.latitude, lng: userLocation.longitude };
  }, [userLocation]);

  // Debounce filters to avoid excessive API calls
  const debouncedFilters = useDebounce(filters, 300);

  // Fetch restaurants
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      // Only apply location/radius filtering when "Near Me" is explicitly enabled
      if (debouncedFilters.nearMe && userLocation) {
        // User wants nearby restaurants - use their location with 15km radius
        params.set('lat', userLocation.latitude.toString());
        params.set('lng', userLocation.longitude.toString());
        params.set('radius', '15'); // 15km radius for "Near Me"
      } else if (!debouncedFilters.nearMe) {
        // "Near Me" is OFF - show all restaurants (no location filter)
        // Don't send lat/lng/radius, API will return all restaurants
      } else {
        // "Near Me" is ON but no user location yet - use KL as fallback with large radius
        params.set('lat', KUALA_LUMPUR_LOCATION.latitude.toString());
        params.set('lng', KUALA_LUMPUR_LOCATION.longitude.toString());
        params.set('radius', '200'); // Large radius to show all restaurants
      }
      
      if (debouncedFilters.halal) params.set('halal', 'true');
      if (debouncedFilters.category) params.set('category', debouncedFilters.category);
      if (debouncedFilters.priceRange) params.set('priceRange', debouncedFilters.priceRange);
      if (debouncedFilters.openNow) params.set('openNow', 'true');
      if (debouncedFilters.searchQuery) params.set('searchQuery', debouncedFilters.searchQuery);
      
      const response = await fetch(`/api/restaurants?${params}`);
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
  }, [userLocation, debouncedFilters]);

  // Fetch restaurants when userLocation or filters change
  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

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

  // Handle card hover
  const handleCardHover = (id: string | null) => {
    setHoveredId(id);
  };

  // Handle marker click
  const handleMarkerClick = (id: string | null) => {
    setSelectedId(id);
    if (id && view === 'list') {
      // Scroll will be handled by useEffect
    }
  };

  // Handle marker hover
  const handleMarkerHover = (id: string | null) => {
    setHoveredId(id);
  };

  // Handle "Near Me" click - toggle filter and request geolocation if turning ON
  const handleNearMeClick = useCallback(() => {
    // If "Near Me" is currently ON, just turn it OFF (toggle)
    if (filters.nearMe) {
      setFilters((prev) => ({ ...prev, nearMe: false }));
      // Reset map center to KL when turning off
      setMapCenter({ lat: 3.139, lng: 101.6869 });
      return;
    }

    // "Near Me" is OFF - turning it ON, so request geolocation
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Update user location state
          setUserLocation({ latitude, longitude });
          // Update filters to trigger re-fetch
          setFilters((prev) => ({ ...prev, nearMe: true }));
          // Center map on user location
          setMapCenter({ lat: latitude, lng: longitude });
          setLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          showToast('Could not get your location. Please enable location access.', 'error');
          setLoading(false);
          // Don't set nearMe to true if geolocation fails
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      showToast('Geolocation is not supported by your browser.', 'error');
    }
  }, [filters.nearMe, showToast]);

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
    <div className="min-h-screen bg-slate-950 pt-6">
      {/* FilterBar - Floating Island */}
      <FilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange}
        onNearMeClick={handleNearMeClick}
        view={view}
        onViewToggle={() => setView(view === 'map' ? 'list' : 'map')}
      />
      
      {/* Halal Filter Badge */}
      {filters.halal && (
        <div className="glass mx-auto mt-4 max-w-2xl flex items-center justify-between rounded-xl px-4 py-2 text-sm font-medium text-emerald-400 border border-emerald-500/20 bg-emerald-500/10">
          <span>✅ Showing Halal Restaurants Only</span>
          <button
            onClick={handleClearHalal}
            className="rounded-xl p-1 hover:bg-emerald-500/20"
            aria-label="Clear halal filter"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* EDITOR'S PICKS - TOP PRIORITY */}
      <section className="py-6">
        <div className="px-4 mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🏆 Editor&apos;s Picks
          </h2>
          <p className="text-slate-400 text-sm">
            Top-rated on both Google & TripAdvisor
          </p>
        </div>
        <EditorsPicks />
      </section>

      {/* Trending Dishes */}
      <TrendingDishes />

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-20 md:px-6 md:pb-4">
        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Mobile: Always show list view, map is in modal */}
          <div
            ref={listContainerRef}
            className="space-y-4"
          >
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <RestaurantCardSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <div className="glass rounded-xl p-6 text-center border border-red-500/20 bg-red-500/10">
                  <p className="mb-4 text-red-400">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                  >
                    Retry
                  </button>
                </div>
              ) : restaurants.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <p className="text-slate-400">{getEmptyMessage()}</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {restaurants.map((restaurant, index) => (
                    <div
                      key={restaurant.id}
                      ref={restaurant.id === selectedId ? selectedCardRef : null}
                      onMouseEnter={() => handleCardHover(restaurant.id)}
                      onMouseLeave={() => handleCardHover(null)}
                    >
                      <RestaurantCard
                        restaurant={restaurant}
                        isSelected={restaurant.id === selectedId}
                        isHovered={restaurant.id === hoveredId}
                        onClick={() => handleCardClick(restaurant.id)}
                        index={index}
                      />
                    </div>
                  ))}
                </AnimatePresence>
              )}
          </div>

          {/* Map FAB Button - Floating Action Button */}
          <button
            onClick={() => setIsMapModalOpen(true)}
            className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-white shadow-xl transition-all hover:bg-emerald-600 active:scale-95"
            aria-label="Open map"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-semibold">Map</span>
          </button>

          {/* Map Modal */}
          <MapModal
            isOpen={isMapModalOpen}
            onClose={() => setIsMapModalOpen(false)}
            restaurants={restaurants}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelectRestaurant={handleMarkerClick}
            onHoverRestaurant={handleMarkerHover}
            userLocation={userLocationForMap}
            centerRestaurantId={selectedId}
            center={mapCenter}
          />
        </div>

        {/* Desktop Layout - Sticky Split View for lg screens */}
        <div className="hidden lg:flex lg:gap-6 lg:pt-6 lg:px-0">
          {/* Left: Scrollable Grid of Food Cards (60%) */}
          <div className="flex-1 lg:w-[60%]">
            <div
              ref={listContainerRef}
              className="h-[calc(100vh-200px)] space-y-4 overflow-y-auto pr-2"
            >
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <RestaurantCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="glass rounded-xl p-6 text-center border border-red-500/20 bg-red-500/10">
                <p className="mb-4 text-red-400">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  Retry
                </button>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-slate-400">{getEmptyMessage()}</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {restaurants.map((restaurant, index) => (
                  <div
                    key={restaurant.id}
                    ref={restaurant.id === selectedId ? selectedCardRef : null}
                    onMouseEnter={() => handleCardHover(restaurant.id)}
                    onMouseLeave={() => handleCardHover(null)}
                  >
                    <RestaurantCard
                      restaurant={restaurant}
                      isSelected={restaurant.id === selectedId}
                      isHovered={restaurant.id === hoveredId}
                      onClick={() => handleCardClick(restaurant.id)}
                      index={index}
                    />
                  </div>
                ))}
              </AnimatePresence>
            )}
            </div>
          </div>

          {/* Right: Sticky Map (40%) */}
          <div className="sticky top-4 h-[calc(100vh-100px)] w-[40%] rounded-2xl overflow-hidden">
            <Map
              restaurants={restaurants}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelectRestaurant={handleMarkerClick}
              onHoverRestaurant={handleMarkerHover}
              userLocation={userLocationForMap}
              centerRestaurantId={selectedId}
              center={mapCenter}
            />
          </div>
        </div>

        {/* Desktop Layout - Original for md screens (tablets) */}
        <div className="hidden md:grid md:grid-cols-[60%_40%] md:gap-6 md:py-6 lg:hidden">
          {/* Map */}
          <div className="relative h-[calc(100vh-300px)] rounded-2xl overflow-hidden">
            <Map
              restaurants={restaurants}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelectRestaurant={handleMarkerClick}
              onHoverRestaurant={handleMarkerHover}
              userLocation={userLocationForMap}
              centerRestaurantId={selectedId}
              center={mapCenter}
            />
          </div>

          {/* List */}
          <div
            ref={listContainerRef}
            className="h-[calc(100vh-300px)] space-y-4 overflow-y-auto pr-2"
          >
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <RestaurantCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="glass rounded-xl p-6 text-center border border-red-500/20 bg-red-500/10">
                <p className="mb-4 text-red-400">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  Retry
                </button>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-slate-400">{getEmptyMessage()}</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {restaurants.map((restaurant, index) => (
                  <div
                    key={restaurant.id}
                    ref={restaurant.id === selectedId ? selectedCardRef : null}
                    onMouseEnter={() => handleCardHover(restaurant.id)}
                    onMouseLeave={() => handleCardHover(null)}
                  >
                    <RestaurantCard
                      restaurant={restaurant}
                      isSelected={restaurant.id === selectedId}
                      isHovered={restaurant.id === hoveredId}
                      onClick={() => handleCardClick(restaurant.id)}
                      index={index}
                    />
                  </div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar - Mobile Only */}
      <BottomNav />
    </div>
  );
}
