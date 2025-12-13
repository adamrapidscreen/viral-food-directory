import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * Calculate viral score using the formula:
 * (google_rating * 10) + (log10(google_review_count) * 20) + (50 if is_halal) + (random 0-10)
 */
function calculateViralScore(
  googleRating: number | null,
  reviewCount: number,
  isHalal: boolean
): number {
  const ratingScore = (googleRating ?? 0) * 10;
  const reviewScore = reviewCount > 0 ? Math.log10(reviewCount) * 20 : 0;
  const halalBonus = isHalal ? 50 : 0;
  const jitter = Math.random() * 10; // Random 0-10 to rotate trends

  return Math.round(ratingScore + reviewScore + halalBonus + jitter);
}

/**
 * Check if trending dish exists for a restaurant
 */
async function trendingDishExists(
  supabase: ReturnType<typeof createServerClient>,
  restaurantId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('trending_dishes')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .limit(1)
      .single();

    // If error is PGRST116, it means no rows found (not an actual error)
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking trending dish existence:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Exception checking trending dish existence:', error);
    return false;
  }
}

/**
 * Create a dummy trending dish entry for a restaurant
 */
async function createTrendingDish(
  supabase: ReturnType<typeof createServerClient>,
  restaurant: any,
  viralScore: number
): Promise<boolean> {
  try {
    const dishName = `${restaurant.name} Special`;
    const description = `A signature dish from ${restaurant.name}. Highly recommended by locals and visitors alike.`;
    const photoUrl = restaurant.photos && restaurant.photos.length > 0 
      ? restaurant.photos[0] 
      : '';

    const { error } = await supabase.from('trending_dishes').insert({
      restaurant_id: restaurant.id,
      dish_name: dishName,
      description,
      price: 0, // Default price, can be updated later
      mention_count: restaurant.viral_mentions || 0,
      recommend_percentage: Math.min(95, Math.max(75, restaurant.google_rating ? Math.round(restaurant.google_rating * 20) : 80)),
      viral_score: viralScore,
      photo_url: photoUrl,
    });

    if (error) {
      console.error('Error creating trending dish:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception creating trending dish:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    // Check authorization header or body
    const providedSecret =
      authHeader?.replace('Bearer ', '') ||
      (await request.json().catch(() => ({}))).secret;

    if (providedSecret !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerClient();

    // Fetch all restaurants
    const { data: restaurants, error: fetchError } = await supabase
      .from('restaurants')
      .select('id, google_rating, viral_mentions, is_halal, name, photos')
      .order('trending_score', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch restaurants: ${fetchError.message}`);
    }

    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No restaurants found',
        stats: {
          updated: 0,
          trendingDishesCreated: 0,
        },
      });
    }

    // Calculate viral scores and update restaurants
    const updates: Array<{
      id: string;
      trending_score: number;
      is_trending: boolean;
    }> = [];

    for (const restaurant of restaurants) {
      const googleRating = restaurant.google_rating ?? null;
      const reviewCount = restaurant.viral_mentions || 0;
      const isHalal = restaurant.is_halal || false;

      const viralScore = calculateViralScore(googleRating, reviewCount, isHalal);

      updates.push({
        id: restaurant.id,
        trending_score: viralScore,
        is_trending: false, // Will be set to true for top 10% below
      });
    }

    // Sort by viral score to determine top 10%
    updates.sort((a, b) => b.trending_score - a.trending_score);
    const top10PercentCount = Math.max(1, Math.ceil(updates.length * 0.1));

    // Mark top 10% as trending
    for (let i = 0; i < top10PercentCount; i++) {
      updates[i].is_trending = true;
    }

    // Batch update restaurants
    let updatedCount = 0;
    let updateErrors = 0;

    for (const update of updates) {
      try {
        // Try to update with is_trending column first
        const { error } = await supabase
          .from('restaurants')
          .update({
            trending_score: update.trending_score,
            is_trending: update.is_trending,
          })
          .eq('id', update.id);

        if (error) {
          // If is_trending column doesn't exist, update only trending_score
          if (error.message.includes('is_trending') || error.code === '42703') {
            const { error: fallbackError } = await supabase
              .from('restaurants')
              .update({
                trending_score: update.trending_score,
              })
              .eq('id', update.id);

            if (fallbackError) {
              console.error(`Error updating restaurant ${update.id}:`, fallbackError);
              updateErrors++;
            } else {
              updatedCount++;
            }
          } else {
            console.error(`Error updating restaurant ${update.id}:`, error);
            updateErrors++;
          }
        } else {
          updatedCount++;
        }
      } catch (error) {
        console.error(`Exception updating restaurant ${update.id}:`, error);
        updateErrors++;
      }
    }

    // Get top 5 restaurants for trending dishes
    const top5Restaurants = updates
      .slice(0, 5)
      .map((update) => {
        const restaurant = restaurants.find((r) => r.id === update.id);
        return restaurant ? { ...restaurant, trending_score: update.trending_score } : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    // Create trending dishes for top 5 if missing
    let trendingDishesCreated = 0;
    let trendingDishErrors = 0;

    for (const restaurant of top5Restaurants) {
      try {
        const exists = await trendingDishExists(supabase, restaurant.id);
        if (!exists) {
          const viralScore = calculateViralScore(
            restaurant.google_rating ?? null,
            restaurant.viral_mentions || 0,
            restaurant.is_halal || false
          );
          const success = await createTrendingDish(supabase, restaurant, viralScore);
          if (success) {
            trendingDishesCreated++;
          } else {
            trendingDishErrors++;
          }
        }
      } catch (error) {
        console.error(`Error processing trending dish for ${restaurant.id}:`, error);
        trendingDishErrors++;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        total: restaurants.length,
        updated: updatedCount,
        updateErrors,
        top10Percent: top10PercentCount,
        trendingDishesCreated,
        trendingDishErrors,
      },
      message: `Updated viral scores for ${updatedCount} restaurants. Created ${trendingDishesCreated} trending dishes.`,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
