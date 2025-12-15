'use client';

import { FilterState } from '@/types';
import FilterBar from './FilterBar';
import RestaurantCard from './RestaurantCard';
import RestaurantCardSkeleton from './RestaurantCardSkeleton';
import { Restaurant } from '@/types';
import { AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onNearMeClick: () => void;
  onClearHalal: () => void;
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  hoveredId: string | null;
  onCardClick: (id: string) => void;
  onCardHover: (id: string | null) => void;
  getEmptyMessage: () => string;
  listContainerRef: React.RefObject<HTMLDivElement>;
  selectedCardRef: React.RefObject<HTMLDivElement>;
}

export default function BottomSheet({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  onNearMeClick,
  onClearHalal,
  restaurants,
  loading,
  error,
  selectedId,
  hoveredId,
  onCardClick,
  onCardHover,
  getEmptyMessage,
  listContainerRef,
  selectedCardRef,
}: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction="bottom" dismissible={true}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-3xl bg-pearl/90 backdrop-blur-xl border-t border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
          {/* Accessibility: Title and Description (visually hidden but available to screen readers) */}
          <Drawer.Title className="sr-only">Restaurants List</Drawer.Title>
          <Drawer.Description className="sr-only">
            Browse and filter restaurants. Swipe down or click outside to close.
          </Drawer.Description>

          {/* Drag Handle */}
          <div className="flex-shrink-0 flex items-center justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-gray-400" />
          </div>

          {/* Search Bar Header - Fixed at Top */}
          <div className="flex-shrink-0 px-4 pb-2">
            <FilterBar
              filters={filters}
              onFilterChange={onFilterChange}
              onNearMeClick={onNearMeClick}
              view="map"
            />

            {/* Halal Filter Badge */}
            {filters.halal && (
              <div className="mt-3 flex items-center justify-between rounded-xl px-4 py-2 text-sm font-medium text-emerald-400 border border-emerald-500/20 bg-emerald-500/10">
                <span>✅ Showing Halal Restaurants Only</span>
                <button
                  onClick={onClearHalal}
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
            className="flex-1 overflow-y-auto px-4 pb-4 space-y-4"
            style={{ 
              WebkitOverflowScrolling: 'touch',
            }}
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
                    onMouseEnter={() => onCardHover(restaurant.id)}
                    onMouseLeave={() => onCardHover(null)}
                  >
                    <RestaurantCard
                      restaurant={restaurant}
                      isSelected={restaurant.id === selectedId}
                      isHovered={restaurant.id === hoveredId}
                      onClick={() => onCardClick(restaurant.id)}
                      index={index}
                    />
                  </div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
