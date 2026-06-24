// Shared password strength + breach checks for signup and password reset.
//
// Kept in one place so the signup form and the reset-confirm form enforce the
// SAME rules. Two layers:
//   1. validatePasswordRules() — synchronous complexity/length rules.
//   2. isPasswordLeaked()      — checks the password against the Have I Been
//      Pwned "Pwned Passwords" corpus using k-anonymity (we only ever send the
//      first 5 chars of the SHA-1 hash, never the password). Free, no API key.
//
// Supabase also has its own "Leaked password protection" + minimum-length
// settings in the dashboard — these checks are the client-side belt to its
// braces, giving immediate inline feedback before the auth call.

export const MIN_PASSWORD_LENGTH = 10

/**
 * Validate complexity rules. Returns an error string, or null if the password
 * passes. Requires length + a mix of character classes so short/trivial
 * passwords are rejected before they ever reach Supabase.
 */
export function validatePasswordRules(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include a lowercase letter'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include an uppercase letter'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include a number'
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include a symbol'
  }
  return null
}

async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-1', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

/**
 * Returns true if the password appears in a known breach corpus.
 *
 * Uses the HIBP range API with k-anonymity: we hash the password with SHA-1,
 * send only the first 5 hex chars of the hash, and match the returned suffixes
 * locally. The full password and full hash never leave the browser.
 *
 * On any network/parse error we fail OPEN (return false) — a breach-API outage
 * must never block a legitimate user from signing up or resetting a password.
 */
export async function isPasswordLeaked(password: string): Promise<boolean> {
  try {
    const hash = await sha1Hex(password)
    const prefix = hash.slice(0, 5)
    const suffix = hash.slice(5)

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    })
    if (!res.ok) return false

    const body = await res.text()
    for (const line of body.split('\n')) {
      const [hashSuffix] = line.split(':')
      if (hashSuffix.trim().toUpperCase() === suffix) {
        return true
      }
    }
    return false
  } catch {
    return false
  }
}

/**
 * Full async check used by the forms: complexity rules first (cheap), then the
 * breach lookup. Returns an error string, or null if the password is acceptable.
 */
export async function validatePassword(password: string): Promise<string | null> {
  const ruleError = validatePasswordRules(password)
  if (ruleError) return ruleError

  if (await isPasswordLeaked(password)) {
    return 'This password has appeared in a known data breach. Please choose a different one.'
  }
  return null
}
