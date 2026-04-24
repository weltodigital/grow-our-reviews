/**
 * Credit accounting: each outbound SMS counts as one credit against the user's
 * monthly_request_limit. An original review-request SMS is one credit; a nudge
 * SMS is another. Requests with status='failed' are excluded (neither sent_at
 * nor nudge_sent_at should be populated for them anyway — defensive).
 */

export async function countCreditsSentInPeriod(
  supabase: any,
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const startIso = periodStart.toISOString()
  const endIso = periodEnd.toISOString()

  const [originals, nudges] = await Promise.all([
    supabase
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('sent_at', 'is', null)
      .neq('status', 'failed')
      .gte('sent_at', startIso)
      .lte('sent_at', endIso),
    supabase
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('nudge_sent_at', 'is', null)
      .neq('status', 'failed')
      .gte('nudge_sent_at', startIso)
      .lte('nudge_sent_at', endIso),
  ])

  return (originals.count || 0) + (nudges.count || 0)
}

export async function countNudgesSentInPeriod(
  supabase: any,
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const { count } = await supabase
    .from('review_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('nudge_sent_at', 'is', null)
    .neq('status', 'failed')
    .gte('nudge_sent_at', periodStart.toISOString())
    .lte('nudge_sent_at', periodEnd.toISOString())

  return count || 0
}
