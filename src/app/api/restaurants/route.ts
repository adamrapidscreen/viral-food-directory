import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { calculateDistance, isOpenNow } from '@/lib/utils';
import { Restaurant, ApiResponse } from '@/types';

// CACHE DISABLED FOR DEBUGGING - Will re-enable after fixing
// const cache = new Map<string, CacheEntry>();
// const CACHE_TTL = 30 * 60 * 1000;
// const SUPABASE_CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = parseFloat(searchParams.get('radius') || '50'); // Default 50km instead of 15km
    const halal = searchParams.get('halal') === 'true';
    const category = searchParams.get('category');
    const search = searchParams.get('search') || searchParams.get('searchQuery'); // Support both param names
    const openNow = searchParams.get('openNow') === 'true';
    const priceRange = searchParams.get('priceRange');
    const trending = searchParams.get('trending') === 'true';
    const limit = parseInt(searchParams.get('limit') || '200');

    const supabase = createClient();

    // Build query
    let query = supabase.from('restaurants').select('*');

    // If trending=true, filter by is_trending and sort by score
    if (trending) {
      // Try to filter by is_trending, but handle gracefully if column doesn't exist
      query = query.order('trending_score', { ascending: false });
      // Note: If is_trending column exists, we'll filter client-side below
    } else {
      // Default: order by trending_score for all restaurants
      query = query.order('trending_score', { ascending: false });
    }

    // Apply limit
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let restaurants = data || [];
    console.log('Raw count from DB:', restaurants.length);

    // If trending=true, filter by is_trending client-side (in case column doesn't exist in DB)
    if (trending) {
      restaurants = restaurants.filter((r: any) => r.is_trending === true);
      // If no trending restaurants found, fall back to top by trending_score
      if (restaurants.length === 0) {
        console.log('No is_trending=true found, using top by trending_score');
        restaurants = data || [];
        restaurants.sort((a: any, b: any) => (b.trending_score || 0) - (a.trending_score || 0));
        restaurants = restaurants.slice(0, limit);
      }
      console.log('After trending filter:', restaurants.length);
    }

    // Calculate distance if user location provided (skip if trending=true, we want score-based sorting)
    if (lat && lng && !trending) {
      restaurants = restaurants.map((r: any) => ({
        ...r,
        distance: calculateDistance(parseFloat(lat), parseFloat(lng), r.lat, r.lng)
      }));
      // Only filter by radius if explicitly requested (radius < 100 means user wants filtering)
      if (radius < 100) {
        restaurants = restaurants.filter((r: any) => r.distance <= radius);
        console.log(`After ${radius}km radius filter:`, restaurants.length);
      }
      // Sort by distance
      restaurants.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
    } else if (!trending) {
      console.log('No location provided - showing all restaurants');
    }

    // Apply other filters
    if (halal) {
      restaurants = restaurants.filter((r: any) => r.is_halal === true);
      console.log('After halal filter:', restaurants.length);
    }
    if (category) {
      restaurants = restaurants.filter((r: any) => r.category === category);
      console.log('After category filter:', restaurants.length);
    }
    if (priceRange) {
      restaurants = restaurants.filter((r: any) => r.price_range === priceRange);
      console.log('After priceRange filter:', restaurants.length);
    }
    if (openNow) {
      // Only show restaurants that are explicitly open (true), exclude closed (false) and unknown (null)
      restaurants = restaurants.filter((r: any) => isOpenNow(r.operating_hours || {}) === true);
      console.log('After openNow filter:', restaurants.length);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      restaurants = restaurants.filter((r: any) => 
        r.name?.toLowerCase().includes(searchLower) ||
        r.category?.toLowerCase().includes(searchLower) ||
        r.must_try_dish?.toLowerCase().includes(searchLower)
      );
      console.log('After search filter:', restaurants.length);
    }

    console.log('After filtering:', restaurants.length);

    // Transform snake_case to camelCase for frontend
    const transformed: Restaurant[] = restaurants.map((r: any) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
      category: r.category,
      googleRating: r.google_rating ?? undefined,
      tripadvisorRating: r.tripadvisor_rating ?? undefined,
      aggregateRating: r.aggregate_rating || r.google_rating || 0,
      mustTryDish: r.must_try_dish || 'House Special',
      mustTryConfidence: r.must_try_confidence || 75,
      priceRange: r.price_range || '$$',
      operatingHours: r.operating_hours || {},
      viralMentions: r.viral_mentions || 0,
      trendingScore: r.trending_score || 0,
      photos: r.photos || [],
      isHalal: r.is_halal || false,
      halalCertified: r.halal_certified || false,
      halalCertNumber: r.halal_cert_number ?? undefined,
      distance: r.distance,
    }));

    return NextResponse.json({
      data: transformed,
      count: transformed.length,
      source: 'database'
    } as ApiResponse<Restaurant[]>);
  } catch (error) {
    console.error('Restaurants API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An error occurred',
      } as ApiResponse<Restaurant[]>,
      { status: 500 }
    );
  }
}
