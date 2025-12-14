'use client';

import { useState, useEffect, useRef } from 'react';

interface UseLazyImageOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
}

/**
 * Hook to lazy load images using Intersection Observer
 * Only loads image when element is visible in viewport
 */
export function useLazyImage(
  imageUrl: string | undefined,
  options: UseLazyImageOptions = {}
) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  const { root = null, rootMargin = '50px', threshold = 0.1 } = options;

  useEffect(() => {
    // If no image URL, don't observe
    if (!imageUrl) {
      return;
    }

    // If already loading, don't observe again
    if (shouldLoad) {
      return;
    }

    const element = imgRef.current;
    if (!element) {
      return;
    }

    // Create Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [imageUrl, shouldLoad, root, rootMargin, threshold]);

  return {
    imgRef,
    shouldLoad: shouldLoad && !!imageUrl,
    imageError,
    setImageError,
  };
}
