import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getTripAdvisorData } from '@/services/tripAdvisor';
import { Restaurant, ApiResponse } from '@/types';

/**
 * Transform database row to Restaurant interface with TripAdvisor fields
 */
function transformRestaurant(row: any): Restaurant {
  // Calculate aggregateRating with fallback logic
  let aggregateRating = row.aggregate_rating;
  if (aggregateRating == null) {
    if (row.google_rating != null) {
      aggregateRating = row.google_rating;
    } else if (row.tripadvisor_rating != null) {
      aggregateRating = row.tripadvisor_rating;
    } else {
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

/**
 * Extract city from address string
 * Defaults to "Kuala Lumpur" if parsing fails
 */
function extractCity(address: string): string {
  // Try to extract city from address
  // Common patterns: "City, State" or "City State"
  const cityPatterns = [
    /Kuala Lumpur/i,
    /Cyberjaya/i,
    /Putrajaya/i,
    /Bangi/i,
    /Johor Bahru/i,
    /Melaka/i,
    /Georgetown/i,
    /Kota Kinabalu/i,
    /Kuching/i,
    /Ipoh/i,
    /Kota Bharu/i,
  ];

  for (const pattern of cityPatterns) {
    const match = address.match(pattern);
    if (match) {
      return match[0];
    }
  }

  // Default to Kuala Lumpur
  return 'Kuala Lumpur';
}

/**
 * POST /api/restaurants/[id]/enrich
 * Enriches a restaurant with TripAdvisor data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createServerClient();

    // Fetch restaurant from database
    const { data: restaurantData, error: dbError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError) {
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

    // Get TripAdvisor data from cache (0 credits, instant lookup)
    const tripAdvisorData = getTripAdvisorData(restaurantData.name);

    if (!tripAdvisorData) {
      // Return restaurant without TripAdvisor data (not in cache)
      const restaurant = transformRestaurant(restaurantData);
      return NextResponse.json({
        data: restaurant,
        source: 'database',
      } as ApiResponse<Restaurant>);
    }

    // Update database with enriched data
    const updateData: any = {
      tripadvisor_enriched: true,
      tripadvisor_enriched_at: new Date().toISOString(),
    };

    if (tripAdvisorData.rank) {
      updateData.tripadvisor_rank = tripAdvisorData.rank;
    }
    if (tripAdvisorData.priceText) {
      updateData.tripadvisor_price_text = tripAdvisorData.priceText;
    }
    if (tripAdvisorData.tags && tripAdvisorData.tags.length > 0) {
      updateData.tripadvisor_tags = tripAdvisorData.tags;
    }
    if (tripAdvisorData.topReviewSnippet) {
      updateData.tripadvisor_top_review_snippet = tripAdvisorData.topReviewSnippet;
    }

    const { error: updateError } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update restaurant with TripAdvisor data:', updateError);
      // Still return the enriched data even if DB update fails
    }

    // Fetch updated restaurant
    const { data: updatedRestaurantData } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();

    const restaurant = transformRestaurant(updatedRestaurantData || restaurantData);

    return NextResponse.json({
      data: restaurant,
      source: 'database',
    } as ApiResponse<Restaurant>);
  } catch (error) {
    console.error('Error enriching restaurant:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An error occurred during enrichment',
      } as ApiResponse<Restaurant>,
      { status: 500 }
    );
  }
}
