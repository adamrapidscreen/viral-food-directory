import { FilterState } from '@/types';

/**
 * Build query string for restaurants API
 */
export function buildRestaurantQuery(
  filters: FilterState,
  location: { lat: number; lng: number } | null
): string {
  const params = new URLSearchParams();

  if (location) {
    params.append('lat', location.lat.toString());
    params.append('lng', location.lng.toString());
  }

  params.append('radius', '5');

  if (filters.category) {
    params.append('category', filters.category);
  }

  if (filters.priceRange) {
    params.append('priceRange', filters.priceRange);
  }

  if (filters.openNow) {
    params.append('openNow', 'true');
  }

  if (filters.halal) {
    params.append('halal', 'true');
  }

  if (filters.searchQuery && filters.searchQuery.trim()) {
    params.append('searchQuery', filters.searchQuery.trim());
  }

  return params.toString();
}
