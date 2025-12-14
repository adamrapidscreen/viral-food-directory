'use client';

import { X } from 'lucide-react';
import Map from './Map';
import { Restaurant } from '@/types';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  selectedId: string | null;
  hoveredId?: string | null;
  onSelectRestaurant: (id: string | null) => void;
  onHoverRestaurant?: (id: string | null) => void;
  userLocation: { lat: number; lng: number } | null;
  centerRestaurantId?: string | null;
  center?: { lat: number; lng: number };
}

export default function MapModal({
  isOpen,
  onClose,
  restaurants,
  selectedId,
  hoveredId,
  onSelectRestaurant,
  onHoverRestaurant,
  userLocation,
  centerRestaurantId,
  center,
}: MapModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative h-full w-full flex flex-col">
        {/* Header */}
        <div className="glass border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Map View</h2>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-surface-solid/50 hover:text-slate-200"
              aria-label="Close map"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map
            restaurants={restaurants}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelectRestaurant={onSelectRestaurant}
            onHoverRestaurant={onHoverRestaurant}
            userLocation={userLocation}
            centerRestaurantId={centerRestaurantId}
            center={center}
          />
        </div>
      </div>
    </div>
  );
}
