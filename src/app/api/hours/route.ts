import { NextResponse } from 'next/server';
import * as fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const cachePath = path.join(process.cwd(), 'src', 'data', 'hoursCache.json');
    if (!fs.existsSync(cachePath)) {
      return NextResponse.json({});
    }
    
    // Load hours cache (keyed by google_place_id)
    const hoursCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    
    // Get mapping of restaurant.id -> google_place_id from database
    const supabase = createClient();
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, google_place_id')
      .not('google_place_id', 'is', null);
    
    // Create mapping: restaurant.id -> hours data
    const mappedCache: Record<string, any> = {};
    
    if (restaurants) {
      restaurants.forEach((r: any) => {
        if (r.google_place_id && hoursCache[r.google_place_id]) {
          mappedCache[r.id] = hoursCache[r.google_place_id];
        }
      });
    }
    
    console.log(`✅ Mapped ${Object.keys(mappedCache).length} hours by restaurant ID`);
    return NextResponse.json(mappedCache);
  } catch (e) {
    console.error('Error reading hours cache:', e);
    return NextResponse.json({});
  }
}
