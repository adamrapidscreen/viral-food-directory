/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers, rounded to 1 decimal place
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Format price range symbol to readable text
 */
export function formatPrice(priceRange: string): string {
  switch (priceRange) {
    case '$':
      return 'Budget';
    case '$$':
      return 'Moderate';
    case '$$$':
      return 'Pricey';
    case '$$$$':
      return 'Premium';
    default:
      return priceRange;
  }
}

/**
 * Check if restaurant is currently open based on operating hours
 * Returns null if no hours data available (unknown status)
 */
export function isOpenNow(operatingHours: Record<string, string> | null | undefined): boolean | null {
  // Return null if no hours data (unknown status)
  if (!operatingHours || Object.keys(operatingHours).length === 0) {
    return null; // Unknown, not closed
  }

  const now = new Date();
  const dayNames = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const currentDay = dayNames[now.getDay()].toLowerCase();
  const hours = operatingHours[currentDay];

  if (!hours || hours.toLowerCase() === 'closed') {
    return false;
  }

  // Parse time string like "6am-2pm" or "10:00am-10:00pm"
  const timePattern = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
  const match = hours.match(timePattern);

  if (!match) {
    return false;
  }

  const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = match;

  // Convert to 24-hour format
  const convertTo24Hour = (hour: string, min: string, period: string): number => {
    let h = parseInt(hour, 10);
    const m = min ? parseInt(min, 10) : 0;
    if (period.toLowerCase() === 'pm' && h !== 12) {
      h += 12;
    } else if (period.toLowerCase() === 'am' && h === 12) {
      h = 0;
    }
    return h * 60 + m; // Convert to minutes for easier comparison
  };

  const startMinutes = convertTo24Hour(startHour, startMin || '0', startPeriod);
  const endMinutes = convertTo24Hour(endHour, endMin || '0', endPeriod);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Handle case where closing time is next day (e.g., 10pm-2am)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Calculate trending score based on viral mentions, rating, and review count
 * Returns a score from 0-100
 */
export function calculateTrendingScore(
  viralMentions: number,
  googleRating: number,
  reviewCount: number
): number {
  const score =
    viralMentions * 0.4 +
    googleRating * 10 * 0.3 +
    Math.log10(reviewCount + 1) * 10 * 0.3;
  return Math.min(100, Math.max(0, Math.round(score * 10) / 10));
}

/**
 * Get halal label based on halal status and certification
 */
export function getHalalLabel(
  isHalal: boolean,
  isCertified?: boolean
): string {
  if (isHalal && isCertified) {
    return '✅ Halal Certified';
  }
  if (isHalal) {
    return '✅ Halal';
  }
  return '';
}

/**
 * Format review count to readable string (e.g., 1200 -> "1.2K")
 */
export function formatReviewCount(count: number): string {
  if (count === 0) return '0';
  if (count < 1000) return count.toString();
  if (count < 1000000) {
    const k = count / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  const m = count / 1000000;
  return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
}

/**
 * Format date to relative time or readable date
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get current day's operating hours
 * Returns null if no hours data available
 */
export function getCurrentDayHours(operatingHours: Record<string, string> | null | undefined): string | null {
  if (!operatingHours || Object.keys(operatingHours).length === 0) {
    return null; // No hours data available
  }

  const now = new Date();
  const dayNames = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const currentDay = dayNames[now.getDay()].toLowerCase();
  return operatingHours[currentDay] || 'Closed';
}

/**
 * Format relative time for operating hours
 * Returns friendly text like "Closes in 1 hour" or "Opens Tue at 10 AM"
 * @param operatingHours - Record of day -> hours string
 * @returns Formatted relative time string or null
 */
export function formatRelativeTime(operatingHours: Record<string, string> | null | undefined): string | null {
  if (!operatingHours || Object.keys(operatingHours).length === 0) {
    return null;
  }

  const now = new Date();
  const dayNames = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDay = dayNames[now.getDay()].toLowerCase();
  const currentHours = operatingHours[currentDay];

  // Check if open 24 hours
  if (currentHours && /24|all day|open 24/i.test(currentHours)) {
    return 'Open 24 hours';
  }

  // Parse time string like "6am-2pm" or "10:00am-10:00pm"
  const timePattern = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
  const match = currentHours?.match(timePattern);

  if (!match) {
    if (currentHours?.toLowerCase() === 'closed') {
      // Find next open day
      const currentDayIndex = now.getDay();
      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDay = dayNames[nextDayIndex];
        const nextHours = operatingHours[nextDay];
        
        if (nextHours && nextHours.toLowerCase() !== 'closed') {
          const nextMatch = nextHours.match(timePattern);
          if (nextMatch) {
            const openHour = parseInt(nextMatch[1], 10);
            const openMin = nextMatch[2] ? parseInt(nextMatch[2], 10) : 0;
            const openPeriod = nextMatch[3].toLowerCase();
            
            let openHour24 = openHour;
            if (openPeriod === 'pm' && openHour !== 12) {
              openHour24 += 12;
            } else if (openPeriod === 'am' && openHour === 12) {
              openHour24 = 0;
            }
            
            const openTime = `${openHour}:${openMin.toString().padStart(2, '0')}`;
            const period = openPeriod.toUpperCase();
            const dayName = dayShortNames[nextDayIndex];
            
            return `Opens ${dayName} at ${openHour}${openMin > 0 ? `:${openMin.toString().padStart(2, '0')}` : ''} ${period}`;
          }
        }
      }
      return 'Closed';
    }
    return currentHours || null;
  }

  const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = match;

  // Convert to 24-hour format (minutes since midnight)
  const convertToMinutes = (hour: string, min: string, period: string): number => {
    let h = parseInt(hour, 10);
    const m = min ? parseInt(min, 10) : 0;
    if (period.toLowerCase() === 'pm' && h !== 12) {
      h += 12;
    } else if (period.toLowerCase() === 'am' && h === 12) {
      h = 0;
    }
    return h * 60 + m;
  };

  const startMinutes = convertToMinutes(startHour, startMin || '0', startPeriod);
  const endMinutes = convertToMinutes(endHour, endMin || '0', endPeriod);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Handle case where closing time is next day (e.g., 10pm-2am)
  const isOpen = endMinutes < startMinutes
    ? currentMinutes >= startMinutes || currentMinutes < endMinutes
    : currentMinutes >= startMinutes && currentMinutes < endMinutes;

  if (isOpen) {
    // Calculate time until close
    let minutesUntilClose: number;
    if (endMinutes < startMinutes) {
      // Closing time is next day
      minutesUntilClose = (24 * 60 - currentMinutes) + endMinutes;
    } else {
      minutesUntilClose = endMinutes - currentMinutes;
    }

    const hoursUntilClose = Math.floor(minutesUntilClose / 60);
    const minsUntilClose = minutesUntilClose % 60;

    if (hoursUntilClose > 0) {
      return `Closes in ${hoursUntilClose} ${hoursUntilClose === 1 ? 'hour' : 'hours'}`;
    } else if (minsUntilClose > 0) {
      return `Closes in ${minsUntilClose} ${minsUntilClose === 1 ? 'minute' : 'minutes'}`;
    } else {
      return 'Closing soon';
    }
  } else {
    // Find next open time
    const currentDayIndex = now.getDay();
    
    // Check if opens later today
    if (currentMinutes < startMinutes) {
      const hoursUntilOpen = Math.floor((startMinutes - currentMinutes) / 60);
      const minsUntilOpen = (startMinutes - currentMinutes) % 60;
      
      if (hoursUntilOpen > 0) {
        return `Opens in ${hoursUntilOpen} ${hoursUntilOpen === 1 ? 'hour' : 'hours'}`;
      } else if (minsUntilOpen > 0) {
        return `Opens in ${minsUntilOpen} ${minsUntilOpen === 1 ? 'minute' : 'minutes'}`;
      }
    }
    
    // Find next open day
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDay = dayNames[nextDayIndex];
      const nextHours = operatingHours[nextDay];
      
      if (nextHours && nextHours.toLowerCase() !== 'closed') {
        const nextMatch = nextHours.match(timePattern);
        if (nextMatch) {
          const openHour = parseInt(nextMatch[1], 10);
          const openMin = nextMatch[2] ? parseInt(nextMatch[2], 10) : 0;
          const openPeriod = nextMatch[3].toLowerCase();
          const dayName = dayShortNames[nextDayIndex];
          
          return `Opens ${dayName} at ${openHour}${openMin > 0 ? `:${openMin.toString().padStart(2, '0')}` : ''} ${openPeriod.toUpperCase()}`;
        }
      }
    }
    
    return 'Closed';
  }
}

