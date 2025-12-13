import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Restaurant, Review, ApiResponse } from '@/types';
import PlaceDetail from '@/components/PlaceDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Fetch restaurant data
async function getRestaurant(id: string): Promise<Restaurant | null> {
  try {
    // Use Next.js fetch with caching (relative URL works in server components)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/restaurants/${id}`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch restaurant: ${response.statusText}`);
    }

    const data: ApiResponse<Restaurant> = await response.json();

    if (data.error || !data.data) {
      return null;
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return null;
  }
}

// Fetch reviews data (gracefully handle errors)
async function getReviews(restaurantId: string): Promise<Review[]> {
  try {
    // Use Next.js fetch with caching (longer cache for reviews)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/reviews?restaurantId=${restaurantId}`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Return empty array if reviews fail - don't break the page
      console.warn('Failed to fetch reviews, continuing without them');
      return [];
    }

    const data: ApiResponse<Review[]> = await response.json();

    if (data.error) {
      return [];
    }

    return data.data || [];
  } catch (error) {
    // Gracefully handle errors - return empty array
    console.warn('Error fetching reviews:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  // Validate ID format (basic UUID or alphanumeric check)
  if (!id || id.length < 1) {
    return {
      title: 'Restaurant Not Found | Viral Eats MY',
      description: 'The restaurant you are looking for could not be found.',
    };
  }

  const restaurant = await getRestaurant(id);

  if (!restaurant) {
    return {
      title: 'Restaurant Not Found | Viral Eats MY',
      description: 'The restaurant you are looking for could not be found.',
    };
  }

  // Build description with fallbacks
  const description = restaurant.mustTryDish
    ? `${restaurant.mustTryDish} at ${restaurant.name}. Rated ${restaurant.aggregateRating.toFixed(1)}/5. ${restaurant.isHalal ? 'Halal certified.' : ''}`
    : `Discover ${restaurant.name} - ${restaurant.category} in Malaysia. Rated ${restaurant.aggregateRating.toFixed(1)}/5. ${restaurant.isHalal ? 'Halal certified.' : ''}`;

  // Get image URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://viral-eats.my';
  const imageUrl = restaurant.photos?.[0] 
    ? restaurant.photos[0]
    : `${baseUrl}/og-image.png`;

  return {
    title: `${restaurant.name} | Viral Eats MY`,
    description,
    openGraph: {
      title: `${restaurant.name} | Viral Eats MY`,
      description,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: restaurant.name,
        },
      ],
      siteName: 'Viral Eats MY',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${restaurant.name} | Viral Eats MY`,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${baseUrl}/place/${id}`,
    },
  };
}

// Generate structured data (JSON-LD) for SEO
function generateStructuredData(restaurant: Restaurant, reviews: Review[]) {
  const aggregateRating = reviews.length > 0
    ? {
        '@type': 'AggregateRating',
        ratingValue: restaurant.aggregateRating,
        reviewCount: reviews.length,
        bestRating: '5',
        worstRating: '1',
      }
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: restaurant.address,
      addressCountry: 'MY',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: restaurant.lat,
      longitude: restaurant.lng,
    },
    servesCuisine: restaurant.category,
    priceRange: restaurant.priceRange,
    image: restaurant.photos || [],
    ...(aggregateRating && { aggregateRating }),
    ...(restaurant.isHalal && {
      servesHalalFood: true,
      ...(restaurant.halalCertNumber && {
        halalCertification: {
          '@type': 'Certification',
          name: 'Halal Certified',
          identifier: restaurant.halalCertNumber,
        },
      }),
    }),
  };
}

export default async function PlacePage({ params }: PageProps) {
  const { id } = await params;

  // Validate ID format early
  if (!id || id.trim().length === 0) {
    notFound();
  }

  // Fetch restaurant and reviews in parallel
  const [restaurant, reviews] = await Promise.all([
    getRestaurant(id),
    getReviews(id),
  ]);

  // Handle 404
  if (!restaurant) {
    notFound();
  }

  // Generate structured data
  const structuredData = generateStructuredData(restaurant, reviews);

  return (
    <>
      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Place Detail Component */}
      <PlaceDetail restaurant={restaurant} reviews={reviews} />
    </>
  );
}

// Set revalidation time for ISR
export const revalidate = 300; // Revalidate every 5 minutes
