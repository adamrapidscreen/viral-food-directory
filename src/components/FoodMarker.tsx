'use client';

import { memo } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapMarker, Restaurant } from '@/types';
import { UtensilsCrossed, Coffee } from 'lucide-react';
import { getTripAdvisorData } from '@/services/tripAdvisor';

interface FoodMarkerProps {
  place: MapMarker;
  restaurant: Restaurant | null;
  isSelected: boolean;
  isHovered?: boolean;
  onClick: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
}

// Category icon mapping using Lucide React icons
const categoryIcons: Record<'restaurant' | 'cafe', React.ComponentType<{ className?: string }>> = {
  restaurant: UtensilsCrossed,
  cafe: Coffee,
};

function FoodMarker({
  place,
  restaurant,
  isSelected,
  isHovered,
  onClick,
  onHover,
  onHoverEnd,
}: FoodMarkerProps) {
  // Use restaurant icon as fallback for hawker/foodcourt
  const CategoryIcon = categoryIcons[place.category] || categoryIcons.restaurant;
  
  // Get price data for active state
  const tripAdvisorData = restaurant ? getTripAdvisorData(restaurant.name) : null;
  const displayPriceText = tripAdvisorData?.priceText || restaurant?.tripAdvisorPriceText;
  
  // Extract first price value (e.g., "RM 15 - RM 25" -> "RM 15")
  const pricePillText = displayPriceText 
    ? displayPriceText.split('-')[0].trim() 
    : null;

  return (
    <AdvancedMarker
      position={{ lat: place.lat, lng: place.lng }}
      onClick={onClick}
    >
      <div
        className={`relative flex items-center justify-center transition-all duration-300 ease-out cursor-pointer ${
          isHovered ? 'scale-[1.2]' : 'scale-100'
        }`}
        style={{ width: '32px', height: '32px' }}
        onMouseEnter={onHover}
        onMouseLeave={onHoverEnd}
      >
        {/* Minimal Pin Circle */}
        <div
          className={`flex items-center justify-center rounded-full border-2 border-white transition-all duration-300 ${
            isHovered ? 'bg-black' : 'bg-[#022c22]'
          } ${isSelected ? 'ring-2 ring-[#34d399] ring-offset-1' : ''}`}
          style={{
            width: '32px',
            height: '32px',
          }}
        >
          {/* Active State: Show Price Pill */}
          {isSelected && pricePillText ? (
            <span className="text-[10px] font-medium text-white px-1.5 py-0.5 whitespace-nowrap">
              {pricePillText}
            </span>
          ) : (
            /* Default State: Show Category Icon */
            <CategoryIcon className="w-4 h-4 text-white" />
          )}
        </div>
      </div>
    </AdvancedMarker>
  );
}

// Memoize the component to prevent unnecessary re-renders
// Returns true if props are equal (skip re-render), false if different (re-render)
export default memo(FoodMarker, (prevProps, nextProps) => {
  // Check if all relevant props are equal - if so, skip re-render
  const propsEqual = 
    prevProps.place.id === nextProps.place.id &&
    prevProps.place.lat === nextProps.place.lat &&
    prevProps.place.lng === nextProps.place.lng &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.restaurant?.id === nextProps.restaurant?.id &&
    prevProps.restaurant?.tripAdvisorPriceText === nextProps.restaurant?.tripAdvisorPriceText;
  
  return propsEqual; // true = skip re-render, false = re-render
});
