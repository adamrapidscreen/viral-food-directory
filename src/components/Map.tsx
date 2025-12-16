'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { Restaurant, MapMarker } from '@/types';
import FoodMarker from './FoodMarker';
import MarkerPopup from './MarkerPopup';

interface MapProps {
  restaurants: Restaurant[];
  selectedId: string | null;
  hoveredId?: string | null;
  onSelectRestaurant: (id: string | null) => void;
  onHoverRestaurant?: (id: string | null) => void;
  userLocation: { lat: number; lng: number } | null;
  centerRestaurantId?: string | null;
  center?: { lat: number; lng: number };
}

const KUALA_LUMPUR_CENTER = { lat: 3.139, lng: 101.6869 };
const DEFAULT_ZOOM = 14;

// Convert Restaurant to MapMarker format
function restaurantToMapMarker(restaurant: Restaurant): MapMarker {
  return {
    id: restaurant.id,
    lat: restaurant.lat,
    lng: restaurant.lng,
    name: restaurant.name,
    category: restaurant.category,
    rating: restaurant.aggregateRating,
    trendingScore: restaurant.trendingScore,
    isTrending: restaurant.trendingScore > 75,
    isHalal: restaurant.isHalal,
  };
}

// Internal component to handle map panning
function MapController({ center }: { center?: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);

  return null;
}

export default function MapComponent({
  restaurants,
  selectedId,
  hoveredId,
  onSelectRestaurant,
  onHoverRestaurant,
  userLocation,
  centerRestaurantId,
  center,
}: MapProps) {
  const router = useRouter();
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Convert restaurants to map markers
  const mapMarkers = useMemo(
    () => restaurants.map(restaurantToMapMarker),
    [restaurants]
  );

  // Get selected restaurant
  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedId) || null,
    [restaurants, selectedId]
  );

  // Determine initial map center - prioritize center prop, then centerRestaurantId, then userLocation, then default
  const initialCenter = useMemo(() => {
    if (center) {
      return center;
    }
    if (centerRestaurantId) {
      const restaurant = restaurants.find((r) => r.id === centerRestaurantId);
      if (restaurant) {
        return { lat: restaurant.lat, lng: restaurant.lng };
      }
    }
    return userLocation || KUALA_LUMPUR_CENTER;
  }, [center, centerRestaurantId, restaurants, userLocation]);

  // Handle marker click - memoized to prevent re-renders
  const handleMarkerClick = useCallback((id: string) => {
    onSelectRestaurant(id);
  }, [onSelectRestaurant]);

  // Handle map click - memoized
  const handleMapClick = useCallback(() => {
    onSelectRestaurant(null);
  }, [onSelectRestaurant]);

  // Handle info window close - memoized
  const handleInfoWindowClose = useCallback(() => {
    onSelectRestaurant(null);
  }, [onSelectRestaurant]);

  // Handle view details - memoized
  const handleViewDetails = useCallback((id: string) => {
    router.push(`/place/${id}`);
  }, [router]);

  // Memoize marker hover handlers
  const handleMarkerHover = useCallback((id: string) => {
    onHoverRestaurant?.(id);
  }, [onHoverRestaurant]);

  const handleMarkerHoverEnd = useCallback(() => {
    onHoverRestaurant?.(null);
  }, [onHoverRestaurant]);

  // Create stable callback maps to avoid creating new functions on every render
  const clickHandlers = useMemo(() => {
    const handlers = new Map<string, () => void>();
    mapMarkers.forEach((marker) => {
      handlers.set(marker.id, () => handleMarkerClick(marker.id));
    });
    return handlers;
  }, [mapMarkers, handleMarkerClick]);

  const hoverHandlers = useMemo(() => {
    const handlers = new Map<string, () => void>();
    mapMarkers.forEach((marker) => {
      handlers.set(marker.id, () => handleMarkerHover(marker.id));
    });
    return handlers;
  }, [mapMarkers, handleMarkerHover]);

  // Memoize the marker rendering to prevent unnecessary re-renders
  // Use stable callback references from the maps
  const renderedMarkers = useMemo(() => {
    return mapMarkers.map((marker) => {
      const restaurant = restaurants.find((r) => r.id === marker.id);
      return (
        <FoodMarker
          key={marker.id}
          place={marker}
          restaurant={restaurant || null}
          isSelected={marker.id === selectedId}
          isHovered={marker.id === hoveredId}
          onClick={clickHandlers.get(marker.id)!}
          onHover={hoverHandlers.get(marker.id)!}
          onHoverEnd={handleMarkerHoverEnd}
        />
      );
    });
  }, [mapMarkers, restaurants, selectedId, hoveredId, clickHandlers, hoverHandlers, handleMarkerHoverEnd]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-800">
        <p className="text-gray-500 dark:text-gray-400">
          Google Maps API key is missing
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[400px]">
      {/* Loading state */}
      {!isMapLoaded && (
        <div className="glass absolute inset-0 z-10 flex items-center justify-center rounded-2xl pointer-events-none">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      )}

      <APIProvider apiKey={apiKey}>
        <GoogleMap
          defaultCenter={initialCenter}
          defaultZoom={centerRestaurantId ? 16 : DEFAULT_ZOOM}
          mapId="viral-food-map"
          disableDefaultUI={false}
          gestureHandling="greedy"
          draggable={true}
          scrollwheel={true}
          reuseMaps={true}
          onIdle={() => setIsMapLoaded(true)}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Map controller to handle panning when center changes */}
          <MapController center={center} />
          {/* User location marker */}
          {userLocation && (
            <AdvancedMarker position={userLocation}>
              <div className="relative">
                {/* Pulse ring animation */}
                <div className="absolute inset-0 pulse-ring rounded-full bg-blue-500"></div>
                {/* Blue dot */}
                <div className="relative h-4 w-4 rounded-full bg-blue-600 ring-2 ring-white"></div>
              </div>
            </AdvancedMarker>
          )}

          {/* Restaurant markers - memoized rendering */}
          {renderedMarkers}

          {/* Custom popup for selected restaurant - must be inside GoogleMap for useMap hook */}
          {selectedRestaurant && (
            <MarkerPopup
              restaurant={selectedRestaurant}
              onClose={handleInfoWindowClose}
              onViewDetails={handleViewDetails}
            />
          )}
        </GoogleMap>
      </APIProvider>
    </div>
  );
}
