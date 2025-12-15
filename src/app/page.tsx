'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Restaurant, FilterState, ApiResponse } from '@/types';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/contexts/ToastContext';
import { AnimatePresence } from 'framer-motion';
import { List } from 'lucide-react';
import { calculateDistance } from '@/lib/utils';
import { getTripAdvisorData } from '@/services/tripAdvisor';
import Map from '@/components/Map';
import MapModal from '@/components/MapModal';
import RestaurantCard from '@/components/RestaurantCard';
import RestaurantCardSkeleton from '@/components/RestaurantCardSkeleton';
import FilterBar from '@/components/FilterBar';
import BottomNav from '@/components/BottomNav';
import BottomSheet from '@/components/BottomSheet';

const DEFAULT_FILTERS: FilterState = {
  nearMe: false,
  openNow: false,
  category: null,
  priceRange: null,
  halal: false,
  searchQuery: '',
  editorialPicks: false,
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

  // Memoize user location coordinates to prevent recalculation
  const userLocationCoords = useMemo(() => {
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
        const fetchedRestaurants = data.data || [];
        setRestaurants(fetchedRestaurants);
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

  // Memoize filtered and sorted restaurants (must be defined before handlers that use it)
  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants];

    // Filter by Editorial Picks (dual verified - has TripAdvisor data)
    if (filters.editorialPicks) {
      result = result.filter((restaurant) => {
        const tripAdvisorData = getTripAdvisorData(restaurant.name);
        return tripAdvisorData !== null; // Only show restaurants with TripAdvisor data
      });
    }

    // If "Near Me" is active and we have user location, sort by distance
    if (filters.nearMe && userLocationCoords) {
      // Calculate distance for each restaurant and sort
      result = result
        .map((restaurant) => ({
          ...restaurant,
          distance: calculateDistance(
            userLocationCoords.lat,
            userLocationCoords.lng,
            restaurant.lat,
            restaurant.lng
          ),
        }))
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    return result;
  }, [restaurants, filters.nearMe, filters.editorialPicks, userLocationCoords]);

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
  const handleCardClick = useCallback((id: string) => {
    setSelectedId(id);
    // Fly map to restaurant location
    const restaurant = filteredRestaurants.find((r) => r.id === id);
    if (restaurant) {
      setMapCenter({ lat: restaurant.lat, lng: restaurant.lng });
    }
    if (view === 'list') {
      // Scroll will be handled by useEffect
    }
  }, [filteredRestaurants, view]);

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
    <div className="relative h-screen overflow-hidden bg-slate-950">
      {/* Map - Absolute Background Layer */}
      <div className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'auto' }}>
        <Map
          restaurants={filteredRestaurants}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelectRestaurant={handleMarkerClick}
          onHoverRestaurant={handleMarkerHover}
          userLocation={userLocationForMap}
          centerRestaurantId={selectedId}
          center={mapCenter}
        />
      </div>

      {/* Desktop: Floating Sidebar */}
      <div className="hidden md:flex absolute left-0 top-0 h-full md:w-[320px] lg:w-[360px] flex-shrink-0 z-10 bg-pearl/90 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-r-2xl flex-col" style={{ overflowY: 'hidden', overflowX: 'visible' }}>
        {/* Search Bar Header - Fixed at Top */}
        <div className="flex-shrink-0 p-4 border-b border-white/10">
          <FilterBar 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onNearMeClick={handleNearMeClick}
            view={view}
            onViewToggle={() => setView(view === 'map' ? 'list' : 'map')}
          />
          
          {/* Halal Filter Badge */}
          {filters.halal && (
            <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-2 text-sm font-medium text-slate-500 border border-emerald-500/20 bg-emerald-500/10">
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
        </div>

        {/* Food List - Scrollable Area */}
        <div 
          ref={listContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
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
          ) : filteredRestaurants.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-slate-400">{getEmptyMessage()}</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredRestaurants.map((restaurant, index) => (
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

      {/* Mobile: Top Search Bar - Fixed at Top */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-pearl/90 backdrop-blur-xl border-b border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
        <div className="p-4">
          <FilterBar 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onNearMeClick={handleNearMeClick}
            view={view}
            isDrawerOpen={isDrawerOpen}
          />
          
          {/* Halal Filter Badge */}
          {filters.halal && (
            <div className="mt-3 flex items-center justify-between rounded-xl px-4 py-2 text-sm font-medium text-slate-500 border border-emerald-500/20 bg-emerald-500/10">
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
        </div>
      </div>

      {/* Mobile: Floating Button - Opens Drawer */}
      {!isDrawerOpen && (
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="md:hidden fixed bottom-20 left-1/2 z-30 -translate-x-1/2 flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-white shadow-xl transition-all hover:bg-emerald-600 active:scale-95"
          aria-label="View restaurants list"
        >
          <List className="h-5 w-5" />
          <span className="font-semibold">View List</span>
        </button>
      )}

      {/* Mobile: Bottom Sheet Drawer */}
      <div className="md:hidden">
        <BottomSheet
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          filters={filters}
          onFilterChange={handleFilterChange}
          onNearMeClick={handleNearMeClick}
          onClearHalal={handleClearHalal}
          restaurants={filteredRestaurants}
          loading={loading}
          error={error}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onCardClick={handleCardClick}
          onCardHover={handleCardHover}
          getEmptyMessage={getEmptyMessage}
          listContainerRef={listContainerRef}
          selectedCardRef={selectedCardRef}
        />
      </div>

      {/* Bottom Navigation Bar - Mobile Only */}
      <BottomNav />
    </div>
  );
}
