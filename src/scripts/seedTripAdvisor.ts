/**
 * Manual seeding script for TripAdvisor cache
 * 
 * Fetches TripAdvisor data for top restaurants and saves to cache file
 * Run manually: npm run seed-tripadvisor
 * 
 * Uses ScrapingBee with premium_proxy for better success rate
 * Includes 3-second delay between requests to avoid rate limits
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ... rest of imports below


import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toSlug } from '../utils/slug';

// Get __dirname equivalent for ES modules (works with tsx)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use environment variable or paste directly for manual runs
const API_KEY = process.env.SCRAPINGBEE_API_KEY || 'YOUR_SCRAPINGBEE_KEY';
const CACHE_PATH = path.join(process.cwd(), 'src', 'data', 'tripAdvisorCache.json');

interface CacheEntry {
  priceRange?: string;
  ranking?: string;
  tags?: string[];
  reviewSnippet?: string;
  lastUpdated: string;
}

type CacheData = Record<string, CacheEntry>;

// Top restaurants to seed (edit this list after running getTopRestaurants.ts)
const TOP_RESTAURANTS = [
  // Original list
  'Village Park Restaurant',
  'Restoran Rebung',
  'Nasi Kandar Pelita',
  'Ashhryshoshedap',
  'Kopitiam Kita',
  'Kopi Hutan',
  'MADE ON MONDAY HQ',
  'Nimmies Pastry Cafe',
  'JIBRIL Bangi',
  'Biru Biru On The Island',
  'Giggles & Geeks',
  'Sugeh Hill Exclusive Eco Resort, Janda Baik',
  'PINWHEEL RESTO CAFE',
  'Mohd Chan Restaurant @ Putrajaya',
  'Pauline\'s',
  'Beena\'s Signature Sky Avenue',
  'My Humble Bowl',
  'Halab KL Arabic Restaurant',
  'The Humble Food Company Bangi Restaurant | Western Food | Asian Fusion Cafe',
  'POKOK LaLaport',
  'Restoran Baba Kaya • One Malaysian Cuisine',
  'Mr.Dakgalbi @ SkyAvenue (in Genting HighLands)',
  'NALE - The Nasi Lemak Company, Midvalley',
  // New additions from getTopRestaurants.ts
  'Nasi Lemak Antarabangsa',
  'Restoran Mohamed Raffee Nasi Kandar',
  'Gaya Street Market',
  'Kota Kinabalu Central Market',
  'Restoran Yut Kee',
  'Luckin Kopi',
  'Jalan Alor Food Street',
  'Restoran Nasi Kandar Pelita',
  'Nasi Lemak Wanjo Kg Baru',
  'Lot 10 Hutong',
  'Deens Maju Nasi Kandar',
  'Penang Road Famous Teochew Chendul',
  'Serai • Pavilion Kuala Lumpur',
  'Kunafa Finger\'s branch 1',
  'Kedai Mamak Husin',
  'Madam Kwan\'s Imago',
  'Chong Pang Nasi Lemak',
  'Restaurant Wadi Hana Elarabi',
  'Restoran New Holly Wood',
  'Plan B Restaurant | Ipoh',
  'The Botanist',
  'Ceylonese Restaurant Sdn Bhd',
  'Siniawan Night Market',
  'Penang Chendul IOI City Mall Putrajaya',
  'House of Grill Putrajaya',
  'Medan Selera Presint 9',
  'Ekues Cabin Cafe',
  'Homst Putrajaya (Chinese Muslim Restaurant)',
  'Madam Kwan\'s IOI City Mall 2',
  'Cendol BMI Sejak 1985 Nilai',
  'Kendong Char Kuey Teow Senawang',
  'POKOK KL Cafe',
  'Damascus Bukit Bintang',
  'Madam Kwan\'s',
  'Dancing Fish • Bangsar Shopping Centre',
  'Pasar Payang',
  'Nasi Dagang Atas Tol - Kg Atas Tol',
  'Iman Koeyteow Kerang',
  'hussain\'s Nasi Kandar (Alor Setar)',
  'Siti Khadijah Market',
  'Cendol Kampung Hulu',
  'The Daily Fix Cafe',
  'Cafe Chef Wan @ The Shore Melaka',
  'ATLANTIC NYONYA @ MELAKA RAYA',
  'McQuek\'s Satay Celup',
  'Bess Kopitiam • Pork Free Restaurant',
  'Calanthe Art Cafe',
  '8272 Barakah Corner',
  'Jiki Food Court',
  'Justberrys Dessert House',
  'Zack Koay Teow Kerang',
  'Genting SkyWorlds Theme Park',
  'Lemang To\'ki',
  'Memang Meow - Genting Permai',
  'Makanan Enak Genting Permai',
  'Nasi Kandar Kelasik Signature',
  'Beena\'s Genting Grand',
  'Wildseed Cafe & Bistro at 1-Altitude Melaka',
  'Cendol Seri Serkam (Pedamar)',
];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const scrapeOne = async (name: string) => {
  const url = `https://www.tripadvisor.com.my/Search?q=${encodeURIComponent(name + ' Kuala Lumpur')}`;
  
  const res = await axios.get('https://app.scrapingbee.com/api/v1/', {
    params: {
      api_key: API_KEY,
      url,
      premium_proxy: 'true',
      country_code: 'my',
      render_js: 'false',
      block_ads: 'true',
    },
    timeout: 30000,
    validateStatus: (status) => status < 500,
  });

  if (res.status !== 200) {
    throw new Error(`ScrapingBee returned status ${res.status}`);
  }

  const $ = cheerio.load(res.data);
  
  // Basic extraction - adjust selectors as needed
  const text = $('body').text();
  const priceMatch = text.match(/(?:RM|MYR)\s*\d+\s*[-–]\s*(?:RM|MYR)?\s*\d+/i);
  const rankMatch = text.match(/#\d+\s+of\s+[\d,]+/i);
  
  // Try to find tags (Halal, Vegetarian Friendly, etc.)
  const tags: string[] = [];
  const tagPatterns = ['Halal', 'Vegetarian Friendly', 'Vegan Options', 'Gluten Free Options'];
  tagPatterns.forEach(tag => {
    if (text.includes(tag)) {
      tags.push(tag);
    }
  });

  // Try to extract review snippet (first review text found)
  const reviewMatch = text.match(/"([^"]{50,200})"/);
  const reviewSnippet = reviewMatch ? reviewMatch[1] : undefined;

  return {
    priceRange: priceMatch?.[0] || undefined,
    ranking: rankMatch?.[0] || undefined,
    tags: tags.length > 0 ? tags : undefined,
    reviewSnippet,
    lastUpdated: new Date().toISOString(),
  } as CacheEntry;
};

const main = async () => {
  if (API_KEY === 'YOUR_SCRAPINGBEE_KEY') {
    console.error('❌ Please set SCRAPINGBEE_API_KEY environment variable or update API_KEY in script');
    process.exit(1);
  }

  if (TOP_RESTAURANTS.length === 0) {
    console.error('❌ No restaurants to seed. Please update TOP_RESTAURANTS array.');
    process.exit(1);
  }

  console.log(`🚀 Starting TripAdvisor seeding for ${TOP_RESTAURANTS.length} restaurants...\n`);

  const cache: CacheData = fs.existsSync(CACHE_PATH) 
    ? JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')) 
    : {};

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const name of TOP_RESTAURANTS) {
    const slug = toSlug(name);
    
    if (cache[slug]) {
      console.log(`⏭️  Skipping ${name} (cached)`);
      skipped++;
      continue;
    }

    console.log(`🔍 Scraping ${name}...`);
    try {
      cache[slug] = await scrapeOne(name);
      console.log(`✅ Done: ${name}`);
      if (cache[slug].priceRange) console.log(`   Price: ${cache[slug].priceRange}`);
      if (cache[slug].ranking) console.log(`   Rank: ${cache[slug].ranking}`);
      processed++;
    } catch (e: any) {
      console.log(`❌ Failed: ${name} - ${e.message || e}`);
      errors++;
    }

    // Save cache after each request (in case script is interrupted)
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
    
    // 3s delay between requests (except for last one)
    if (name !== TOP_RESTAURANTS[TOP_RESTAURANTS.length - 1]) {
      await delay(3000);
    }
  }

  console.log(`\n📊 Seeding complete!`);
  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`\n💾 Cache saved to ${CACHE_PATH}`);
  
  process.exit(0);
};

main();
