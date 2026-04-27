/**
 * Convert a business name into a URL-safe slug for use in review links.
 *
 *   "Welto Digital"        → "welto-digital"
 *   "Smith & Co. Plumbing" → "smith-co-plumbing"
 *   "ABC #1 Cleaners"      → "abc-1-cleaners"
 *
 * The slug is purely cosmetic — the token alone identifies the review request,
 * so collisions between businesses with similar names are harmless.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')                       // split accented chars into base + combining mark
    .replace(/[̀-ͯ]/g, '')         // strip combining marks left over from NFKD
    .replace(/[^a-z0-9\s-]/g, '')            // drop anything that isn't a letter, digit, space, or hyphen
    .trim()
    .replace(/\s+/g, '-')                    // spaces → hyphens
    .replace(/-+/g, '-')                     // collapse runs of hyphens
    .replace(/^-|-$/g, '')                   // strip leading/trailing hyphens
    .slice(0, 50)
}