/**
 * Conditional class name utility
 * Filters out falsy values and joins with space
 */
export function cn(
  ...classes: (string | undefined | false)[]
): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Extract price range from text using regex patterns
 * Looks for patterns like "RM 15 - RM 25" or "RM 15-25"
 * @param text - Text to search for price patterns
 * @returns Formatted price range string or null if not found
 */
export function extractPriceFromText(text: string): string | null {
  if (!text) return null;

  // Pattern 1: "RM 15 - RM 25" or "RM 15-25"
  const rangePattern = /RM\s?(\d+)(?:\s?-\s?RM\s?(\d+))?/i;
  const rangeMatch = text.match(rangePattern);
  
  if (rangeMatch) {
    const min = rangeMatch[1];
    const max = rangeMatch[2] || min;
    return `RM ${min} - RM ${max}`;
  }

  // Pattern 2: "RM 15 per person" or "RM 15/pax"
  const singlePattern = /RM\s?(\d+)(?:\s?per\s+(?:person|pax|head))?/i;
  const singleMatch = text.match(singlePattern);
  
  if (singleMatch) {
    return `Approx. RM ${singleMatch[1]}/pax`;
  }

  return null;
}

/**
 * Merge Google and TripAdvisor restaurant data with smart fallback strategy
 * @param googleData - Restaurant data from Google Places API
 * @param tripAdvisorData - Enriched data from TripAdvisor
 * @returns Merged restaurant data
 */
