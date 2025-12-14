// Map restaurant types/names to likely signature dishes
const DISH_MAPPINGS: Record<string, string[]> = {
  // By cuisine keywords in name
  'nasi': ['Nasi Lemak Special', 'Nasi Goreng Kampung', 'Nasi Kerabu'],
  'mee': ['Mee Goreng Mamak', 'Mee Rebus', 'Mee Kari'],
  'laksa': ['Laksa Penang', 'Laksa Sarawak', 'Curry Laksa'],
  'satay': ['Satay Ayam', 'Satay Daging', 'Satay Combo'],
  'roti': ['Roti Canai Telur', 'Roti Boom', 'Roti Tisu'],
  'mamak': ['Maggi Goreng', 'Roti Canai', 'Teh Tarik'],
  'dim sum': ['Har Gow', 'Siu Mai', 'Char Siu Bao'],
  'cafe': ['Signature Coffee', 'Buttermilk Waffle', 'Eggs Benedict'],
  'kopitiam': ['Kaya Toast Set', 'Hainanese Coffee', 'Half Boiled Eggs'],
  'western': ['Grilled Lamb Chop', 'Chicken Chop', 'Fish And Chips'],
  'korean': ['Korean Fried Chicken', 'Bibimbap', 'Tteokbokki'],
  'japanese': ['Salmon Sashimi', 'Chicken Katsu Don', 'Ramen Set'],
  'thai': ['Tom Yum Soup', 'Pad Thai', 'Green Curry'],
  'indian': ['Banana Leaf Rice', 'Tandoori Chicken', 'Butter Naan'],
  'chinese': ['Salted Egg Chicken', 'Claypot Chicken Rice', 'Dim Sum Platter'],
  'seafood': ['Butter Prawns', 'Salted Egg Crab', 'Steam Fish'],
  'steak': ['Ribeye Steak', 'Wagyu Beef', 'Lamb Rack'],
  'burger': ['Signature Beef Burger', 'Ramly Burger Special', 'Chicken Burger'],
  'pizza': ['Margherita Pizza', 'Pepperoni Pizza', 'Hawaiian Pizza'],
  'bakery': ['Croissant', 'Sourdough Bread', 'Danish Pastry'],
  'dessert': ['Cendol', 'Ais Kacang', 'Durian Crepe'],
};

// Default dishes if no match
const DEFAULT_DISHES = [
  'Chef Special',
  'Signature Platter', 
  'House Recommendation',
  'Set Meal',
  'Daily Special',
];

export const generateDishName = (restaurantName: string, types?: string[]): string => {
  const nameLower = restaurantName.toLowerCase();
  
  // Check each mapping
  for (const [keyword, dishes] of Object.entries(DISH_MAPPINGS)) {
    if (nameLower.includes(keyword)) {
      // Pick a random dish from the matching category
      const dish = dishes[Math.floor(Math.random() * dishes.length)];
      return toTitleCase(dish);
    }
  }
  
  // Check types array if provided
  if (types?.length) {
    const typeStr = types.join(' ').toLowerCase();
    for (const [keyword, dishes] of Object.entries(DISH_MAPPINGS)) {
      if (typeStr.includes(keyword)) {
        const dish = dishes[Math.floor(Math.random() * dishes.length)];
        return toTitleCase(dish);
      }
    }
  }
  
  // Fallback to default
  return toTitleCase(DEFAULT_DISHES[Math.floor(Math.random() * DEFAULT_DISHES.length)]);
};

// Title Case helper - capitalize first letter of each word
export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Generate a varied recommendation percentage based on restaurant name (for consistency)
export const generateRecommendation = (restaurantName: string): number => {
  // Use restaurant name as seed for consistent but varied percentages
  let hash = 0;
  for (let i = 0; i < restaurantName.length; i++) {
    hash = restaurantName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate percentage between 72-98%
  const percentage = 72 + Math.abs(hash % 27);
  return percentage;
};

// Also add variety phrases
export const getRecommendPhrase = (percentage: number): string => {
  if (percentage >= 95) return `${percentage}% Love It`;
  if (percentage >= 90) return `${percentage}% Highly Recommend`;
  if (percentage >= 85) return `${percentage}% Recommend`;
  if (percentage >= 80) return `${percentage}% Would Return`;
  return `${percentage}% Positive Reviews`;
};
