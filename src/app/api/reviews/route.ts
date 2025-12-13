import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { Review, ApiResponse } from '@/types';

// In-memory cache with TTL
interface CacheEntry {
  data: Review[];
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Transform database row to Review interface
function transformReview(row: any): Review {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    source: row.source,
    author: row.author,
    rating: row.rating,
    text: row.text,
    createdDate: row.created_date,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const restaurantId = searchParams.get('restaurantId');

    // Return 400 if restaurantId is missing
    if (!restaurantId) {
      return NextResponse.json(
        {
          error: 'restaurantId query parameter is required',
        } as ApiResponse<Review[]>,
        { status: 400 }
      );
    }

    // Build cache key
    const cacheKey = `reviews:${restaurantId}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return NextResponse.json({
        data: cached.data,
        source: 'cache',
        count: cached.data.length,
      } as ApiResponse<Review[]>);
    }

    // Query Supabase
    const supabase = createClient();
    const { data: reviewsData, error: dbError } = await supabase
      .from('reviews')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('rating', { ascending: false })
      .order('created_date', { ascending: false })
      .limit(10);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Handle no reviews case - return empty array, not error
    const reviews: Review[] = reviewsData
      ? reviewsData.map((row) => transformReview(row))
      : [];

    // Store in cache
    cache.set(cacheKey, {
      data: reviews,
      expires: Date.now() + CACHE_TTL,
    });

    return NextResponse.json({
      data: reviews,
      source: 'database',
      count: reviews.length,
    } as ApiResponse<Review[]>);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An error occurred',
      } as ApiResponse<Review[]>,
      { status: 500 }
    );
  }
}
