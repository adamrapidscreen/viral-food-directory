'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Restaurant, MapMarker } from '@/types';
import FoodMarker from './FoodMarker';
import MarkerInfoWindow from './MarkerInfoWindow';

interface MapProps {
  restaurants: Restaurant[];
  selectedId: string | null;
  onSelectRestaurant: (id: string | null) => void;
  userLocation: { lat: number; lng: number } | null;
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

export default function MapComponent({
  restaurants,
  selectedId,
  onSelectRestaurant,
  userLocation,
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

  // Determine map center
  const mapCenter = userLocation || KUALA_LUMPUR_CENTER;

  // Handle marker click
  const handleMarkerClick = (id: string) => {
    onSelectRestaurant(id);
  };

  // Handle map click
  const handleMapClick = () => {
    onSelectRestaurant(null);
  };

  // Handle info window close
  const handleInfoWindowClose = () => {
    onSelectRestaurant(null);
  };

  // Handle view details
  const handleViewDetails = (id: string) => {
    router.push(`/place/${id}`);
  };

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
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-800">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
        </div>
      )}

      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={KUALA_LUMPUR_CENTER}
          center={mapCenter}
          defaultZoom={DEFAULT_ZOOM}
          mapId="viral-food-map"
          disableDefaultUI={true}
          gestureHandling="greedy"
          onClick={handleMapClick}
          onLoad={() => setIsMapLoaded(true)}
          className="h-full w-full rounded-xl"
        >
          {/* User location marker */}
          {userLocation && (
            <AdvancedMarker position={userLocation}>
              <div className="relative">
                {/* Pulse animation */}
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-75"></div>
                {/* Blue dot */}
                <div className="relative h-4 w-4 rounded-full bg-blue-600 ring-2 ring-white"></div>
              </div>
            </AdvancedMarker>
          )}

          {/* Restaurant markers */}
          {mapMarkers.map((marker) => (
            <FoodMarker
              key={marker.id}
              place={marker}
              isSelected={marker.id === selectedId}
              onClick={() => handleMarkerClick(marker.id)}
            />
          ))}

          {/* Info window for selected restaurant */}
          {selectedRestaurant && (
            <MarkerInfoWindow
              restaurant={selectedRestaurant}
              onClose={handleInfoWindowClose}
              onViewDetails={handleViewDetails}
            />
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
