'use client';

import { FilterState } from '@/types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const categories = [
  { value: 'hawker', label: '🍜 Hawker', icon: '🍜' },
  { value: 'restaurant', label: '🍽️ Restaurant', icon: '🍽️' },
  { value: 'cafe', label: '☕ Cafe', icon: '☕' },
  { value: 'foodcourt', label: '🏪 Foodcourt', icon: '🏪' },
] as const;

const priceRanges = [
  { value: '$', label: '💰 Budget ($)' },
  { value: '$$', label: '💰💰 Mid ($$)' },
  { value: '$$$', label: '💰💰💰 Premium ($$$+)' },
] as const;

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  // Toggle near me
  const handleNearMeToggle = () => {
    onFilterChange({ ...filters, nearMe: !filters.nearMe });
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

  // Handle price range filter (mutually exclusive)
  const handlePriceRangeChange = (priceRange: string) => {
    onFilterChange({
      ...filters,
      priceRange: filters.priceRange === priceRange ? null : priceRange,
    });
  };

  // Toggle halal filter
  const handleHalalToggle = () => {
    onFilterChange({ ...filters, halal: !filters.halal });
  };

  return (
    <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 py-3 backdrop-blur-md dark:border-gray-700 dark:bg-slate-900/80">
      <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
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
            <span className="sm:hidden">{cat.icon}</span>
          </button>
        ))}

        {/* Price Range Filters */}
        {priceRanges.map((price) => (
          <button
            key={price.value}
            onClick={() => handlePriceRangeChange(price.value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              filters.priceRange === price.value
                ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600'
                : 'border border-gray-300 bg-white text-gray-600 hover:border-teal-600 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-teal-500 dark:hover:bg-teal-900/20'
            }`}
            aria-label={`Filter by ${price.label}`}
            aria-pressed={filters.priceRange === price.value}
          >
            <span>{price.label}</span>
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
  );
}
