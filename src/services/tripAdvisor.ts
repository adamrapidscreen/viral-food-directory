/**
 * TripAdvisor scraping service using ScrapingBee
 * Extracts ranking, price, tags, and review snippets from TripAdvisor
 * 
 * NOTE: Runtime uses cache file (getTripAdvisorData)
 * searchTripAdvisor is only used by seeding script
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { toSlug } from '@/utils/slug';

// Import cache data - Next.js will handle JSON imports
let cacheData: Record<string, any> = {};
try {
  // Dynamic import for JSON (works in both client and server)
  cacheData = require('@/data/tripAdvisorCache.json');
} catch (error) {
  // Cache file doesn't exist yet, use empty object
  cacheData = {};
}

export interface TripAdvisorData {
  rank?: string; // "#3 of 500 Dessert Places in KL"
  priceText?: string; // "RM 15 - RM 25"
  tags?: string[]; // ["Halal", "Vegetarian Friendly"]
  topReviewSnippet?: string; // "Best satay I've ever had..."
}

interface CacheEntry {
  priceRange?: string;
  ranking?: string;
  tags?: string[];
  reviewSnippet?: string;
  lastUpdated: string;
}

type CacheData = Record<string, CacheEntry>;

/**
 * Get TripAdvisor data from cache (runtime - 0 credits)
 * @param restaurantName - Name of the restaurant
 * @returns TripAdvisor data or null if not in cache
 */
export function getTripAdvisorData(restaurantName: string): TripAdvisorData | null {
  const slug = toSlug(restaurantName);
  const cache = cacheData as unknown as CacheData;
  const cached = cache[slug];
  
  if (!cached) {
    return null;
  }
  
  return {
    rank: cached.ranking,
    priceText: cached.priceRange,
    tags: cached.tags,
    topReviewSnippet: cached.reviewSnippet,
  };
}

/**
 * Search TripAdvisor for a restaurant and extract relevant data
 * NOTE: This function is ONLY used by the seeding script (seedTripAdvisor.ts)
 * For runtime use, call getTripAdvisorData() instead (reads from cache, 0 credits)
 * 
 * @param restaurantName - Name of the restaurant
 * @param city - City name (e.g., "Kuala Lumpur")
 * @param apiKey - ScrapingBee API key
 * @returns TripAdvisor data or null if scraping fails
 */
