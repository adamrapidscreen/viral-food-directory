'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useMap } from '@vis.gl/react-google-maps';
import { Restaurant } from '@/types';
import HalalBadge from './HalalBadge';
import { useLazyImage } from '@/hooks/useLazyImage';

interface MarkerPopupProps {
  restaurant: Restaurant | null;
  onClose: () => void;
  onViewDetails: (id: string) => void;
}

// Category emoji mapping
const categoryEmoji: Record<Restaurant['category'], string> = {
  hawker: '🍜',
  restaurant: '🍽️',
  cafe: '☕',
  foodcourt: '🏪',
};

export default function MarkerPopup({
  restaurant,
  onClose,
  onViewDetails,
}: MarkerPopupProps) {
  const map = useMap();
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [mapContainer, setMapContainer] = useState<HTMLElement | null>(null);
  const prevPositionRef = useRef({ x: 0, y: 0 });

  const isTrending = restaurant ? restaurant.trendingScore > 75 : false;
  const thumbnailUrl = restaurant?.photos?.[0];
  
  // Use Intersection Observer to lazy load images
  const { imgRef, shouldLoad, imageError, setImageError } = useLazyImage(thumbnailUrl, {
    rootMargin: '0px',
    threshold: 0,
  });

  const distanceText = restaurant?.distance
    ? `${restaurant.distance.toFixed(1)} km`
    : '';

  // Get map container element for portal
  useEffect(() => {
    if (map) {
      const mapDiv = map.getDiv();
      if (mapDiv) {
        setMapContainer(mapDiv);
      }
    }
  }, [map]);

  // Calculate position using Google Maps projection
  useEffect(() => {
    if (!map || !restaurant || !mapContainer) {
      setIsVisible(false);
      return;
    }

    const updatePosition = () => {
      try {
        // Get the map's projection
        const projection = map.getProjection();
        if (!projection) {
          return;
        }

        // Convert lat/lng to pixel coordinates
        const latLng = new google.maps.LatLng(restaurant.lat, restaurant.lng);
        const pixel = projection.fromLatLngToContainerPixel(latLng);
        
        if (pixel) {
          // Calculate position - pixel coordinates are relative to map container
          const popupHeight = popupRef.current?.offsetHeight || 140;
          const offsetY = pixel.y - popupHeight - 20; // 20px for arrow spacing
          
          const newPosition = {
            x: pixel.x,
            y: Math.max(10, offsetY), // Ensure popup doesn't go above viewport
          };
          
          // Only update state if position actually changed (avoid unnecessary re-renders)
          const prevPos = prevPositionRef.current;
          if (Math.abs(prevPos.x - newPosition.x) > 0.5 || Math.abs(prevPos.y - newPosition.y) > 0.5) {
            prevPositionRef.current = newPosition;
            setPosition(newPosition);
          }
          
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error calculating popup position:', error);
        // Fallback: show popup at center of map if calculation fails
        const mapDiv = map.getDiv();
        if (mapDiv) {
          const rect = mapDiv.getBoundingClientRect();
          const fallbackPosition = {
            x: rect.width / 2,
            y: rect.height / 2 - 100,
          };
          const prevPos = prevPositionRef.current;
          if (Math.abs(prevPos.x - fallbackPosition.x) > 0.5 || Math.abs(prevPos.y - fallbackPosition.y) > 0.5) {
            prevPositionRef.current = fallbackPosition;
            setPosition(fallbackPosition);
          }
          setIsVisible(true);
        }
      }
    };

    // Wait for map to be ready and projection to be available
    const checkProjection = () => {
      const projection = map.getProjection();
      if (projection) {
        updatePosition();
      } else {
        // Retry after a short delay
        setTimeout(checkProjection, 50);
      }
    };

    // Initial check - try multiple times
    let attempts = 0;
    const maxAttempts = 20; // 20 attempts * 50ms = 1 second max wait
    
    const tryProjection = () => {
      attempts++;
      const projection = map.getProjection();
      if (projection) {
        updatePosition();
      } else if (attempts < maxAttempts) {
        setTimeout(tryProjection, 50);
      }
    };
    
    const timer = setTimeout(tryProjection, 50);

    // Track if we're currently dragging to optimize updates
    let isDragging = false;
    let rafId: number | null = null;

    // Update position on map events
    const updateHandler = map.addListener('bounds_changed', updatePosition);
    const idleHandler = map.addListener('idle', updatePosition);
    const zoomHandler = map.addListener('zoom_changed', updatePosition);
    const centerHandler = map.addListener('center_changed', updatePosition);
    
    // Add drag listeners for real-time updates during dragging
    const dragStartHandler = map.addListener('dragstart', () => {
      isDragging = true;
    });
    
    const dragHandler = map.addListener('drag', () => {
      // Use requestAnimationFrame for smooth 60fps updates during drag
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          updatePosition();
          rafId = null;
        });
      }
    });
    
    const dragEndHandler = map.addListener('dragend', () => {
      isDragging = false;
      // Cancel any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      // Final position update when drag ends
      updatePosition();
    });

    return () => {
      clearTimeout(timer);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (updateHandler) google.maps.event.removeListener(updateHandler);
      if (idleHandler) google.maps.event.removeListener(idleHandler);
      if (zoomHandler) google.maps.event.removeListener(zoomHandler);
      if (centerHandler) google.maps.event.removeListener(centerHandler);
      if (dragStartHandler) google.maps.event.removeListener(dragStartHandler);
      if (dragHandler) google.maps.event.removeListener(dragHandler);
      if (dragEndHandler) google.maps.event.removeListener(dragEndHandler);
      setIsVisible(false);
    };
  }, [map, restaurant]);

  if (!restaurant || !mapContainer) {
    return null;
  }

  // Show popup even if position isn't calculated yet (will update when ready)
  if (!isVisible && position.x === 0 && position.y === 0) {
    // Wait a bit for position calculation
    return null;
  }

  const categoryEmojiIcon = categoryEmoji[restaurant.category];

  const popupContent = (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="absolute z-[9999] pointer-events-auto"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translateX(-50%)', // Center horizontally on marker
          willChange: 'transform, opacity',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Popup Card */}
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-500/20 p-3 max-w-xs min-w-[280px]">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
            aria-label="Close"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex gap-3">
            {/* Thumbnail */}
            <div 
              ref={imgRef}
              className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-200"
            >
              {shouldLoad && thumbnailUrl && !imageError ? (
                <Image
                  src={thumbnailUrl}
                  alt={restaurant.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">
                  {categoryEmojiIcon}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Name */}
              <h3 className="line-clamp-1 font-semibold text-slate-900 text-sm">
                {restaurant.name}
              </h3>

              {/* Category + Distance */}
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span className="capitalize">{restaurant.category}</span>
                {distanceText && (
                  <>
                    <span>•</span>
                    <span>{distanceText}</span>
                  </>
                )}
              </div>

              {/* Rating + Badges row */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/* Rating */}
                {restaurant.aggregateRating != null && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-amber-500">
                      ⭐ {restaurant.aggregateRating.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Halal Badge */}
                <HalalBadge
                  isHalal={restaurant.isHalal}
                  certNumber={restaurant.halalCertNumber}
                  size="sm"
                />

                {/* Trending Badge - Red highlight */}
                {isTrending && (
                  <span className="inline-flex items-center rounded-xl bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/30">
                    🔥 Trending
                  </span>
                )}
              </div>

              {/* View Details Button */}
              <button
                onClick={() => onViewDetails(restaurant.id)}
                className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 active:scale-95"
              >
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* Arrow pointing down */}
        <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white/95" />
        <div className="absolute bottom-[-9px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-emerald-500/20" />
      </motion.div>
    </AnimatePresence>
  );

  // Render popup in map container using portal
  return createPortal(popupContent, mapContainer);
}
