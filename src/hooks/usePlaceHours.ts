import { useMemo } from 'react';
import { useHoursCache } from '@/contexts/HoursContext';
import { formatOpenStatus, getSimpleOpenStatus } from '@/utils/formatHours';
import { getDefaultHours } from '@/utils/defaultHours';

export const usePlaceHours = (
  placeId: string | null, 
  restaurantName?: string, 
  types?: string[]
) => {
  const cache = useHoursCache();

  const { hours, status, isEstimated } = useMemo(() => {
    // 1. Check cache first
    if (placeId && cache[placeId]) {
      const hoursData = cache[placeId];
      
      // If Google had no hours, use smart defaults
      if (hoursData.unavailable && restaurantName) {
        const defaultHours = getDefaultHours(restaurantName, types);
        return {
          hours: defaultHours,
          status: formatOpenStatus(defaultHours),
          isEstimated: true,
        };
      }
      
      return {
        hours: hoursData,
        status: formatOpenStatus(hoursData),
        isEstimated: false,
      };
    }
    
    // 2. Not in cache at all - use smart defaults
    if (restaurantName) {
      const defaultHours = getDefaultHours(restaurantName, types);
      return {
        hours: defaultHours,
        status: formatOpenStatus(defaultHours),
        isEstimated: true,
      };
    }
    
    return { hours: null, status: 'Hours Not Listed', isEstimated: false };
  }, [placeId, cache, restaurantName, types]);

  return { hours, status, loading: false, isEstimated };
};