export function mergeRestaurantData(
  googleData: {
    priceRange?: '$' | '$$' | '$$$' | '$$$$';
    rating?: number;
    photos?: string[];
    operatingHours?: Record<string, string>;
    reviewText?: string;
  },
  tripAdvisorData?: {
    priceText?: string;
    rank?: string;
    tags?: string[];
    topReviewSnippet?: string;
  }
): {
  priceText: string | null;
  rating: number | null;
  photos: string[];
  operatingHours: Record<string, string>;
  rank: string | null;
  tags: string[];
  reviewSnippet: string | null;
} {
  // Price: TripAdvisor price text > Google price level > Review text extraction
  let priceText: string | null = null;
  if (tripAdvisorData?.priceText) {
    priceText = tripAdvisorData.priceText;
  } else if (googleData.priceRange) {
    // Convert Google price symbols to readable text
    const priceMap: Record<string, string> = {
      '$': 'Budget',
      '$$': 'Moderate',
      '$$$': 'Pricey',
      '$$$$': 'Premium',
    };
    priceText = priceMap[googleData.priceRange] || googleData.priceRange;
  } else if (googleData.reviewText) {
    priceText = extractPriceFromText(googleData.reviewText);
  }

  // Rating: Use aggregate (Google + TripAdvisor average if both available)
  // For now, just use Google rating (aggregate calculation happens elsewhere)
  const rating = googleData.rating ?? null;

  // Photos: Always use Google (higher quality)
  const photos = googleData.photos || [];

  // Hours: Always trust Google (more up-to-date)
  const operatingHours = googleData.operatingHours || {};

  // Rank: Only from TripAdvisor
  const rank = tripAdvisorData?.rank ?? null;

  // Tags: Only from TripAdvisor
  const tags = tripAdvisorData?.tags || [];

  // Review snippet: TripAdvisor > Google review text
  const reviewSnippet = tripAdvisorData?.topReviewSnippet ?? googleData.reviewText ?? null;

  return {
    priceText,
    rating,
    photos,
    operatingHours,
    rank,
    tags,
    reviewSnippet,
  };
}
