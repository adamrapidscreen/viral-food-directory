import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * Calculate viral score with daily rotation factor
 * Base rating (max 50) + Review volume (max 30) + Halal bonus (10) + Daily rotation (0-10)
 */
function calculateViralScore(
  restaurant: {
    google_rating: number | null;
    google_review_count: number | null;
    is_halal: boolean;
    id: string;
  }
): number {
  let score = 0;
  
  // Base rating (max 50 points)
  score += (restaurant.google_rating || 0) * 10;
  
  // Review volume (max 30 points)
  const reviewScore = Math.min(
    Math.log10((restaurant.google_review_count || 0) + 1) * 10,
    30
  );
  score += reviewScore;
  
  // Halal bonus for Malaysia market (10 points)
  if (restaurant.is_halal) score += 10;
  
  // Random daily rotation factor (0-10 points)
  // This makes trending list change each day
  const dailySeed = new Date().getDate();
  const rotationBonus = ((restaurant.id.charCodeAt(0) + dailySeed) % 10);
  score += rotationBonus;
  
  return Math.round(score * 100) / 100;
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

/**
 * Main update viral score logic
 */
async function updateViralScores(): Promise<NextResponse> {
  try {
    // Initialize Supabase client
    const supabase = createServerClient();

    // Query all restaurants from Supabase
    const { data: restaurants, error: fetchError } = await supabase
      .from('restaurants')
      .select('id, google_rating, viral_mentions, is_halal, name, photos');

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

    // For each restaurant, calculate viral_score
    const updates: Array<{
      id: string;
      trending_score: number;
      is_trending: boolean;
    }> = [];

    for (const restaurant of restaurants) {
      const viralScore = calculateViralScore({
        google_rating: restaurant.google_rating ?? null,
        google_review_count: restaurant.viral_mentions ?? null, // viral_mentions stores review count
        is_halal: restaurant.is_halal || false,
        id: restaurant.id,
      });

      updates.push({
        id: restaurant.id,
        trending_score: viralScore,
        is_trending: false, // Will be set to true for top 15% below
      });
    }

    // Sort by viral score to determine top 15%
    updates.sort((a, b) => b.trending_score - a.trending_score);
    const top15PercentCount = Math.max(1, Math.ceil(updates.length * 0.15));

    // Mark top 15% as is_trending = true, rest as false
    for (let i = 0; i < top15PercentCount; i++) {
      updates[i].is_trending = true;
    }

    // Update all restaurants with new viral_score
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
          const viralScore = calculateViralScore({
            google_rating: restaurant.google_rating ?? null,
            google_review_count: restaurant.viral_mentions ?? null, // viral_mentions stores review count
            is_halal: restaurant.is_halal || false,
            id: restaurant.id,
          });
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

    // Return stats: { processed: X, trending: X }
    return NextResponse.json({
      success: true,
      stats: {
        processed: restaurants.length,
        trending: top15PercentCount,
      },
      message: `Updated viral scores for ${updatedCount} restaurants. ${top15PercentCount} marked as trending.`,
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

/**
 * POST handler - for production cron jobs
 */
export async function POST(request: NextRequest) {
  // COMMENTED OUT FOR TESTING - Re-enable before production!
  // const authHeader = request.headers.get('authorization');
  // const cronSecret = process.env.CRON_SECRET;
  //
  // if (!cronSecret) {
  //   return NextResponse.json(
  //     { error: 'CRON_SECRET not configured' },
  //     { status: 500 }
  //   );
  // }
  //
  // // Check authorization header or body
  // const providedSecret =
  //   authHeader?.replace('Bearer ', '') ||
  //   (await request.json().catch(() => ({}))).secret;
  //
  // if (providedSecret !== cronSecret) {
  //   return NextResponse.json(
  //     { error: 'Unauthorized' },
  //     { status: 401 }
  //   );
  // }

  return updateViralScores();
}

/**
 * GET handler - for browser testing
 * Usage: http://localhost:3000/api/cron/update-viral-score
 * 
 * NOTE: Auth check is commented out for testing. Re-enable before production!
 */
export async function GET(request: NextRequest) {
  // COMMENTED OUT FOR TESTING - Re-enable before production!
  // const searchParams = request.nextUrl.searchParams;
  // const authHeader = request.headers.get('authorization');
  // const cronSecret = process.env.CRON_SECRET;
  //
  // if (!cronSecret) {
  //   return NextResponse.json(
  //     { error: 'CRON_SECRET not configured' },
  //     { status: 500 }
  //   );
  // }
  //
  // const providedSecret =
  //   searchParams.get('secret') ||
  //   authHeader?.replace('Bearer ', '');
  //
  // if (providedSecret !== cronSecret) {
  //   return NextResponse.json(
  //     { error: 'Unauthorized' },
  //     { status: 401 }
  //   );
  // }

  return updateViralScores();
}
