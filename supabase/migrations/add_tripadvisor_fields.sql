-- Migration: Add TripAdvisor enrichment fields to restaurants table
-- Created: 2024-12-17

-- Add TripAdvisor columns to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS tripadvisor_rank TEXT,
ADD COLUMN IF NOT EXISTS tripadvisor_price_text TEXT,
ADD COLUMN IF NOT EXISTS tripadvisor_tags TEXT[],
ADD COLUMN IF NOT EXISTS tripadvisor_top_review_snippet TEXT,
ADD COLUMN IF NOT EXISTS tripadvisor_enriched BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tripadvisor_enriched_at TIMESTAMP;

-- Add index on tripadvisor_enriched_at for faster queries
CREATE INDEX IF NOT EXISTS idx_restaurants_tripadvisor_enriched_at 
ON restaurants(tripadvisor_enriched_at);

-- Add comment to columns for documentation
COMMENT ON COLUMN restaurants.tripadvisor_rank IS 'TripAdvisor ranking text (e.g., "#3 of 500 Dessert Places in KL")';
COMMENT ON COLUMN restaurants.tripadvisor_price_text IS 'TripAdvisor price range text (e.g., "RM 15 - RM 25")';
COMMENT ON COLUMN restaurants.tripadvisor_tags IS 'Array of TripAdvisor tags/attributes (e.g., ["Halal", "Vegetarian Friendly"])';
COMMENT ON COLUMN restaurants.tripadvisor_top_review_snippet IS 'Top review snippet from TripAdvisor';
COMMENT ON COLUMN restaurants.tripadvisor_enriched IS 'Whether restaurant has been enriched with TripAdvisor data';
COMMENT ON COLUMN restaurants.tripadvisor_enriched_at IS 'Timestamp when restaurant was last enriched with TripAdvisor data';
