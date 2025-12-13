'use client';

import { useEffect, useState } from 'react';
import FilterBar from '@/components/FilterBar';
import HalalBadge from '@/components/HalalBadge';
import { FilterState, Restaurant } from '@/types';

interface ApiResponse {
  data?: Restaurant[];
  source?: 'cache' | 'database';
  count?: number;
  error?: string;
}

export default function Home() {
  const [filters, setFilters] = useState<FilterState>({
    cuisine: '',
    minRating: 0,
    halal: false,
  });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (err) => {
          console.error('Error getting location:', err);
          // Default to Kuala Lumpur coordinates if geolocation fails
          setLatitude(3.1390);
          setLongitude(101.6869);
        }
      );
    } else {
      // Default to Kuala Lumpur coordinates if geolocation not supported
      setLatitude(3.1390);
      setLongitude(101.6869);
    }
  }, []);

  // Fetch restaurants
  useEffect(() => {
    if (latitude === null || longitude === null) return;

    const restaurantsFetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          lat: latitude.toString(),
          lng: longitude.toString(),
          radius: '5',
          ...(filters.category && { category: filters.category }),
          ...(filters.priceRange && { priceRange: filters.priceRange }),
          ...(filters.openNow && { openNow: 'true' }),
          ...(filters.halal && { halal: 'true' }),
        });

        const response = await fetch(`/api/restaurants?${params}`);
        const data: ApiResponse = await response.json();

        if (data.error) {
          setError(data.error);
        } else if (data.data) {
          setRestaurants(data.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch restaurants');
      } finally {
        setLoading(false);
      }
    };

    restaurantsFetch();
  }, [latitude, longitude, filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0F172A]">
      <main className="container mx-auto px-4 py-6">
        {/* Filter Bar */}
        <div className="mb-4">
          <FilterBar filters={filters} onFilterChange={handleFilterChange} />
          
          {/* Halal Filter Active Badge */}
          {filters.halal && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-100 px-4 py-2 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <span>✅</span>
              <span>Halal Filter Active</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading restaurants...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-xl bg-red-50 p-6 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}

        {/* Restaurants List */}
        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.length === 0 ? (
              <div className="col-span-full rounded-xl bg-white p-6 text-center text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                No restaurants found. Try adjusting your filters.
              </div>
            ) : (
              restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="rounded-2xl bg-white p-6 shadow-sm transition-shadow duration-300 ease-out hover:shadow-md dark:bg-gray-800"
                >
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {restaurant.name}
                  </h3>
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    {restaurant.address}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
                      ⭐ {restaurant.rating}
                    </span>
                    <HalalBadge
                      isHalal={restaurant.isHalal}
                      certNumber={restaurant.halalCertNumber}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
