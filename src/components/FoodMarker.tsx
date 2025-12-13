'use client';

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapMarker } from '@/types';

interface FoodMarkerProps {
  place: MapMarker;
  isSelected: boolean;
  onClick: () => void;
}

// Category emoji mapping
const categoryEmoji: Record<MapMarker['category'], string> = {
  hawker: '🍜',
  restaurant: '🍽️',
  cafe: '☕',
  foodcourt: '🏪',
};

// Get marker color based on rating and trending score
function getMarkerColor(place: MapMarker): string {
  if (place.trendingScore > 75) {
    return '#EC4899'; // Pink
  }
  if (place.rating >= 4.5) {
    return '#0D9488'; // Teal
  }
  if (place.rating >= 4.0) {
    return '#10B981'; // Green
  }
  return '#F59E0B'; // Amber
}

export default function FoodMarker({
  place,
  isSelected,
  onClick,
}: FoodMarkerProps) {
  const color = getMarkerColor(place);
  const emoji = categoryEmoji[place.category];
  const showFireBadge = place.trendingScore > 75;
  const showHalalRing = place.isHalal;

  return (
    <AdvancedMarker
      position={{ lat: place.lat, lng: place.lng }}
      onClick={onClick}
    >
      <div
        className={`relative flex items-center justify-center transition-all duration-300 ease-out ${
          isSelected ? 'scale-125' : 'scale-100 hover:scale-110'
        } ${isSelected ? 'ring-2 ring-teal-600 ring-offset-2' : ''}`}
        style={{ width: '48px', height: '48px' }}
      >
        {/* Halal ring */}
        {showHalalRing && (
          <div
            className="absolute inset-0 rounded-full border-2 border-green-600"
            style={{ width: '48px', height: '48px' }}
          />
        )}

        {/* Main circular pin */}
        <div
          className="flex items-center justify-center rounded-full text-2xl shadow-md"
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: color,
          }}
        >
          {emoji}
        </div>

        {/* Fire badge for trending */}
        {showFireBadge && (
          <div
            className="absolute -right-1 -top-1 flex items-center justify-center rounded-full bg-pink-500 text-xs"
            style={{ width: '20px', height: '20px' }}
          >
            🔥
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
}
