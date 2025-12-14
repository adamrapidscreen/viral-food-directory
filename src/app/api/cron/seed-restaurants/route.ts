import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { isHalalOrMuslimFriendly } from '@/services/googlePlaces';

// Target areas in Malaysia
const AREAS = [
  { name: 'Cyberjaya', lat: 2.9213, lng: 101.6559 },
  { name: 'Putrajaya', lat: 2.9264, lng: 101.6964 },
  { name: 'Bangi', lat: 2.9474, lng: 101.7820 },
  { name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869 },
  { name: 'Kuala Terengganu', lat: 5.3117, lng: 103.1324 },
  { name: 'Johor Bahru', lat: 1.4927, lng: 103.7414 },
  { name: 'Alor Setar', lat: 6.1254, lng: 100.3673 },
  { name: 'Dungun', lat: 4.7574, lng: 103.4216 },
  { name: 'Melaka', lat: 2.1896, lng: 102.2501 },
  { name: 'Georgetown', lat: 5.4164, lng: 100.3327 },
  { name: 'Kota Kinabalu', lat: 5.9804, lng: 116.0735 },
  { name: 'Kuching', lat: 1.5535, lng: 110.3593 },
  { name: 'Ipoh', lat: 4.5975, lng: 101.0901 },
  { name: 'Kota Bharu', lat: 6.1254, lng: 102.2386 },
  { name: 'Genting Highlands', lat: 3.4236, lng: 101.7932 },
  { name: 'Janda Baik', lat: 3.3361, lng: 101.8572 },
];

// Viral keywords to search for
const KEYWORDS = [
  'nasi lemak',
  'viral cafe',
  'roti canai',
  'mee goreng',
  'char kuey teow',
  'laksa',
  'satay',
  'durian',
  'cendol',
  'teh tarik spot',
];

// Google Places API configuration
const GOOGLE_PLACES_TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const GOOGLE_PLACES_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const GOOGLE_PLACES_PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo';

// Field mask for Place Details API - only request needed data to reduce costs
// DO NOT request: reviews (expensive), websiteUri (not critical)
const PLACE_DETAILS_FIELDS = [
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'priceLevel',
  'businessStatus',
  'photos',
  'openingHours'
].join(',');

interface GooglePlaceResult {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  types: string[];
  formatted_address: string;
  price_level?: number;
}

interface GooglePlacesResponse {
  results: GooglePlaceResult[];
  status: string;
  error_message?: string;
}

/**
 * Search Google Places API with a keyword and location
 * Returns both results and logs for debugging
 */
