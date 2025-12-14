import axios from 'axios';
import * as fs from 'fs';
import path from 'path';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const CACHE_PATH = path.join(process.cwd(), 'src/data/hoursCache.json');
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

interface CachedHours {
  weekdayText: string[];
  periods: any[];
  cachedAt: string;
}

// Read cache from file
const getCache = (): Record<string, CachedHours> => {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading hours cache:', e);
  }
  return {};
};

// Server-side function to get cached hours by place ID
export const getCachedHours = (placeId: string) => {
  try {
    const cache = getCache();
    return cache[placeId] || null;
  } catch (e) {
    console.error('Error reading cached hours:', e);
    return null;
  }
};

// Write cache to file
const saveCache = (cache: Record<string, CachedHours>) => {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error('Error saving hours cache:', e);
  }
};

// Check if cache entry is still valid
const isCacheValid = (entry: any): boolean => {
  // Permanent entries never expire
  if (entry.permanent) return true;
  
  const cachedTime = new Date(entry.cachedAt).getTime();
  return Date.now() - cachedTime < CACHE_DURATION;
};

export const getPlaceHours = async (placeId: string): Promise<CachedHours | null> => {
  if (!placeId) {
    return null;
  }

  const cache = getCache();
  
  // 1. Check cache first
  if (cache[placeId] && isCacheValid(cache[placeId])) {
    console.log(`⚡ Hours cache hit: ${placeId}`);
    return cache[placeId];
  }
  
  // 2. Fetch from Google if not cached
  console.log(`🌐 Fetching hours from Google: ${placeId}`);
  try {
    if (!API_KEY) {
      console.error('Google Maps API key not configured');
      return null;
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          fields: 'opening_hours',
          key: API_KEY,
        },
      }
    );

    const hours = response.data.result?.opening_hours;
    if (!hours) return null;

    // 3. Save to cache
    const cacheEntry: CachedHours = {
      weekdayText: hours.weekday_text || [],
      periods: hours.periods || [],
      cachedAt: new Date().toISOString(),
    };
    
    cache[placeId] = cacheEntry;
    saveCache(cache);
    
    return cacheEntry;
  } catch (error) {
    console.error('Google API Error:', error);
    return null;
  }
};
