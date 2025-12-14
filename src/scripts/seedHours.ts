import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import axios from 'axios';
import * as fs from 'fs';
import path from 'path';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const HOURS_CACHE_PATH = path.join(process.cwd(), 'src', 'data', 'hoursCache.json');
const PLACEID_CACHE_PATH = path.join(process.cwd(), 'src', 'data', 'placeIdCache.json');

// Cache helpers
const getCache = (cachePath: string): Record<string, any> => {
  try {
    if (fs.existsSync(cachePath)) {
      return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading cache:', e);
  }
  return {};
};

const saveCache = (cachePath: string, cache: Record<string, any>) => {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error('Error saving cache:', e);
  }
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// Search Google for place_id using restaurant name and location
const findPlaceId = async (name: string, lat: number, lng: number): Promise<string | null> => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/findplacefromtext/json',
      {
        params: {
          input: name,
          inputtype: 'textquery',
          locationbias: `point:${lat},${lng}`,
          fields: 'place_id,name',
          key: API_KEY,
        },
      }
    );

    const candidates = response.data.candidates;
    if (candidates?.length > 0) {
      return candidates[0].place_id;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Fetch hours from Google Place Details
const fetchHours = async (placeId: string): Promise<any> => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          fields: 'opening_hours,formatted_phone_number,website',
          key: API_KEY,
        },
      }
    );

    const result = response.data.result;
    if (!result?.opening_hours) {
      return {
        unavailable: true,
        permanent: true,
        cachedAt: new Date().toISOString(),
      };
    }

    return {
      weekdayText: result.opening_hours.weekday_text || [],
      periods: result.opening_hours.periods || [],
      phone: result.formatted_phone_number || null,
      website: result.website || null,
      cachedAt: new Date().toISOString(),
      permanent: true,
    };
  } catch (error) {
    return null;
  }
};

const main = async () => {
  if (!API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('🕐 Starting FULL Hours Seeding...\n');

  // Fetch ALL restaurants from API
  let restaurants: any[] = [];

  try {
    // Request ALL restaurants (no limit)
    const res = await axios.get('http://localhost:3000/api/restaurants?limit=10000');
    // Handle different response structures
    restaurants = res.data.data || res.data.restaurants || res.data || [];
    console.log(`📊 Found ${restaurants.length} total restaurants\n`);
  } catch (e) {
    console.error('❌ Could not fetch from API. Make sure dev server is running.');
    process.exit(1);
  }

  if (!restaurants.length) {
    console.error('❌ No restaurants found');
    process.exit(1);
  }

  // Show sample structure
  console.log('📋 Sample restaurant:', restaurants[0].name);
  console.log('   Has lat/lng:', !!restaurants[0].lat, !!restaurants[0].lng);
  console.log('');

  // Load caches
  const placeIdCache = getCache(PLACEID_CACHE_PATH);
  const hoursCache = getCache(HOURS_CACHE_PATH);

  console.log(`📦 Place IDs cached: ${Object.keys(placeIdCache).length}`);
  console.log(`📦 Hours cached: ${Object.keys(hoursCache).length}\n`);

  let processed = 0;
  let skipped = 0;
  let noPlaceId = 0;
  let noHours = 0;

  for (let i = 0; i < restaurants.length; i++) {
    const r = restaurants[i];
    const internalId = r.id;
    const name = r.name;
    const lat = r.lat;
    const lng = r.lng;

    const progress = `[${i + 1}/${restaurants.length}]`;

    // Step 1: Get Google place_id (from database, cache, or search)
    let placeId = r.google_place_id || r.place_id || placeIdCache[internalId]?.placeId;

    // Skip if we already have hours for this restaurant
    if (placeId && hoursCache[placeId]?.permanent) {
      skipped++;
      continue;
    }

    console.log(`${progress} 🔍 ${name}`);

    // If still no place_id, search Google
    if (!placeId && lat && lng) {
      placeId = await findPlaceId(name, lat, lng);
      
      if (placeId) {
        placeIdCache[internalId] = { placeId, name };
        saveCache(PLACEID_CACHE_PATH, placeIdCache);
        console.log(`   📍 Found place_id: ${placeId.slice(0, 20)}...`);
      } else {
        console.log(`   ⚠️ Could not find on Google`);
        noPlaceId++;
        placeIdCache[internalId] = { placeId: null, name, notFound: true };
        saveCache(PLACEID_CACHE_PATH, placeIdCache);
        await delay(50);
        continue;
      }
      
      await delay(50);  // Rate limit for findPlace
    }

    if (!placeId) {
      noPlaceId++;
      continue;
    }

    // Step 2: Get hours (from cache or fetch)
    if (hoursCache[placeId]?.permanent) {
      console.log(`   ⏭️ Hours already cached`);
      skipped++;
      continue;
    }

    const hours = await fetchHours(placeId);

    if (hours) {
      hoursCache[placeId] = hours;
      saveCache(HOURS_CACHE_PATH, hoursCache);

      if (hours.unavailable) {
        noHours++;
        console.log(`   ⚠️ No hours on Google`);
      } else {
        processed++;
        console.log(`   ✅ ${hours.weekdayText?.[0] || 'Saved'}`);
      }
    }

    await delay(50);  // Rate limit for details
  }

  console.log('\n🎉 Hours Seeding Complete!');
  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ⏭️ Skipped (cached): ${skipped}`);
  console.log(`   ⚠️ No place_id found: ${noPlaceId}`);
  console.log(`   ⚠️ No hours on Google: ${noHours}`);
  console.log(`   📦 Total place IDs: ${Object.keys(placeIdCache).length}`);
  console.log(`   📦 Total hours: ${Object.keys(hoursCache).length}`);

  process.exit(0);
};

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
