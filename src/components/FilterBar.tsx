'use client';

import { useState, useEffect, useRef } from 'react';
import { FilterState } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { SlidersHorizontal, Check, Sparkles } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onNearMeClick?: () => void;
  view?: 'map' | 'list';
  onViewToggle?: () => void;
  isDrawerOpen?: boolean; // For mobile: hide filter buttons when drawer is open
}

const categories = [
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'cafe', label: 'Cafe', icon: '☕' },
] as const;

const filterOptions = [
  { id: 'nearMe', label: 'Near Me', icon: '📍' },
  { id: 'openNow', label: 'Open Now', icon: '🕐' },
  { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { id: 'cafe', label: 'Cafe', icon: '☕' },
  { id: 'halal', label: 'Halal Only', icon: '✅' },
] as const;

export default function FilterBar({ 
  filters, 
  onFilterChange, 
  onNearMeClick,
  view = 'map',
  onViewToggle,
  isDrawerOpen = false,
}: FilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.searchQuery || '');
  const debouncedSearch = useDebounce(searchValue, 300);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Toggle editorial picks filter
  const handleEditorialPicksToggle = () => {
    onFilterChange({ ...filters, editorialPicks: !filters.editorialPicks });
  };

  // Get active filters count (excluding editorialPicks as it has its own button)
  const activeFilters = [
    filters.nearMe && 'nearMe',
    filters.openNow && 'openNow',
    filters.category && filters.category,
    filters.halal && 'halal',
  ].filter(Boolean) as string[];

  // Toggle filter from dropdown
  const toggleFilter = (filterId: string) => {
    if (filterId === 'nearMe') {
      handleNearMeToggle();
    } else if (filterId === 'openNow') {
      handleOpenNowToggle();
    } else if (filterId === 'restaurant' || filterId === 'cafe') {
      handleCategoryChange(filterId);
    } else if (filterId === 'halal') {
      handleHalalToggle();
    }
  };

  // Check if filter is active
  const isFilterActive = (filterId: string): boolean => {
    if (filterId === 'nearMe') return filters.nearMe;
    if (filterId === 'openNow') return filters.openNow;
    if (filterId === 'restaurant' || filterId === 'cafe') return filters.category === filterId;
    if (filterId === 'halal') return filters.halal;
    return false;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    };

    if (filtersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [filtersOpen]);

  // Clear all filters (excluding editorialPicks as it has its own button)
  const handleClearAll = () => {
    onFilterChange({
      ...filters,
      nearMe: false,
      openNow: false,
      category: null,
      halal: false,
    });
  };

  return (
    <div className="w-full">
      {/* Floating Search Bar Island */}
      <div className="w-full">
        <div className="search-bar relative flex items-center rounded-full shadow-xl border-0 w-full bg-[#022c22] backdrop-blur-sm border border-[#34d399]/20">
          {/* Search Icon - Left */}
          <div className="absolute left-5 pointer-events-none text-slate-300">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search..."
            className="h-14 rounded-full pl-14 pr-44 text-sm md:text-base text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-0 truncate"
            style={{
              flex: 1,
              minWidth: 0,
              width: '100%',
              backgroundColor: 'transparent',
              outline: 'none',
              border: 'none',
              color: 'white',
            }}
          />

          {/* Right Side: Clear Button + Map View Toggle */}
          <div className="absolute right-3 flex items-center gap-2">
            {/* Clear Search Button */}
            {searchValue && (
              <button
                onClick={handleClearSearch}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-[#34d399]/20 hover:text-slate-100"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Map View Toggle - Hidden on desktop (both views visible), shown on mobile */}
            {onViewToggle && (
              <button
                onClick={onViewToggle}
                className="md:hidden h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-all bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 hover:text-emerald-300"
                aria-label={`Switch to ${view === 'map' ? 'list' : 'map'} view`}
              >
                <span className="text-base">{view === 'map' ? '📍' : '📋'}</span>
                <span className="font-semibold">{view === 'map' ? 'Map' : 'List'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile: Horizontal Scrollable Filter Buttons */}
        {!isDrawerOpen && (
        <div 
          className="md:hidden mt-4 pb-3 filter-buttons-scroll"
          style={{
            overflowX: 'auto',
            overflowY: 'visible',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <div 
            style={{
              display: 'flex',
              gap: '8px',
              paddingLeft: '16px',
              paddingRight: '16px',
              width: 'max-content',
            }}
          >
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
                  isFilterActive(filter.id)
                    ? 'bg-emerald-500 text-white border-[#34d399]'
                    : 'bg-[#f8fafc] text-black border-[#34d399] hover:bg-[#34d399]/10'
                }`}
                aria-label={`Filter by ${filter.label}`}
                aria-pressed={isFilterActive(filter.id)}
              >
                <span className="flex items-center gap-1.5">
                  <span>{filter.icon}</span>
                  <span>{filter.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Desktop: Editorial Picks & Filter Buttons */}
        <div className="hidden md:flex items-center gap-3 mt-4 mb-2">
          {/* Editorial Picks Button */}
          <button
            onClick={handleEditorialPicksToggle}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full shadow-lg transition-all relative overflow-hidden ${
              filters.editorialPicks
                ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                : 'bg-gradient-to-r from-amber-600/80 to-yellow-600/80 text-white hover:from-amber-500 hover:to-yellow-500'
            }`}
            aria-label="Toggle editor's picks"
            aria-pressed={filters.editorialPicks}
          >
            {/* Shine effect overlay - only when active */}
            {filters.editorialPicks && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine pointer-events-none" />
            )}
            <Sparkles className={`w-4 h-4 text-white relative z-10 ${filters.editorialPicks ? 'drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]' : ''}`} />
            <span className="font-semibold relative z-10">Editor's Picks</span>
            {filters.editorialPicks && (
              <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full relative z-10 font-bold">
                70
              </span>
            )}
          </button>

          {/* Filters Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#022c22] text-white rounded-full shadow-lg hover:bg-[#064e3b] transition-all"
              aria-label="Toggle filters"
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="w-4 h-4 text-white" />
              <span>Filters</span>
              {activeFilters.length > 0 && (
                <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFilters.length}
                </span>
              )}
            </button>
          
          {/* Dropdown menu */}
          {filtersOpen && (
            <div 
              className="absolute top-full mt-2 bg-[#022c22]/95 backdrop-blur-xl border border-[#34d399]/20 shadow-2xl shadow-emerald-950/50 rounded-2xl p-3 z-50 min-w-[200px] origin-top-left animate-fade-in-slide-down"
            >
              {filterOptions.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors font-medium text-sm ${
                    isFilterActive(filter.id)
                      ? 'text-white bg-white/20'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                  aria-label={`Toggle ${filter.label} filter`}
                  aria-pressed={isFilterActive(filter.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#34d399]">{filter.icon}</span>
                    <span>{filter.label}</span>
                  </div>
                  {isFilterActive(filter.id) && (
                    <Check className="w-4 h-4 text-[#34d399] flex-shrink-0" />
                  )}
                </button>
              ))}
              
              {activeFilters.length > 0 && (
                <>
                  <div className="border-t border-[#34d399]/30 my-2" />
                  <button
                    onClick={handleClearAll}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-red-400 hover:bg-white/10 cursor-pointer transition-colors font-medium text-sm"
                    aria-label="Clear all filters"
                  >
                    <span>Clear All</span>
                  </button>
                </>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
