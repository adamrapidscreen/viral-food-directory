import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { TrendingDish, ApiResponse } from '@/types';

// In-memory cache with TTL
interface CacheEntry {
  data: TrendingDish[];
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_KEY = 'trending-dishes';

// Transform database row to TrendingDish interface
function transformTrendingDish(row: any): TrendingDish {
  const restaurant = row.restaurants || {};
  
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    restaurantName: restaurant.name ?? undefined,
    restaurantIsHalal: restaurant.is_halal ?? undefined,
    dishName: row.dish_name,
    description: row.description,
    price: row.price,
    mentionCount: row.mention_count,
    recommendPercentage: row.recommend_percentage,
    viralScore: row.viral_score,
    photoUrl: row.photo_url,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check cache
    const cached = cache.get(CACHE_KEY);
    if (cached && Date.now() < cached.expires) {
      return NextResponse.json({
        data: cached.data,
        source: 'cache',
        count: cached.data.length,
      } as ApiResponse<TrendingDish[]>);
    }

    // Query Supabase with join
    const supabase = createClient();
    const { data: dishesData, error: dbError } = await supabase
      .from('trending_dishes')
      .select('*, restaurants(name, is_halal)')
      .order('viral_score', { ascending: false })
      .limit(10);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!dishesData) {
      throw new Error('No data returned from database');
    }

    // Transform to TrendingDish interface
    const dishes: TrendingDish[] = dishesData.map((row) =>
      transformTrendingDish(row)
    );

    // Store in cache
    cache.set(CACHE_KEY, {
      data: dishes,
      expires: Date.now() + CACHE_TTL,
    });

    return NextResponse.json({
      data: dishes,
      source: 'database',
      count: dishes.length,
    } as ApiResponse<TrendingDish[]>);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An error occurred',
      } as ApiResponse<TrendingDish[]>,
      { status: 500 }
    );
  }
}