export async function searchTripAdvisor(
  restaurantName: string,
  city: string,
  apiKey: string
): Promise<TripAdvisorData | null> {
  if (!apiKey) {
    console.error("❌ [TripAdvisor Service] No ScrapingBee API Key found!");
    return null;
  }

  // 1. Clean the query (remove emojis, extra spaces)
  const cleanQuery = `${restaurantName} ${city}`.replace(/[^\w\s]/gi, '').trim();
  
  // 2. Construct the Target URL manually
  const targetUrl = `https://www.tripadvisor.com.my/Search?q=${encodeURIComponent(cleanQuery)}`;

  console.log(`🔍 [TripAdvisor Service] Target: ${targetUrl}`);

  try {
    // 3. Call ScrapingBee with 'params' to let Axios handle the API key encoding safely
    const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
      params: {
        api_key: apiKey,
        url: targetUrl,  // ScrapingBee expects the target URL here
        render_js: 'false', // Keep false for speed
        block_ads: 'true',
        premium_proxy: 'true', // Use premium proxy for better success rate (used in seeding)
      },
      timeout: 20000, // 20 second timeout
      // 4. Important: Prevent Axios from throwing on 404s so we can handle them gracefully
      validateStatus: (status) => status < 500,
    });

    // 1. Log the status to debug
    console.log(`🐝 [TripAdvisor Service] ScrapingBee Status: ${response.status}`);

    // 2. Check if we actually got HTML
    if (!response.data || typeof response.data !== 'string') {
      console.warn("⚠️ [TripAdvisor Service] ScrapingBee returned no HTML data:", response.data);
      return null;
    }

    const html = response.data;
    
    // Check for error messages in response
    if (html.includes('Daily limit reached') || 
        html.includes('Validation error') ||
        html.includes('API key') ||
        html.length < 100) {
      console.warn("⚠️ [TripAdvisor Service] ScrapingBee returned error or empty response");
      console.warn(`   HTML length: ${html.length} characters`);
      if (html.length < 500) {
        console.warn(`   Response preview: ${html.substring(0, 200)}`);
      }
      return null;
    }

    // Use cheerio to parse HTML
    const $ = cheerio.load(html);
    
    // 4. DEBUG: Print the page title to see if we were blocked
    const pageTitle = $('title').text().trim();
    console.log(`📄 [TripAdvisor Service] Page Title: "${pageTitle}"`);

    // Check if we were blocked or redirected
    if (pageTitle.includes('Access Denied') || 
        pageTitle.includes('Blocked') ||
        pageTitle.includes('Error') ||
        pageTitle.includes('403') ||
        pageTitle.includes('404')) {
      console.warn("⚠️ [TripAdvisor Service] Page appears to be blocked or error page");
      return null;
    }

    // Check for common TripAdvisor search result indicators
    const hasSearchResults = $('.result-card, .location-meta-block, .search-results, [data-test-target]').length > 0;
    if (!hasSearchResults) {
      console.warn("⚠️ [TripAdvisor Service] No search result elements found. Page structure may have changed or no results.");
      console.warn(`   HTML length: ${html.length} characters`);
      // Still attempt extraction with fallback regex patterns
    } else {
      console.log(`✅ [TripAdvisor Service] Found ${$('.result-card, .location-meta-block, .search-results, [data-test-target]').length} potential result elements`);
    }
    
    // Extract TripAdvisor data using cheerio selectors
    return extractTripAdvisorData($, html, restaurantName);
  } catch (error: any) {
    // 5. Better Error Logging
    if (axios.isAxiosError(error)) {
      console.error("❌ [TripAdvisor Service] Axios Error:", error.message);
      if (error.response) {
        console.error("   Status:", error.response.status);
        console.error("   Response Data:", error.response.data);
      }
      if (error.request) {
        console.error("   Request made but no response received");
        console.error("   Request URL:", error.config?.url);
      }
      if (error.code === 'ECONNABORTED') {
        console.error("   Request timeout after 20 seconds");
      }
    } else {
      console.error("❌ [TripAdvisor Service] Unknown Error:", error);
    }
    return null;
  }
}

/**
 * Extract TripAdvisor data from HTML using cheerio
 * @param $ - Cheerio instance with loaded HTML
 * @param html - Raw HTML content for regex fallbacks
 * @param restaurantName - Restaurant name for validation
 * @returns Extracted TripAdvisor data
 */
