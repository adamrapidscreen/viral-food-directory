/**
 * Utility script to get top restaurants for TripAdvisor seeding
 * 
 * Extracts cities dynamically from database and distributes restaurants evenly
 * Filters by:
 * - rating >= 4.0
 * - user_ratings_total >= 50 (using viral_mentions as proxy)
 * 
 * Outputs ~40-60 restaurants distributed across cities
 * 
 * Usage: npx tsx src/scripts/getTopRestaurants.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createServerClient } from '@/lib/supabase-server';

interface RestaurantRow {
  id: string;
  name: string;
  address: string;
  google_rating: number | null;
  aggregate_rating: number | null;
  viral_mentions: number;
  user_ratings_total?: number; // May not exist, will use viral_mentions as fallback
}

/**
 * Extract city from address/vicinity string
 * Address usually ends with city name, e.g., "123 Jalan ABC, Petaling Jaya, Selangor"
 */
const extractCity = (address: string): string => {
  if (!address) return 'Unknown';
  
  // Split by comma and get the last part (usually city)
  const parts = address.split(',').map(p => p.trim());
  
  // Try to get the city (usually second-to-last or last part)
  // Common patterns: "Street, City, State" or "Street, City"
  if (parts.length >= 2) {
    // Return second-to-last part (city) or last part if only 2 parts
    return parts[parts.length - 2] || parts[parts.length - 1] || 'Unknown';
  }
  
  return parts[parts.length - 1] || 'Unknown';
};

/**
 * Get top restaurants for a specific city
 */
const getTopByCity = (
  restaurants: RestaurantRow[],
  city: string,
  count: number
): RestaurantRow[] => {
  return restaurants
    .filter((r) => {
      const rCity = extractCity(r.address);
      const rating = r.aggregate_rating ?? r.google_rating ?? 0;
      const userRatingsTotal = r.viral_mentions || 0;
      
      return rCity === city && rating >= 4.0 && userRatingsTotal >= 50;
    })
    .sort((a, b) => {
      const aTotal = a.viral_mentions || 0;
      const bTotal = b.viral_mentions || 0;
      return bTotal - aTotal;
    })
    .slice(0, count);
};

async function getTopRestaurants() {
  try {
    const supabase = createServerClient();

    // Fetch all restaurants from database with address field
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('id, name, address, google_rating, aggregate_rating, viral_mentions')
      .limit(10000); // Get all restaurants to filter from

    if (error) {
      console.error('❌ Error fetching restaurants:', error);
      process.exit(1);
    }

    if (!restaurants || restaurants.length === 0) {
      console.log('⚠️ No restaurants found in database');
      process.exit(0);
    }

    console.log(`📊 Total restaurants fetched: ${restaurants.length}`);

    // 1. Extract unique cities from restaurant data
    const allCities = [
      ...new Set(
        restaurants.map((r: RestaurantRow) => extractCity(r.address))
      )
    ].filter((city) => city && city !== 'Unknown');

    console.log(`\n🗺️  Cities found in database (${allCities.length}):`);
    allCities.forEach((city) => console.log(`  - ${city}`));

    if (allCities.length === 0) {
      console.log('⚠️  No cities found in restaurant addresses');
      process.exit(0);
    }

    // 2. Distribute evenly: aim for ~40-60 total
    const targetTotal = 50;
    const restaurantsPerCity = Math.ceil(targetTotal / allCities.length);

    console.log(`\n📊 Target: ~${targetTotal} restaurants, ~${restaurantsPerCity} per city\n`);

    // 3. Get top restaurants per city
    const diverseTop = allCities.flatMap((city) => {
      const topInCity = getTopByCity(restaurants as RestaurantRow[], city, restaurantsPerCity);
      console.log(`📍 ${city}: ${topInCity.length} picked`);
      topInCity.forEach((r) => {
        const rating = r.aggregate_rating ?? r.google_rating ?? 0;
        const reviews = r.viral_mentions || 0;
        console.log(`   - ${r.name} (${rating.toFixed(1)}★, ${reviews.toLocaleString()} reviews)`);
      });
      return topInCity;
    });

    // 4. Remove duplicates and output
    const uniqueRestaurants = Array.from(
      new Map(diverseTop.map((r) => [r.name, r])).values()
    );

    console.log(`\n\n✅ Total unique restaurants: ${uniqueRestaurants.length}`);
    console.log('\n// Copy-paste into seedTripAdvisor.ts:\n');
    console.log('const TOP_RESTAURANTS = [');
    uniqueRestaurants.forEach((r) => {
      console.log(`  '${r.name}',`);
    });
    console.log('];');

    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
getTopRestaurants();
