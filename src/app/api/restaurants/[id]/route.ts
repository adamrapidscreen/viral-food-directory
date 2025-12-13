import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { Restaurant, ApiResponse } from '@/types';

// In-memory cache with TTL
interface CacheEntry {
  data: Restaurant;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Transform database row to Restaurant interface
function transformRestaurant(row: any): Restaurant {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    category: row.category,
    googleRating: row.google_rating ?? undefined,
    tripadvisorRating: row.tripadvisor_rating ?? undefined,
    aggregateRating: row.aggregate_rating,
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract id from params
    const { id } = await params;

    // Build cache key
    const cacheKey = `restaurant:${id}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return NextResponse.json({
        data: cached.data,
        source: 'cache',
      } as ApiResponse<Restaurant>);
    }

    // Query Supabase
    const supabase = createClient();
    const { data: restaurantData, error: dbError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError) {
      // Return 404 if not found
      if (dbError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Restaurant not found',
          } as ApiResponse<Restaurant>,
          { status: 404 }
        );
      }
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!restaurantData) {
      return NextResponse.json(
        {
          error: 'Restaurant not found',
        } as ApiResponse<Restaurant>,
        { status: 404 }
      );
    }

    // Transform to Restaurant interface
    const restaurant = transformRestaurant(restaurantData);

    // Store in cache
    cache.set(cacheKey, {
      data: restaurant,
      expires: Date.now() + CACHE_TTL,
    });

    return NextResponse.json({
      data: restaurant,
      source: 'database',
    } as ApiResponse<Restaurant>);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An error occurred',
      } as ApiResponse<Restaurant>,
      { status: 500 }
    );
  }
}
