import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { hostname: 'maps.googleapis.com' },
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 'media-cdn.tripadvisor.com' },
      { hostname: 'images.unsplash.com' }, // For dummy data
    ],
  },
};

export default nextConfig;