async function searchGooglePlaces(
  keyword: string,
  location: { lat: number; lng: number; name: string },
  apiKey: string,
  searchLogs: string[]
): Promise<GooglePlaceResult[]> {
  const query = `${keyword} in ${location.name}, Malaysia`;
  const url = `${GOOGLE_PLACES_TEXT_SEARCH_URL}?query=${encodeURIComponent(query)}&key=${apiKey}`;

  // Log search URL (without API key)
  const urlWithoutKey = url.replace(/key=[^&]+/, 'key=***HIDDEN***');
  const urlLog = `[Google Places] Search URL: ${urlWithoutKey}`;
  const queryLog = `[Google Places] Query: "${query}"`;
  console.log(urlLog);
  console.log(queryLog);
  searchLogs.push(urlLog);
  searchLogs.push(queryLog);

  try {
    const response = await fetch(url);
    const data: GooglePlacesResponse = await response.json();

    // Log raw response status and error message
    const statusLog = `[Google Places] Response Status: ${data.status}`;
    console.log(statusLog);
    searchLogs.push(statusLog);
    
    if (data.error_message) {
      const errorLog = `[Google Places] Error Message: ${data.error_message}`;
      console.log(errorLog);
      searchLogs.push(errorLog);
    }
    
    const resultsCountLog = `[Google Places] Results Count: ${data.results?.length || 0}`;
    console.log(resultsCountLog);
    searchLogs.push(resultsCountLog);

    // Handle specific error cases
    if (data.status === 'REQUEST_DENIED') {
      const errorMsg = `[Google Places] ❌ REQUEST_DENIED - Check API key permissions and billing. Error: ${data.error_message || 'No error message'}`;
      console.error(errorMsg);
      searchLogs.push(errorMsg);
      // Don't throw - return empty array to continue processing other queries
      return [];
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      const errorMsg = `[Google Places] ❌ OVER_QUERY_LIMIT - API quota exceeded`;
      console.error(errorMsg);
      searchLogs.push(errorMsg);
      // Don't throw - return empty array to continue processing other queries
      return [];
    }

    if (data.status === 'INVALID_REQUEST') {
      const errorMsg = `[Google Places] ❌ INVALID_REQUEST - Check query format. Error: ${data.error_message || 'No error message'}`;
      console.error(errorMsg);
      searchLogs.push(errorMsg);
      // Don't throw - return empty array to continue processing other queries
      return [];
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      const errorMsg = `[Google Places] ❌ Error status "${data.status}" for "${query}": ${data.error_message || 'No error message'}`;
      console.error(errorMsg);
      searchLogs.push(errorMsg);
      return [];
    }

    if (data.status === 'ZERO_RESULTS') {
      const zeroResultsLog = `[Google Places] ⚠️  ZERO_RESULTS for "${query}"`;
      console.log(zeroResultsLog);
      searchLogs.push(zeroResultsLog);
      return [];
    }

    // Log filtering details
    const totalResults = data.results?.length || 0;
    const filteredResults = data.results?.filter(
      (place) =>
        (place.rating ?? 0) > 4.0 && (place.user_ratings_total ?? 0) > 500
    ) || [];
    
    const filteredLog = `[Google Places] Filtered: ${filteredResults.length}/${totalResults} (rating > 4.0, reviews > 500)`;
    console.log(filteredLog);
    searchLogs.push(filteredLog);

    // Log details of filtered results
    if (filteredResults.length > 0) {
      filteredResults.forEach((place, index) => {
        const placeLog = `[Google Places]   ${index + 1}. ${place.name} - Rating: ${place.rating}, Reviews: ${place.user_ratings_total}`;
        console.log(placeLog);
        searchLogs.push(placeLog);
      });
    }

    return filteredResults;
  } catch (error) {
    console.error(`[Google Places] ❌ Exception searching for "${query}":`, error);
    return [];
  }
}

/**
 * Fetch Place Details with field masks to reduce costs
 * Only requests needed fields, excludes expensive ones like reviews, openingHours, websiteUri
 */
