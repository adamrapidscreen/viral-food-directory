# Database Error Diagnostic Report

## Root Cause Analysis

Based on the code analysis, the **75 errors** are likely caused by **database schema mismatches**. Here are the most probable issues:

### 🔴 **PRIMARY ISSUE: Missing `google_place_id` Column**

The code is trying to:
1. **Insert** restaurants with `google_place_id: place.place_id` (line 220)
2. **Query** restaurants using `.eq('google_place_id', googlePlaceId)` (line 252)
3. **Update** restaurants using `.eq('google_place_id', googlePlaceId)` (line 288)

**If this column doesn't exist in your Supabase `restaurants` table, ALL operations will fail.**

### 🔴 **SECONDARY ISSUES: Column Name Mismatches**

The code uses **snake_case** column names, but your database might use different names:

| Code Expects | Database Might Have |
|-------------|---------------------|
| `google_place_id` | ❌ Missing or different name |
| `google_rating` | `googleRating` (camelCase) |
| `aggregate_rating` | `aggregateRating` (camelCase) |
| `must_try_dish` | `mustTryDish` (camelCase) |
| `must_try_confidence` | `mustTryConfidence` (camelCase) |
| `price_range` | `priceRange` (camelCase) |
| `operating_hours` | `operatingHours` (camelCase) |
| `viral_mentions` | `viralMentions` (camelCase) |
| `trending_score` | `trendingScore` (camelCase) |
| `is_halal` | `isHalal` (camelCase) |
| `halal_certified` | `halalCertified` (camelCase) |
| `halal_cert_number` | `halalCertNumber` (camelCase) |

### 🔴 **TERTIARY ISSUES: Data Type Mismatches**

1. **`photos`** - Code sends `string[]` but database might expect `JSONB` or `TEXT[]`
2. **`operating_hours`** - Code sends `{}` (empty object) but database might expect `JSONB` or specific format
3. **`halal_cert_number`** - Code sends `null` but column might be `NOT NULL`

## How to Verify

### Step 1: Check Your Supabase Database Schema

1. Go to your Supabase dashboard
2. Navigate to **Table Editor** → **restaurants** table
3. Check if these columns exist:
   - ✅ `google_place_id` (TEXT or VARCHAR)
   - ✅ `google_rating` (NUMERIC or DOUBLE PRECISION)
   - ✅ `aggregate_rating` (NUMERIC or DOUBLE PRECISION)
   - ✅ `photos` (JSONB or TEXT[])
   - ✅ `operating_hours` (JSONB)

### Step 2: Check the Actual Error Messages

Run the seed script again and look for these specific error codes in the response:

- **`42703`** = Column does not exist
- **`23502`** = NOT NULL violation (missing required field)
- **`23505`** = Unique constraint violation
- **`42804`** = Data type mismatch

### Step 3: Review the Enhanced Logs

The updated code now includes detailed error messages in the API response. Check:
- `logs` array - Shows all operations
- `errors` array - Shows specific database errors with codes

## Recommended Fix

### Option 1: Add Missing Column (If `google_place_id` is missing)

Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_google_place_id 
ON restaurants(google_place_id);
```

### Option 2: Update Column Names (If using camelCase)

If your database uses camelCase, you have two options:

**A. Update the database to use snake_case (Recommended)**
```sql
-- Rename columns to snake_case
ALTER TABLE restaurants RENAME COLUMN "googleRating" TO google_rating;
ALTER TABLE restaurants RENAME COLUMN "aggregateRating" TO aggregate_rating;
-- ... etc for all columns
```

**B. Update the code to use camelCase (Not recommended - breaks consistency)**

### Option 3: Verify Data Types

Ensure these columns have the correct types:

```sql
-- Check current schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'restaurants'
ORDER BY ordinal_position;
```

Expected types:
- `photos`: `jsonb` or `text[]`
- `operating_hours`: `jsonb`
- `google_place_id`: `text` or `varchar`
- `google_rating`: `numeric` or `double precision`
- `aggregate_rating`: `numeric` or `double precision`

## Next Steps

1. **Run the seed script again** and check the `errors` array in the JSON response
2. **Share the error codes** (e.g., `42703`, `23502`) so I can provide specific fixes
3. **Check your Supabase table schema** and compare with the expected schema above
