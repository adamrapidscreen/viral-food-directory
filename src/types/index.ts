export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: 'hawker' | 'restaurant' | 'cafe' | 'foodcourt';
  googleRating?: number;
  tripadvisorRating?: number;
  aggregateRating: number;
  mustTryDish: string;
  mustTryConfidence: number;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  operatingHours: Record<string, string>;
  viralMentions: number;
  trendingScore: number;
  photos: string[];
  isHalal: boolean;
  halalCertNumber?: string;
  distance?: number;
  // TripAdvisor enrichment fields
  tripAdvisorRank?: string; // "#3 of 500 Dessert Places in KL"
  tripAdvisorPriceText?: string; // "RM 15 - RM 25"
  tripAdvisorTags?: string[]; // ["Halal", "Vegetarian Friendly"]
  tripAdvisorTopReviewSnippet?: string; // "Best satay I've ever had..."
  tripAdvisorEnriched?: boolean;
  tripAdvisorEnrichedAt?: string; // ISO timestamp
}

export interface TrendingDish {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  restaurantIsHalal?: boolean;
  dishName: string;
  description: string;
  price: number;
  mentionCount: number;
  recommendPercentage: number;
  viralScore: number;
  photoUrl: string;
}

export interface Review {
  id: string;
  restaurantId: string;
  source: 'google' | 'tripadvisor';
  author: string;
  rating: number;
  text: string;
  createdDate: string;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: 'hawker' | 'restaurant' | 'cafe' | 'foodcourt';
  rating: number;
  trendingScore: number;
  isTrending: boolean;
  isHalal: boolean;
}

export interface FilterState {
  nearMe: boolean;
  openNow: boolean;
  category: string | null;
  priceRange: string | null;
  halal: boolean;
  searchQuery: string;
  editorialPicks: boolean;
}

export interface ApiResponse<T> {
  data: T;
  source: 'cache' | 'database' | 'memory-cache' | 'supabase-cache';
  count?: number;
  error?: string;
}
