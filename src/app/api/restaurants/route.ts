import { NextRequest, NextResponse } from 'next/server';
import { Restaurant } from '@/types';

interface ApiResponse {
  data?: Restaurant[];
  source?: 'cache' | 'database';
  count?: number;
  error?: string;
}

// Simple in-memory cache (in production, use Redis or similar)
const cache = new Map<string, { data: Restaurant[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '5');
    const category = searchParams.get('category') || '';
    const priceRange = searchParams.get('priceRange') || '';
    const openNow = searchParams.get('openNow') || 'false';
    const halal = searchParams.get('halal') || 'false';

    // Build cache key including halal parameter
    const cacheKey = `restaurants:${lat}:${lng}:${radius}:${category}:${priceRange}:${openNow}:${halal}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        data: cached.data,
        source: 'cache',
        count: cached.data.length,
      } as ApiResponse);
    }

    // TODO: Replace with actual Supabase query
    // For now, using mock data structure
    let restaurants: Restaurant[] = [];

    // Apply distance filter
    if (lat && lng) {
      restaurants = restaurants.filter((r) => {
        const distance = calculateDistance(lat, lng, r.latitude, r.longitude);
        return distance <= radius;
      });
    }

    // Apply category filter
    if (category) {
      restaurants = restaurants.filter((r) => r.cuisine === category);
    }

    // Apply price range filter (if implemented)
    // if (priceRange) { ... }

    // Apply open now filter (if implemented)
    // if (openNow === 'true') { ... }

    // Apply halal filter AFTER all other filters
    if (halal === 'true') {
      restaurants = restaurants.filter((r) => r.isHalal);
    }

    // Store in cache
    cache.set(cacheKey, {
      data: restaurants,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      data: restaurants,
      source: 'database',
      count: restaurants.length,
    } as ApiResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An error occurred',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

