// Helpers to keep personal data out of server logs (GDPR data minimisation).
// Logs land in Vercel/Supabase where they can persist and be widely readable,
// so phone numbers and emails should be masked before logging.

export function redactPhone(phone?: string | null): string {
  if (!phone) return '(none)'
  const s = String(phone)
  if (s.length <= 4) return '****'
  // Keep enough to correlate (country prefix + last 3) without exposing the number.
  return `${s.slice(0, 3)}****${s.slice(-3)}`
}

export function redactEmail(email?: string | null): string {
  if (!email) return '(none)'
  const [user, domain] = String(email).split('@')
  if (!domain) return '****'
  const maskedUser = user.length <= 2 ? `${user[0] ?? ''}*` : `${user.slice(0, 2)}***`
  return `${maskedUser}@${domain}`
}
