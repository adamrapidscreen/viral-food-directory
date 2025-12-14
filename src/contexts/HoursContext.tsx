'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HoursCache {
  [placeId: string]: {
    weekdayText: string[];
    periods: any[];
    permanent?: boolean;
    unavailable?: boolean;
    cachedAt?: string;
  };
}

const HoursContext = createContext<HoursCache>({});

export const useHoursCache = () => useContext(HoursContext);

export const HoursProvider = ({ children }: { children: ReactNode }) => {
  const [cache, setCache] = useState<HoursCache>({});

  useEffect(() => {
    // Load ALL hours once on app start
    fetch('/api/hours')
      .then(res => res.json())
      .then(data => {
        console.log(`✅ Loaded ${Object.keys(data).length} hours from cache`);
        setCache(data);
      })
      .catch((error) => {
        console.error('Error loading hours cache:', error);
        setCache({});
      });
  }, []);

  return (
    <HoursContext.Provider value={cache}>
      {children}
    </HoursContext.Provider>
  );
};
