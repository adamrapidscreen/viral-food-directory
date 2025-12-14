/**
 * Comprehensive halal detection algorithm for Google Places data
 * Replaces simple keyword check with multi-factor analysis
 */

interface GooglePlace {
  name?: string;
  types?: string[];
  vicinity?: string;
  formatted_address?: string;
}

/**
 * Determines if a place is halal or Muslim-friendly based on comprehensive keyword analysis
 * 
 * @param place - Google Place object with name, types, and vicinity/address
 * @returns true if place is likely halal or Muslim-friendly
 */
export function isHalalOrMuslimFriendly(place: GooglePlace): boolean {
  const name = (place.name || '').toLowerCase();
  const types = place.types || [];
  const vicinity = (place.vicinity || '').toLowerCase();
  const address = (place.formatted_address || '').toLowerCase();
  
  // Combine vicinity and address for checking
  const locationText = `${vicinity} ${address}`.toLowerCase();
  
  // 1. EXPLICIT HALAL INDICATORS (100% confidence)
  const explicitHalal = [
    'halal', 'حلال', 'muslim', 'islamic'
  ];
  
  // 2. MALAY CUISINE KEYWORDS (Very high confidence - inherently halal)
  const malayCuisine = [
    'nasi', 'mee', 'mi ', 'mie', 'laksa', 'satay', 'sate', 'rendang',
    'lemak', 'goreng', 'ayam', 'ikan', 'sambal', 'roti canai', 'canai',
    'mamak', 'kampung', 'warung', 'gerai', 'kedai makan',
    'tomyam', 'tom yam', 'nasi kandar', 'kandar', 'briyani', 'bryani',
    'biryani', 'murtabak', 'martabak', 'rojak', 'cendol', 'teh tarik',
    'air bandung', 'sirap', 'kari', 'curry puff', 'karipap',
    'sup', 'soto', 'bakso', 'lontong', 'ketupat', 'kuih', 'pisang goreng',
    'keropok', 'kerepek', 'ais kacang', 'abc', 'cakoi', 'popiah',
    'apam', 'roti john', 'ramly', 'burger ramly'
  ];
  
  // 3. MALAY RESTAURANT NAME PATTERNS (High confidence)
  const malayNamePatterns = [
    'restoran', 'kedai', 'warung', 'gerai', 'dapur', 'selera',
    'cik', 'mak', 'pak', 'abang', 'kakak', 'haji', 'hajjah',
    'ustaz', 'ustazah', 'syed', 'syarifah', 'tengku', 'wan',
    'ahmad', 'ali', 'muhammad', 'mohd', 'mohamed', 'fatimah',
    'aminah', 'zainab', 'khadijah', 'aisyah', 'nur ', 'noor',
    'abdul', 'abu', 'bin ', 'binti', 'kampung', 'kg '
  ];
  
  // 4. INDONESIAN MUSLIM CUISINE (High confidence)
  const indonesianHalal = [
    'padang', 'minang', 'jawa', 'javanese', 'aceh', 'acehnese',
    'masakan melayu', 'masakan kampung', 'makanan melayu'
  ];
  
  // 5. MIDDLE EASTERN/SOUTH ASIAN HALAL (Usually halal)
  const middleEasternSouthAsian = [
    'arab', 'arabian', 'lebanese', 'turkish', 'turkish kebab',
    'kebab', 'shawarma', 'falafel', 'hummus', 'pakistani',
    'indian muslim', 'mogul', 'moghul', 'mughal', 'biryani house',
    'tandoori', 'naan', 'chapati', 'yemeni', 'egyptian',
    'persian', 'afghan', 'bangladeshi'
  ];
  
  // 6. NEGATIVE INDICATORS (Exclude these)
  const nonHalalIndicators = [
    'pork', 'babi', 'bacon', 'ham', 'lard', 'beer', 'wine',
    'bar', 'pub', 'brewery', 'cocktail', 'sake', 'soju',
    'chinese', 'bak kut teh', 'char siu', 'roast pork',
    'non-halal', 'non halal', '非清真'
  ];
  
  // Check for negative indicators first (in name, types, and location)
  const allText = `${name} ${types.join(' ')} ${locationText}`.toLowerCase();
  const hasNonHalal = nonHalalIndicators.some(word => 
    allText.includes(word)
  );
  if (hasNonHalal) return false;
  
  // Check all positive indicators (in name and location)
  const allPositive = [
    ...explicitHalal,
    ...malayCuisine,
    ...malayNamePatterns,
    ...indonesianHalal,
    ...middleEasternSouthAsian
  ];
  
  const searchText = `${name} ${locationText}`.toLowerCase();
  return allPositive.some(keyword => searchText.includes(keyword));
}
