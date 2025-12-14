'use client';

import { useState, useEffect } from 'react';
import { FilterState } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onNearMeClick?: () => void;
}

const categories = [
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'cafe', label: 'Cafe', icon: '☕' },
] as const;

export default function FilterBar({ filters, onFilterChange, onNearMeClick }: FilterBarProps) {
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
      // Call the custom handler if provided
      onNearMeClick();
    } else {
      // Fallback to just toggling the filter
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
    <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 py-3">
      {/* Mobile: Search bar on its own row */}
      <div className="mb-3 px-4 md:hidden">
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search nasi lemak, cafe..."
            className="w-full rounded-full bg-gray-100 py-2 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-800 dark:text-gray-50 dark:placeholder:text-gray-400 dark:focus:bg-slate-700"
          />
          {searchValue && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Desktop: Search bar left-aligned, filters right-aligned */}
      <div className="hidden items-center gap-4 px-4 md:flex">
        <div className="relative w-64">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search nasi lemak, cafe..."
            className="w-full rounded-full bg-gray-100 py-2 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-800 dark:text-gray-50 dark:placeholder:text-gray-400 dark:focus:bg-slate-700"
          />
          {searchValue && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex-1 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-2 px-4 whitespace-nowrap min-w-max">
        {/* Near Me */}
        <button
          onClick={handleNearMeToggle}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
            filters.nearMe
              ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600'
              : 'border border-gray-300 bg-white text-gray-600 hover:border-teal-600 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-teal-500 dark:hover:bg-teal-900/20'
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
              ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600'
              : 'border border-gray-300 bg-white text-gray-600 hover:border-teal-600 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-teal-500 dark:hover:bg-teal-900/20'
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
                ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600'
                : 'border border-gray-300 bg-white text-gray-600 hover:border-teal-600 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-teal-500 dark:hover:bg-teal-900/20'
            }`}
            aria-label={`Filter by ${cat.label}`}
            aria-pressed={filters.category === cat.value}
          >
            <span>{cat.icon}</span>
            <span className="hidden sm:inline">{cat.label}</span>
          </button>
        ))}

        {/* Halal Filter - GREEN when active */}
        <button
          onClick={handleHalalToggle}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
            filters.halal
              ? 'bg-green-600 text-white shadow-sm hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
              : 'border border-gray-300 bg-white text-gray-600 hover:border-green-600 hover:bg-green-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-green-500 dark:hover:bg-green-900/20'
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

      {/* Mobile: Filters scrollable row */}
      <div className="overflow-x-auto scrollbar-hide md:hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex gap-2 px-4 whitespace-nowrap min-w-max">
        {/* Near Me */}
        <button
          onClick={handleNearMeToggle}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
            filters.nearMe
              ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600'
              : 'border border-gray-300 bg-white text-gray-600 hover:border-teal-600 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-teal-500 dark:hover:bg-teal-900/20'
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
              ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600'
              : 'border border-gray-300 bg-white text-gray-600 hover:border-teal-600 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-teal-500 dark:hover:bg-teal-900/20'
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
                ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600'
                : 'border border-gray-300 bg-white text-gray-600 hover:border-teal-600 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-teal-500 dark:hover:bg-teal-900/20'
            }`}
            aria-label={`Filter by ${cat.label}`}
            aria-pressed={filters.category === cat.value}
          >
            <span>{cat.icon}</span>
            <span className="hidden sm:inline">{cat.label}</span>
          </button>
        ))}

        {/* Halal Filter - GREEN when active */}
        <button
          onClick={handleHalalToggle}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
            filters.halal
              ? 'bg-green-600 text-white shadow-sm hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
              : 'border border-gray-300 bg-white text-gray-600 hover:border-green-600 hover:bg-green-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-green-500 dark:hover:bg-green-900/20'
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
  );
}
