'use client';

import { FilterState } from '@/types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const priceRanges = [
    { label: '$', value: '1' },
    { label: '$$', value: '2' },
    { label: '$$$', value: '3' },
    { label: '$$$$', value: '4' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* Price Filters */}
      <div className="flex gap-2">
        {priceRanges.map((range) => (
          <button
            key={range.value}
            onClick={() => {
              // Toggle price range logic here
              onFilterChange({ ...filters });
            }}
            className="flex items-center gap-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-300 ease-out hover:border-teal-600 hover:bg-teal-50 hover:shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-teal-500 dark:hover:bg-teal-900/20"
          >
            <span>💰</span>
            {range.label}
          </button>
        ))}
      </div>

      {/* Halal Filter */}
      <button
        onClick={() => onFilterChange({ ...filters, halal: !filters.halal })}
        className={`flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ease-out ${
          filters.halal
            ? 'border-green-600 bg-green-600 text-white shadow-sm hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-green-600 hover:bg-green-50 hover:shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-green-500 dark:hover:bg-green-900/20'
        }`}
      >
        <span>✅</span>
        Halal Only
      </button>
    </div>
  );
}