async function fetchPlaceDetails(
  placeId: string,
  apiKey: string,
  searchLogs: string[]
): Promise<any | null> {
  // Add fields parameter to URL to only request needed data
  let url = `${GOOGLE_PLACES_DETAILS_URL}?place_id=${placeId}&key=${apiKey}`;
  url += `&fields=${PLACE_DETAILS_FIELDS}`;

  // Log request (without API key)
  const urlWithoutKey = url.replace(/key=[^&]+/, 'key=***HIDDEN***');
  const urlLog = `[Place Details] Request URL: ${urlWithoutKey}`;
  console.log(urlLog);
  searchLogs.push(urlLog);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      const successLog = `[Place Details] ✅ Successfully fetched details for ${placeId}`;
      console.log(successLog);
      searchLogs.push(successLog);
      return data.result;
    } else {
      const errorLog = `[Place Details] ⚠️  Status: ${data.status} - ${data.error_message || 'Unknown error'}`;
      console.warn(errorLog);
      searchLogs.push(errorLog);
      return null;
    }
  } catch (error) {
    const errorMsg = `[Place Details] ❌ Exception fetching details for ${placeId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMsg);
    searchLogs.push(errorMsg);
    return null;
  }
}

/**
 * Convert Google photo reference to URL
 */
function getGooglePhotoUrl(photoReference: string, apiKey: string): string {
  return `${GOOGLE_PLACES_PHOTO_URL}?maxwidth=800&photoreference=${photoReference}&key=${apiKey}`;
}

/**
 * Map Google Places types to our category
 */
function mapCategory(types: string[]): 'hawker' | 'restaurant' | 'cafe' | 'foodcourt' {
  const typeSet = new Set(types.map((t) => t.toLowerCase()));

  if (typeSet.has('cafe') || typeSet.has('coffee_shop')) {
    return 'cafe';
  }
  if (typeSet.has('food_court') || typeSet.has('shopping_mall')) {
    return 'foodcourt';
  }
  if (
    typeSet.has('restaurant') ||
    typeSet.has('food') ||
    typeSet.has('meal_takeaway')
  ) {
    return 'restaurant';
  }

  // Default to hawker (most common in Malaysia)
  return 'hawker';
}

/**
 * Map price level to price range
 */
function mapPriceRange(priceLevel?: number): '$' | '$$' | '$$$' | '$$$$' {
  if (!priceLevel) return '$$';
  if (priceLevel <= 1) return '$';
  if (priceLevel === 2) return '$$';
  if (priceLevel === 3) return '$$$';
  return '$$$$';
}

/**
 * Parse Google Places openingHours.periods format to Record<string, string>
 * Google format: periods array with { open: { day: 0-6, time: "HHMM" }, close: { day: 0-6, time: "HHMM" } }
 * Our format: { "monday": "9am-5pm", "tuesday": "9am-5pm", ... }
 */
function parseOperatingHours(openingHours?: any): Record<string, string> {
  if (!openingHours || !openingHours.periods || !Array.isArray(openingHours.periods)) {
    return {};
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const hours: Record<string, string> = {};

  // Initialize all days as closed
  dayNames.forEach(day => {
    hours[day] = 'Closed';
  });

  // Parse periods
  openingHours.periods.forEach((period: any) => {
    if (!period.open) return;

    const day = period.open.day;
    const openTime = period.open.time; // Format: "0900" (HHMM)
    const closeTime = period.close?.time; // Format: "1700" (HHMM)

    if (day >= 0 && day <= 6 && openTime) {
      const dayName = dayNames[day];
      
      // Convert HHMM to readable format (e.g., "0900" -> "9am", "1700" -> "5pm")
      const formatTime = (timeStr: string): string => {
        const hour = parseInt(timeStr.substring(0, 2), 10);
        const minute = parseInt(timeStr.substring(2, 4), 10);
        const period = hour >= 12 ? 'pm' : 'am';
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        
        if (minute === 0) {
          return `${hour12}${period}`;
        }
        return `${hour12}:${minute.toString().padStart(2, '0')}${period}`;
      };

      const openFormatted = formatTime(openTime);
      
      if (closeTime) {
        const closeFormatted = formatTime(closeTime);
        hours[dayName] = `${openFormatted}-${closeFormatted}`;
      } else {
        // Open 24 hours or no close time
        hours[dayName] = 'Open 24 hours';
      }
    }
  });

  return hours;
}

/**
 * Calculate trending score based on rating and review count
 */
function calculateTrendingScore(rating: number, reviewCount: number): number {
  // Formula: (reviewCount / 100) * rating * 10, capped at 100
  const score = (reviewCount / 100) * rating * 10;
  return Math.min(Math.round(score), 100);
}

/**
 * Map Google Place to our restaurant schema
 * Optionally enhances with Place Details API data if provided
 */
function mapGooglePlaceToRestaurant(
  place: GooglePlaceResult,
  keyword: string,
  apiKey: string,
  placeDetails?: any
): any {
  // Use Place Details data if available, otherwise fall back to Text Search data
  const rating = placeDetails?.rating ?? place.rating ?? 0;
  // Handle both new API format (userRatingCount) and old API format (user_ratings_total)
  const reviewCount = placeDetails?.userRatingCount ?? 
                      placeDetails?.user_ratings_total ?? 
                      place.user_ratings_total ?? 0;
  const trendingScore = calculateTrendingScore(rating, reviewCount);
  // Handle both new API format (businessStatus) and old API format (business_status)
  const businessStatus = placeDetails?.businessStatus ?? placeDetails?.business_status;

  // Extract photo URL if available (prefer Place Details photos)
  const photos: string[] = [];
  if (placeDetails?.photos && placeDetails.photos.length > 0) {
    photos.push(getGooglePhotoUrl(placeDetails.photos[0].photo_reference, apiKey));
  } else if (place.photos && place.photos.length > 0) {
    photos.push(getGooglePhotoUrl(place.photos[0].photo_reference, apiKey));
  }

  // Use Place Details address if available, otherwise use Text Search address
  // Handle both new API format (formattedAddress) and old API format (formatted_address)
  const address = placeDetails?.formattedAddress ?? 
                  placeDetails?.formatted_address ?? 
                  place.formatted_address;
  
  // Use Place Details name if available, otherwise use Text Search name
  // Handle both new API format (displayName.text) and old API format (name)
  const name = placeDetails?.displayName?.text ?? 
               placeDetails?.displayName ?? 
               placeDetails?.name ?? 
               place.name;

  // Use Place Details location if available
  // Handle both new API format (location.latitude/longitude) and old API format (geometry.location)
  const location = placeDetails?.location 
    ? { lat: placeDetails.location.latitude, lng: placeDetails.location.longitude }
    : placeDetails?.geometry?.location ?? place.geometry.location;

  // Determine halal status using comprehensive algorithm
  // Combine place and placeDetails data for halal detection
  const placeForHalalCheck = {
    name: name,
    types: place.types || [],
    vicinity: place.formatted_address || '',
    formatted_address: address,
  };
  const isHalal = isHalalOrMuslimFriendly(placeForHalalCheck);

  return {
    google_place_id: place.place_id,
    name,
    address,
    lat: location.lat,
    lng: location.lng,
    category: mapCategory(place.types),
    google_rating: rating,
    aggregate_rating: rating, // Use Google rating as aggregate
    must_try_dish: keyword || 'Signature Dish', // Use keyword as must-try hint
    must_try_confidence: 75, // Default confidence
    price_range: mapPriceRange(placeDetails?.priceLevel ?? placeDetails?.price_level ?? place.price_level),
    operating_hours: parseOperatingHours(placeDetails?.openingHours ?? placeDetails?.opening_hours),
    viral_mentions: reviewCount,
    trending_score: trendingScore,
    photos,
    is_halal: isHalal, // Determined by comprehensive halal detection algorithm
    halal_certified: false,
    halal_cert_number: null,
    business_status: businessStatus, // Store business status if available
  };
}

/**
 * Check if restaurant exists by google_place_id
 */
async function restaurantExists(
  supabase: ReturnType<typeof createServerClient>,
  googlePlaceId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id')
      .eq('google_place_id', googlePlaceId)
      .limit(1)
      .single();

    // If error is PGRST116, it means no rows found (not an actual error)
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking restaurant existence:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Exception checking restaurant existence:', error);
    return false;
  }
}

/**
 * Update existing restaurant
 */
async function updateRestaurant(
  supabase: ReturnType<typeof createServerClient>,
  googlePlaceId: string,
  data: any,
  searchLogs: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('restaurants')
      .update({
        google_rating: data.google_rating,
        aggregate_rating: data.aggregate_rating,
        viral_mentions: data.viral_mentions,
        trending_score: data.trending_score,
        photos: data.photos,
      })
      .eq('google_place_id', googlePlaceId);

    if (error) {
      const errorMsg = `[Database] ❌ Update error: ${error.message} (Code: ${error.code})`;
      console.error(errorMsg);
      console.error('[Database] Update error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        googlePlaceId,
      });
      // Add to searchLogs so it appears in response
      searchLogs.push(errorMsg);
      if (error.details) {
        searchLogs.push(`[Database] Error details: ${error.details}`);
      }
      if (error.hint) {
        searchLogs.push(`[Database] Hint: ${error.hint}`);
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Database] Update exception:', error);
    if (error instanceof Error) {
      console.error('[Database] Exception message:', error.message);
      console.error('[Database] Exception stack:', error.stack);
    }
    return false;
  }
}

/**
 * Insert new restaurant
 */
async function insertRestaurant(
  supabase: ReturnType<typeof createServerClient>,
  data: any,
  searchLogs: string[]
): Promise<boolean> {
  try {
    // Log the data being inserted (for debugging)
    console.log('[Database] Attempting to insert:', {
      name: data.name,
      google_place_id: data.google_place_id,
      category: data.category,
      has_photos: !!data.photos?.length,
    });

    const { error, data: insertedData } = await supabase.from('restaurants').insert(data).select();

    if (error) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        restaurant_name: data.name,
        google_place_id: data.google_place_id,
      };
      const errorMsg = `[Database] ❌ Insert error: ${error.message} (Code: ${error.code})`;
      console.error(errorMsg);
      console.error('[Database] Full error details:', JSON.stringify(errorDetails, null, 2));
      // Add to searchLogs so it appears in response
      searchLogs.push(errorMsg);
      if (error.details) {
        searchLogs.push(`[Database] Error details: ${error.details}`);
      }
      if (error.hint) {
        searchLogs.push(`[Database] Hint: ${error.hint}`);
      }
      return false;
    }

    console.log('[Database] ✅ Successfully inserted:', data.name);
    return true;
  } catch (error) {
    console.error('[Database] ❌ Insert exception:', error);
    if (error instanceof Error) {
      console.error('[Database] Exception message:', error.message);
      console.error('[Database] Exception stack:', error.stack);
    }
    return false;
  }
}

/**
 * Rate limit: wait 1 second between API calls
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verify CRON_SECRET from request
 */
async function verifyCronSecret(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return { valid: false, error: 'CRON_SECRET not configured' };
  }

  // For GET: check query parameter
  // For POST: check authorization header or body
  const searchParams = request.nextUrl.searchParams;
  const authHeader = request.headers.get('authorization');
  
  const providedSecret =
    searchParams.get('secret') ||
    authHeader?.replace('Bearer ', '') ||
    (await request.json().catch(() => ({}))).secret;

  if (providedSecret !== cronSecret) {
    return { valid: false, error: 'Unauthorized' };
  }

  return { valid: true };
}

/**
 * Main seed restaurants logic
 */
async function seedRestaurants(): Promise<NextResponse> {
  // Statistics and logs (declared outside try for catch block access)
  let added = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const searchLogs: string[] = [];
  const errorLogs: string[] = [];

  try {
    // Get Google Maps API key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    console.log('[Seed Restaurants] API Key present?', !!apiKey);
    if (!apiKey) {
      console.error('[Seed Restaurants] ❌ Google Maps API key not configured');
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerClient();

    // Process each area and keyword combination
    const startMessage = `[Seed Restaurants] Starting search: ${AREAS.length} areas × ${KEYWORDS.length} keywords`;
    console.log(startMessage);
    searchLogs.push(startMessage);
    
    for (const area of AREAS) {
      const areaMessage = `[Seed Restaurants] Processing area: ${area.name} (${area.lat}, ${area.lng})`;
      console.log(areaMessage);
      searchLogs.push(areaMessage);
      
      for (const keyword of KEYWORDS) {
        const keywordMessage = `[Seed Restaurants] Searching: "${keyword}" in ${area.name}`;
        console.log(keywordMessage);
        searchLogs.push(keywordMessage);
        
        // Rate limit: 1 request per second
        await delay(1000);

        // Search Google Places
        try {
          const places = await searchGooglePlaces(keyword, area, apiKey, searchLogs);
          const foundMessage = `[Seed Restaurants] Found ${places.length} places for "${keyword}" in ${area.name}`;
          console.log(foundMessage);
          searchLogs.push(foundMessage);

          for (const place of places) {
          try {
            // Check if restaurant already exists
            const exists = await restaurantExists(supabase, place.place_id);
            const existsLog = `[Database] Restaurant ${place.name} (${place.place_id}) exists: ${exists}`;
            console.log(existsLog);
            searchLogs.push(existsLog);

            // Optionally fetch Place Details with field masks to enhance data
            // This reduces costs by only requesting needed fields
            let placeDetails: any = null;
            if (!exists) {
              // Only fetch Place Details for new restaurants to reduce API calls
              // Rate limit: wait 1 second before Place Details call
              await delay(1000);
              placeDetails = await fetchPlaceDetails(place.place_id, apiKey, searchLogs);
            }

            // Map Google Place to our schema (with optional Place Details enhancement)
            const restaurantData = mapGooglePlaceToRestaurant(place, keyword, apiKey, placeDetails);

            if (exists) {
              // Update existing restaurant
              const updateLog = `[Database] Updating restaurant: ${place.name}`;
              console.log(updateLog);
              searchLogs.push(updateLog);
              
              const success = await updateRestaurant(
                supabase,
                place.place_id,
                restaurantData,
                searchLogs
              );
              if (success) {
                updated++;
                const successLog = `[Database] ✅ Updated: ${place.name}`;
                console.log(successLog);
                searchLogs.push(successLog);
              } else {
                errors++;
                const errorMsg = `[Database] ❌ Failed to update: ${place.name} (${place.place_id})`;
                console.error(errorMsg);
                errorLogs.push(errorMsg);
              }
            } else {
              // Insert new restaurant
              const insertLog = `[Database] Inserting new restaurant: ${place.name}`;
              console.log(insertLog);
              searchLogs.push(insertLog);
              
              const success = await insertRestaurant(supabase, restaurantData, searchLogs);
              if (success) {
                added++;
                const successLog = `[Database] ✅ Added: ${place.name}`;
                console.log(successLog);
                searchLogs.push(successLog);
              } else {
                errors++;
                const errorMsg = `[Database] ❌ Failed to insert: ${place.name} (${place.place_id})`;
                console.error(errorMsg);
                errorLogs.push(errorMsg);
              }
            }
          } catch (error) {
            const errorMsg = `[Database] ❌ Exception processing place ${place.name} (${place.place_id}): ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(errorMsg);
            if (error instanceof Error && error.stack) {
              console.error('Stack trace:', error.stack);
            }
            errorLogs.push(errorMsg);
            errors++;
          }
        }
        } catch (searchError) {
          const errorMsg = `Error searching "${keyword}" in ${area.name}: ${searchError instanceof Error ? searchError.message : 'Unknown error'}`;
          console.error(errorMsg);
          errorLogs.push(errorMsg);
          errors++;
        }

      }
    }

    const completionMessage = `[Seed Restaurants] Completed processing. Stats: ${added} added, ${updated} updated, ${errors} errors`;
    console.log(completionMessage);
    searchLogs.push(completionMessage);

    return NextResponse.json({
      success: true,
      stats: {
        added,
        updated,
        skipped,
        errors,
      },
      message: `Processed ${AREAS.length} areas × ${KEYWORDS.length} keywords`,
      logs: searchLogs,
      errors: errorLogs.length > 0 ? errorLogs : undefined,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Seed Restaurants] ❌ Cron job error:', errorMessage);
    console.error('[Seed Restaurants] Full error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        logs: searchLogs || [],
        errors: errorLogs || [],
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler - for production cron jobs
 */
export async function POST(request: NextRequest) {
  const verification = await verifyCronSecret(request);
  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error },
      { status: verification.error === 'Unauthorized' ? 401 : 500 }
    );
  }

  return seedRestaurants();
}

/**
 * GET handler - for browser testing
 * Usage: http://localhost:3000/api/cron/seed-restaurants
 * 
 * NOTE: Auth check is commented out for testing. Re-enable before production!
 */
export async function GET(request: NextRequest) {
  // COMMENTED OUT FOR TESTING - Re-enable before production!
  // const verification = await verifyCronSecret(request);
  // if (!verification.valid) {
  //   return NextResponse.json(
  //     { error: verification.error },
  //     { status: verification.error === 'Unauthorized' ? 401 : 500 }
  //   );
  // }

  return seedRestaurants();
}
