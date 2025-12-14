# Credit-Efficient TripAdvisor Cache System

## Overview
Replace runtime ScrapingBee API calls with a local JSON cache system. Runtime uses 0 credits by reading from cache, while a manual seeding script populates the cache one-time.

## Implementation Steps

### 1. Create Cache File
**File: `src/data/tripAdvisorCache.json`**
- Start with empty object: `{}`
- Structure: `{ "restaurant-name-slug": { priceRange, ranking, tags, reviewSnippet, lastUpdated } }`

### 2. Create Seeding Script
**File: `src/scripts/seedTripAdvisor.ts`**
- Import top 20 restaurant names (hardcoded list)
- For each restaurant:
  - Check if already in cache → skip
  - Call ScrapingBee with `premium_proxy: true`
  - Save result to `tripAdvisorCache.json`
  - Add 3-second delay between requests
- Run with: `npm run seed-tripadvisor`

### 3. Update TripAdvisor Service
**File: `src/services/tripAdvisor.ts`**
- Add `getTripAdvisorData(restaurantName: string)` function:
  - Import cache from JSON file
  - Generate slug: `restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-')`
  - Return cached data or null
- Keep `searchTripAdvisor` function (used by seeding script only)
- Keep `extractTripAdvisorData` function (used by seeding script)

### 4. Update RestaurantCard Component
**File: `src/components/RestaurantCard.tsx`**
- Remove `useTripAdvisor` hook import and usage
- Remove IntersectionObserver logic (cardRef, visibilityTimerRef, useEffect)
- Import `getTripAdvisorData` from service
- Call `getTripAdvisorData(restaurant.name)` directly
- If data exists → show TripAdvisor badge
- If null → don't show badge (no loading state)

### 5. Update Enrichment API Route
**File: `src/app/api/restaurants/[id]/enrich/route.ts`**
- Remove ScrapingBee API call
- Remove `searchTripAdvisor` import
- Import `getTripAdvisorData` from service
- Read from cache instead of making API call
- Update database with cached data if found

### 6. Update Package.json
**File: `package.json`**
- Add script: `"seed-tripadvisor": "tsx src/scripts/seedTripAdvisor.ts"`

## Benefits
- Runtime: 0 credits (reads from local JSON)
- Seeding: ~500 credits total (one-time for top 20)
- Fast: Instant cache lookup vs API latency
- Reliable: No rate limits or API failures at runtime
