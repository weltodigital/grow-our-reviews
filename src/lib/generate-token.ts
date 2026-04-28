import { randomBytes } from 'crypto'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
// 248 is the largest multiple of 62 less than 256 — bytes ≥ 248 are rejected
// to keep the output unbiased (instead of mapping `byte % 62` and oversampling
// the first 8 characters of the alphabet).
const REJECTION_THRESHOLD = 248

/**
 * Generate a cryptographically random base62 token for use in review URLs.
 *
 * Default 10 characters → ~59.5 bits of entropy (575 quadrillion combinations).
 * Comfortably resists online enumeration without needing rate-limiting on the
 * review route, while keeping URLs short enough to be SMS-friendly.
 */
export function generateToken(length = 10): string {
  const result: string[] = []
  while (result.length < length) {
    // Generate extra bytes per pass to amortise rejection sampling.
    const bytes = randomBytes(length * 2)
    for (const byte of bytes) {
      if (byte < REJECTION_THRESHOLD) {
        result.push(ALPHABET[byte % 62])
        if (result.length >= length) break
      }
    }
  }
  return result.join('')
}
