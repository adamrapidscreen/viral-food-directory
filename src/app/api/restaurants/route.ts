import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { calculateDistance, isOpenNow } from '@/lib/utils';
import { Restaurant, ApiResponse } from '@/types';

// In-memory cache with TTL
interface CacheEntry {
  data: Restaurant[];
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Transform database row to Restaurant interface
function transformRestaurant(row: any): Restaurant {
  // Calculate aggregateRating with fallback logic
  let aggregateRating = row.aggregate_rating;
  if (aggregateRating == null) {
    // Fallback: use googleRating or tripadvisorRating if available
    if (row.google_rating != null) {
      aggregateRating = row.google_rating;
    } else if (row.tripadvisor_rating != null) {
      aggregateRating = row.tripadvisor_rating;
    } else {
      // Default to 0 if no rating is available
      aggregateRating = 0;
    }
  }

  return {
    id: row.id,
    name: row.name,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    category: row.category,
    googleRating: row.google_rating ?? undefined,
    tripadvisorRating: row.tripadvisor_rating ?? undefined,
    aggregateRating,
    mustTryDish: row.must_try_dish,
    mustTryConfidence: row.must_try_confidence,
    priceRange: row.price_range,
    operatingHours: row.operating_hours || {},
    viralMentions: row.viral_mentions,
    trendingScore: row.trending_score,
    photos: row.photos || [],
    isHalal: row.is_halal,
    halalCertified: row.halal_certified ?? undefined,
    halalCertNumber: row.halal_cert_number ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 5;
    const category = searchParams.get('category') || null;
    const priceRange = searchParams.get('priceRange') || null;
    const openNow = searchParams.get('openNow') === 'true';
    const halal = searchParams.get('halal') === 'true';
    const searchQuery = searchParams.get('searchQuery') || null;

    // Build cache key (include searchQuery)
    const cacheKey = `restaurants:${lat}:${lng}:${radius}:${category}:${priceRange}:${openNow}:${halal}:${searchQuery || ''}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return NextResponse.json({
        data: cached.data,
        source: 'cache',
        count: cached.data.length,
      } as ApiResponse<Restaurant[]>);
    }

    // Query Supabase
    const supabase = createClient();
    let query = supabase.from('restaurants').select('*');

    // Apply search filter FIRST (before other filters)
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery.trim()}%`;
      // Use .or() with PostgREST syntax: column.operator.value,column.operator.value
      query = query.or(
        `name.ilike.${searchTerm},category.ilike.${searchTerm},must_try_dish.ilike.${searchTerm}`
      );
    }

    const { data: restaurantsData, error: dbError } = await query
      .order('trending_score', { ascending: false })
      .limit(50);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!restaurantsData) {
      throw new Error('No data returned from database');
    }

    // Transform and calculate distances
    let restaurants: Restaurant[] = restaurantsData.map((row) => {
      const restaurant = transformRestaurant(row);
      
      // Calculate distance if lat/lng provided
      if (lat !== null && lng !== null) {
        restaurant.distance = calculateDistance(lat, lng, restaurant.lat, restaurant.lng);
      }
      
      return restaurant;
    });

    // Apply filters in order:
    // a. Filter by distance (radius)
    if (lat !== null && lng !== null) {
      restaurants = restaurants.filter((r) => {
        return r.distance !== undefined && r.distance <= radius;
      });
    }

    // b. Filter by category if provided
    if (category) {
      restaurants = restaurants.filter((r) => r.category === category);
    }

    // c. Filter by priceRange if provided
    if (priceRange) {
      restaurants = restaurants.filter((r) => r.priceRange === priceRange);
    }

    // d. Filter by openNow if true
    if (openNow) {
      restaurants = restaurants.filter((r) => isOpenNow(r.operatingHours));
    }

    // e. Filter by halal if halal=true
    if (halal) {
      restaurants = restaurants.filter((r) => r.isHalal === true);
    }

    // Sort by distance if lat/lng provided
    if (lat !== null && lng !== null) {
      restaurants.sort((a, b) => {
        const distA = a.distance ?? Infinity;
        const distB = b.distance ?? Infinity;
        return distA - distB;
      });
    }

    // Store in cache
    cache.set(cacheKey, {
      data: restaurants,
      expires: Date.now() + CACHE_TTL,
    });

    return NextResponse.json({
      data: restaurants,
      source: 'database',
      count: restaurants.length,
    } as ApiResponse<Restaurant[]>);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An error occurred',
      } as ApiResponse<Restaurant[]>,
      { status: 500 }
    );
  }
}