function extractTripAdvisorData(
  $: ReturnType<typeof cheerio.load>,
  html: string,
  restaurantName: string
): TripAdvisorData | null {
  const data: TripAdvisorData = {};

  try {
    // Method 1: Text pattern matching across all elements
    $('*').each((i, el) => {
      const text = $(el).text();
      
      // Find price range (e.g., "RM 15 - RM 40" or "$$ - $$$")
      if (!data.priceText) {
        const priceMatch = text.match(/(?:RM|MYR)\s*\d+\s*[-–]\s*(?:RM|MYR)?\s*\d+/i);
        if (priceMatch) {
          data.priceText = priceMatch[0];
        }
      }
      
      // Find ranking (e.g., "#5 of 1,234 Restaurants")
      if (!data.rank) {
        const rankMatch = text.match(/#\d+\s+of\s+[\d,]+/i);
        if (rankMatch) {
          data.rank = rankMatch[0];
        }
      }
    });

    // Method 2: Look for specific data attributes TripAdvisor uses
    $('[data-test]').each((i, el) => {
      const testId = $(el).attr('data-test');
      const text = $(el).text().trim();
      
      if (testId?.includes('price') && !data.priceText) {
        data.priceText = text;
      }
      if (testId?.includes('rank') && !data.rank) {
        data.rank = text;
      }
      if (testId?.includes('review') && !data.topReviewSnippet && text.length > 50) {
        data.topReviewSnippet = text.substring(0, 300);
      }
    });

    // Method 3: Look for spans with $ symbols (price indicators)
    $('span').each((i, el) => {
      const text = $(el).text().trim();
      if (/^[\$]{1,4}(\s*[-–]\s*[\$]{1,4})?$/.test(text) && !data.priceText) {
        data.priceText = text; // e.g., "$$ - $$$"
      }
    });

    // Fallback: Regex patterns for ranking if not found yet
    if (!data.rank) {
      const rankPatterns = [
        /#(\d+)\s+of\s+(\d+)\s+[^<]*in\s+([^<]+)/i,
        /Ranked\s+#(\d+)\s+of\s+(\d+)/i,
        /#(\d+)\s+of\s+(\d+)/i,
      ];

      for (const pattern of rankPatterns) {
        const match = html.match(pattern);
        if (match) {
          if (match[3]) {
            data.rank = `#${match[1]} of ${match[2]} ${match[3]}`;
          } else {
            data.rank = `#${match[1]} of ${match[2]}`;
          }
          break;
        }
      }
    }

    // Fallback: Regex patterns for price if not found yet
    if (!data.priceText) {
      const pricePatterns = [
        /RM\s*(\d+)\s*-\s*RM\s*(\d+)/i,
        /RM\s*(\d+)\s*to\s*RM\s*(\d+)/i,
        /RM\s*(\d+)\s*per\s+person/i,
        /PRICE_RANGE[^>]*>([^<]+)/i,
        /price[^>]*>([^<]*RM[^<]+)/i,
      ];

      for (const pattern of pricePatterns) {
        const match = html.match(pattern);
        if (match) {
          if (match[1] && match[2]) {
            data.priceText = `RM ${match[1]} - RM ${match[2]}`;
          } else if (match[1]) {
            data.priceText = match[1].trim();
          }
          break;
        }
      }
    }

    // Extract tags/attributes using cheerio
    const tags: string[] = [];
    const tagSelectors = [
      '[data-test-target="amenity-badge"]',
      '.amenity',
      '.badge',
    ];

    tagSelectors.forEach((selector) => {
      $(selector).each((_, el) => {
        const tag = $(el).text().trim();
        if (tag && !tags.includes(tag) && tag.length < 50) {
          tags.push(tag);
        }
      });
    });

    // Fallback regex for tags
    if (tags.length === 0) {
      const tagPatterns = [
        /Halal/gi,
        /Vegetarian\s+Friendly/gi,
        /Vegan\s+Options/gi,
      ];

      for (const pattern of tagPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          const tag = match[0]?.trim();
          if (tag && !tags.includes(tag)) {
            tags.push(tag);
          }
        }
      }
    }

    // Clean up tags (remove duplicates, normalize)
    const uniqueTags = Array.from(new Set(tags.map(t => t.trim()).filter(t => t.length > 0)));
    if (uniqueTags.length > 0) {
      data.tags = uniqueTags.slice(0, 5); // Limit to 5 tags
    }

    // Extract top review snippet using cheerio
    const reviewSelectors = [
      '[data-test-target="review-text"]',
      '.partial_entry',
      '.reviewText',
    ];

    for (const selector of reviewSelectors) {
      const reviewText = $(selector).first().text().trim();
      if (reviewText && reviewText.length > 50 && reviewText.length < 300) {
        data.topReviewSnippet = reviewText;
        break;
      }
    }

    // Fallback regex for review snippet
    if (!data.topReviewSnippet) {
      const reviewPatterns = [
        /<p[^>]*class="[^"]*partial_entry[^"]*"[^>]*>([^<]{50,300})<\/p>/i,
        /<div[^>]*class="[^"]*review[^"]*"[^>]*>([^<]{50,300})<\/div>/i,
        /"reviewText":"([^"]{50,300})"/i,
      ];

      for (const pattern of reviewPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const snippet = match[1]
            .replace(/<[^>]+>/g, '') // Remove HTML tags
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
          
          if (snippet.length > 50 && snippet.length < 300) {
            data.topReviewSnippet = snippet;
            break;
          }
        }
      }
    }

    // Log findings for debugging
    console.log(`💰 [TripAdvisor Service] Price: ${data.priceText || 'Not found'}`);
    console.log(`🏆 [TripAdvisor Service] Rank: ${data.rank || 'Not found'}`);

    // Return data if we found at least one field
    if (data.rank || data.priceText || data.tags?.length || data.topReviewSnippet) {
      console.log(`✅ [TripAdvisor Service] Extracted TripAdvisor data for ${restaurantName}:`, data);
      return data;
    }

    console.log(`⚠️ [TripAdvisor Service] No TripAdvisor data found for ${restaurantName}`);
    return null;
  } catch (error) {
    console.error('❌ [TripAdvisor Service] Error extracting TripAdvisor data:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    return null;
  }
}
