/**
 * Smart default hours for restaurants where Google has no data
 * Based on restaurant type/name patterns common in Malaysia
 */

interface DefaultHours {
  weekdayText: string[];
  periods: any[];
}

// Common hours patterns by restaurant type
const HOURS_PATTERNS: Record<string, DefaultHours> = {
  // Mamak/Hawker - typically open late
  mamak: {
    weekdayText: [
      'Monday: 6:00 AM – 2:00 AM',
      'Tuesday: 6:00 AM – 2:00 AM',
      'Wednesday: 6:00 AM – 2:00 AM',
      'Thursday: 6:00 AM – 2:00 AM',
      'Friday: 6:00 AM – 2:00 AM',
      'Saturday: 6:00 AM – 2:00 AM',
      'Sunday: 6:00 AM – 2:00 AM',
    ],
    periods: [
      { open: { day: 0, time: '0600' }, close: { day: 1, time: '0200' } },
      { open: { day: 1, time: '0600' }, close: { day: 2, time: '0200' } },
      { open: { day: 2, time: '0600' }, close: { day: 3, time: '0200' } },
      { open: { day: 3, time: '0600' }, close: { day: 4, time: '0200' } },
      { open: { day: 4, time: '0600' }, close: { day: 5, time: '0200' } },
      { open: { day: 5, time: '0600' }, close: { day: 6, time: '0200' } },
      { open: { day: 6, time: '0600' }, close: { day: 0, time: '0200' } },
    ],
  },
  // Cafe - typical cafe hours
  cafe: {
    weekdayText: [
      'Monday: 8:00 AM – 10:00 PM',
      'Tuesday: 8:00 AM – 10:00 PM',
      'Wednesday: 8:00 AM – 10:00 PM',
      'Thursday: 8:00 AM – 10:00 PM',
      'Friday: 8:00 AM – 11:00 PM',
      'Saturday: 8:00 AM – 11:00 PM',
      'Sunday: 8:00 AM – 10:00 PM',
    ],
    periods: [
      { open: { day: 0, time: '0800' }, close: { day: 0, time: '2200' } },
      { open: { day: 1, time: '0800' }, close: { day: 1, time: '2200' } },
      { open: { day: 2, time: '0800' }, close: { day: 2, time: '2200' } },
      { open: { day: 3, time: '0800' }, close: { day: 3, time: '2200' } },
      { open: { day: 4, time: '0800' }, close: { day: 4, time: '2300' } },
      { open: { day: 5, time: '0800' }, close: { day: 5, time: '2300' } },
      { open: { day: 6, time: '0800' }, close: { day: 6, time: '2200' } },
    ],
  },
  // Restaurant - lunch and dinner
  restaurant: {
    weekdayText: [
      'Monday: 11:00 AM – 10:00 PM',
      'Tuesday: 11:00 AM – 10:00 PM',
      'Wednesday: 11:00 AM – 10:00 PM',
      'Thursday: 11:00 AM – 10:00 PM',
      'Friday: 11:00 AM – 11:00 PM',
      'Saturday: 11:00 AM – 11:00 PM',
      'Sunday: 11:00 AM – 10:00 PM',
    ],
    periods: [
      { open: { day: 0, time: '1100' }, close: { day: 0, time: '2200' } },
      { open: { day: 1, time: '1100' }, close: { day: 1, time: '2200' } },
      { open: { day: 2, time: '1100' }, close: { day: 2, time: '2200' } },
      { open: { day: 3, time: '1100' }, close: { day: 3, time: '2200' } },
      { open: { day: 4, time: '1100' }, close: { day: 4, time: '2300' } },
      { open: { day: 5, time: '1100' }, close: { day: 5, time: '2300' } },
      { open: { day: 6, time: '1100' }, close: { day: 6, time: '2200' } },
    ],
  },
  // Hawker - early morning to evening
  hawker: {
    weekdayText: [
      'Monday: 6:00 AM – 8:00 PM',
      'Tuesday: 6:00 AM – 8:00 PM',
      'Wednesday: 6:00 AM – 8:00 PM',
      'Thursday: 6:00 AM – 8:00 PM',
      'Friday: 6:00 AM – 8:00 PM',
      'Saturday: 6:00 AM – 8:00 PM',
      'Sunday: 6:00 AM – 8:00 PM',
    ],
    periods: [
      { open: { day: 0, time: '0600' }, close: { day: 0, time: '2000' } },
      { open: { day: 1, time: '0600' }, close: { day: 1, time: '2000' } },
      { open: { day: 2, time: '0600' }, close: { day: 2, time: '2000' } },
      { open: { day: 3, time: '0600' }, close: { day: 3, time: '2000' } },
      { open: { day: 4, time: '0600' }, close: { day: 4, time: '2000' } },
      { open: { day: 5, time: '0600' }, close: { day: 5, time: '2000' } },
      { open: { day: 6, time: '0600' }, close: { day: 6, time: '2000' } },
    ],
  },
};

// Default fallback hours (typical restaurant)
const DEFAULT_HOURS: DefaultHours = {
  weekdayText: [
    'Monday: 10:00 AM – 10:00 PM',
    'Tuesday: 10:00 AM – 10:00 PM',
    'Wednesday: 10:00 AM – 10:00 PM',
    'Thursday: 10:00 AM – 10:00 PM',
    'Friday: 10:00 AM – 11:00 PM',
    'Saturday: 10:00 AM – 11:00 PM',
    'Sunday: 10:00 AM – 10:00 PM',
  ],
  periods: [
    { open: { day: 0, time: '1000' }, close: { day: 0, time: '2200' } },
    { open: { day: 1, time: '1000' }, close: { day: 1, time: '2200' } },
    { open: { day: 2, time: '1000' }, close: { day: 2, time: '2200' } },
    { open: { day: 3, time: '1000' }, close: { day: 3, time: '2200' } },
    { open: { day: 4, time: '1000' }, close: { day: 4, time: '2300' } },
    { open: { day: 5, time: '1000' }, close: { day: 5, time: '2300' } },
    { open: { day: 6, time: '1000' }, close: { day: 6, time: '2200' } },
  ],
};

export const getDefaultHours = (restaurantName: string, types?: string[]): DefaultHours => {
  const nameLower = restaurantName.toLowerCase();
  
  // Check for mamak indicators
  if (nameLower.includes('mamak')) {
    return HOURS_PATTERNS.mamak;
  }
  
  // Check for cafe indicators
  if (nameLower.includes('cafe') || nameLower.includes('kopitiam') || nameLower.includes('coffee')) {
    return HOURS_PATTERNS.cafe;
  }
  
  // Check for hawker indicators
  if (nameLower.includes('hawker') || nameLower.includes('stall') || nameLower.includes('gerai')) {
    return HOURS_PATTERNS.hawker;
  }
  
  // Check types array if provided
  if (types?.length) {
    const typeStr = types.join(' ').toLowerCase();
    if (typeStr.includes('cafe') || typeStr.includes('coffee')) {
      return HOURS_PATTERNS.cafe;
    }
    if (typeStr.includes('hawker') || typeStr.includes('food_court')) {
      return HOURS_PATTERNS.hawker;
    }
  }
  
  // Default to restaurant hours
  return HOURS_PATTERNS.restaurant || DEFAULT_HOURS;
};
