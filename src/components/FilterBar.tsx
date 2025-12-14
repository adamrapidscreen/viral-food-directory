'use client';

import { useState, useEffect } from 'react';
import { FilterState } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onNearMeClick?: () => void;
  view?: 'map' | 'list';
  onViewToggle?: () => void;
}

const categories = [
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'cafe', label: 'Cafe', icon: '☕' },
] as const;

export default function FilterBar({ 
  filters, 
  onFilterChange, 
  onNearMeClick,
  view = 'map',
  onViewToggle,
}: FilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.searchQuery || '');
  const debouncedSearch = useDebounce(searchValue, 300);

  // Sync searchValue with filters.searchQuery when it changes externally
  useEffect(() => {
    if (filters.searchQuery !== searchValue) {
      setSearchValue(filters.searchQuery || '');
    }
  }, [filters.searchQuery]);

  // Update searchQuery when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== filters.searchQuery) {
      onFilterChange({ ...filters, searchQuery: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchValue('');
    onFilterChange({ ...filters, searchQuery: '' });
  };

  // Handle near me click
  const handleNearMeToggle = () => {
    if (onNearMeClick) {
      onNearMeClick();
    } else {
      onFilterChange({ ...filters, nearMe: !filters.nearMe });
    }
  };

  // Toggle open now
  const handleOpenNowToggle = () => {
    onFilterChange({ ...filters, openNow: !filters.openNow });
  };

  // Handle category filter (mutually exclusive)
  const handleCategoryChange = (category: string) => {
    onFilterChange({
      ...filters,
      category: filters.category === category ? null : category,
    });
  };

  // Toggle halal filter
  const handleHalalToggle = () => {
    onFilterChange({ ...filters, halal: !filters.halal });
  };

  return (
    <div className="sticky top-4 z-40 px-4">
      {/* Floating Search Bar Island */}
      <div className="mx-auto max-w-2xl">
        <div className="glass relative flex items-center rounded-full shadow-xl border border-white/10">
          {/* Search Icon - Left */}
          <div className="absolute left-5 pointer-events-none text-slate-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search nasi lemak, cafe..."
            className="h-14 w-full rounded-full bg-transparent pl-14 pr-32 text-base text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />

          {/* Right Side: Clear Button + Map View Toggle */}
          <div className="absolute right-3 flex items-center gap-2">
            {/* Clear Search Button */}
            {searchValue && (
              <button
                onClick={handleClearSearch}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-surface-solid/50 hover:text-slate-200"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Map View Toggle - Hidden on mobile (use FAB button instead) */}
            {onViewToggle && (
              <button
                onClick={onViewToggle}
                className="hidden md:flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-all bg-surface-solid/50 text-slate-300 hover:bg-surface-solid"
                aria-label={`Switch to ${view === 'map' ? 'list' : 'map'} view`}
              >
                <span>{view === 'map' ? '📍' : '📋'}</span>
                <span className="hidden sm:inline">{view === 'map' ? 'Map' : 'List'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips - Below Search Bar */}
        <div className="mt-4 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-2 px-2 whitespace-nowrap min-w-max">
            {/* Near Me */}
            <button
              onClick={handleNearMeToggle}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                filters.nearMe
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-surface-solid/50 text-slate-300 hover:bg-surface-solid'
              }`}
              aria-label="Filter by nearby locations"
              aria-pressed={filters.nearMe}
            >
              <span>📍</span>
              <span>Near Me</span>
            </button>

            {/* Open Now */}
            <button
              onClick={handleOpenNowToggle}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                filters.openNow
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-surface-solid/50 text-slate-300 hover:bg-surface-solid'
              }`}
              aria-label="Filter by open restaurants"
              aria-pressed={filters.openNow}
            >
              <span>🕐</span>
              <span>Open Now</span>
            </button>

            {/* Category Filters */}
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  filters.category === cat.value
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'bg-surface-solid/50 text-slate-300 hover:bg-surface-solid'
                }`}
                aria-label={`Filter by ${cat.label}`}
                aria-pressed={filters.category === cat.value}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}

            {/* Halal Filter */}
            <button
              onClick={handleHalalToggle}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                filters.halal
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-surface-solid/50 text-slate-300 hover:bg-surface-solid'
              }`}
              aria-label="Filter by halal restaurants"
              aria-pressed={filters.halal}
            >
              <span>✅</span>
              <span>Halal Only</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
