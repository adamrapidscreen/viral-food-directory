/**
 * Convert a string to a URL-friendly slug
 * Used consistently across the app for cache lookups
 */
export const toSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};
