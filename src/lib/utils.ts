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
 */
export function isOpenNow(operatingHours: Record<string, string>): boolean {
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
 */
export function getCurrentDayHours(operatingHours: Record<string, string>): string {
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
 * Conditional class name utility
 * Filters out falsy values and joins with space
 */
export function cn(
  ...classes: (string | undefined | false)[]
): string {
  return classes.filter(Boolean).join(' ');
}
