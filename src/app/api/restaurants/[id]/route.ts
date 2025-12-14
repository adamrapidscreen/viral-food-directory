import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { Restaurant, ApiResponse } from '@/types';

// In-memory cache with TTL
interface CacheEntry {
  data: Restaurant;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (increased from 10 minutes)
const PLACE_DETAILS_CACHE_DAYS = 7; // Refresh place details after 7 days
const PLACE_DETAILS_CACHE_TTL = PLACE_DETAILS_CACHE_DAYS * 24 * 60 * 60 * 1000; // 7 days

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
    halalCertNumber: row.halal_cert_number ?? undefined,
    // TripAdvisor fields
    tripAdvisorRank: row.tripadvisor_rank ?? undefined,
    tripAdvisorPriceText: row.tripadvisor_price_text ?? undefined,
    tripAdvisorTags: row.tripadvisor_tags ?? undefined,
    tripAdvisorTopReviewSnippet: row.tripadvisor_top_review_snippet ?? undefined,
    tripAdvisorEnriched: row.tripadvisor_enriched ?? false,
    tripAdvisorEnrichedAt: row.tripadvisor_enriched_at ?? undefined,
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

    // Check in-memory cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return NextResponse.json({
        data: cached.data,
        source: 'memory-cache',
      } as ApiResponse<Restaurant>);
    }

    // Check Supabase cache for place details (permanent cache, refresh if > 7 days)
    const supabase = createClient();
    const { data: supabaseCache, error: cacheError } = await supabase
      .from('cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .single();

    if (!cacheError && supabaseCache) {
      const cacheAge = Date.now() - new Date(supabaseCache.created_at).getTime();
      if (cacheAge < PLACE_DETAILS_CACHE_TTL) {
        // Cache is still valid (less than 7 days old)
        const cachedData = supabaseCache.cache_data as Restaurant;
        
        // Also store in in-memory cache for faster access
        cache.set(cacheKey, {
          data: cachedData,
          expires: Date.now() + CACHE_TTL,
        });

        return NextResponse.json({
          data: cachedData,
          source: 'supabase-cache',
        } as ApiResponse<Restaurant>);
      } else {
        // Cache is older than 7 days, will refresh below
        const { error: deleteError } = await supabase
          .from('cache')
          .delete()
          .eq('cache_key', cacheKey);
        
        if (deleteError) {
          console.warn('Failed to delete expired cache:', deleteError.message);
        }
      }
    }

    // Query Supabase (cache miss or expired - fetch fresh data)
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

    // Store in in-memory cache
    cache.set(cacheKey, {
      data: restaurant,
      expires: Date.now() + CACHE_TTL,
    });

    // Store in Supabase cache permanently (restaurant data rarely changes)
    // Photos are already stored in database, never re-fetch unless explicitly refreshed
    const { error: cacheUpsertError } = await supabase
      .from('cache')
      .upsert({
        cache_key: cacheKey,
        cache_data: restaurant,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'cache_key',
      });

    // Silently fail if cache table doesn't exist or upsert fails
    // This allows the API to work even without the cache table
    if (cacheUpsertError) {
      console.warn('Failed to store in Supabase cache:', cacheUpsertError.message);
    }

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
