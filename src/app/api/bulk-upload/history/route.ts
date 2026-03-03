import { createServerSupabase } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get upload batches (grouped by creation time)
    // We'll group review requests by their creation date to identify bulk uploads
    const { data: recentRequests, error } = await supabase
      .from('review_requests')
      .select('id, created_at, status')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching upload history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch upload history' },
        { status: 500 }
      )
    }

    if (!recentRequests || recentRequests.length === 0) {
      return NextResponse.json({
        history: []
      })
    }

    // Group requests by creation time (within 5 minutes of each other = same batch)
    const batches: { [key: string]: any[] } = {}
    const batchWindow = 5 * 60 * 1000 // 5 minutes in milliseconds

    recentRequests.forEach((request: any) => {
      const requestTime = new Date(request.created_at).getTime()
      let foundBatch = false

      // Check if this request belongs to an existing batch
      for (const [batchKey, batchRequests] of Object.entries(batches)) {
        const batchTime = new Date(batchKey).getTime()
        if (Math.abs(requestTime - batchTime) <= batchWindow) {
          batchRequests.push(request)
          foundBatch = true
          break
        }
      }

      // If no matching batch found, create a new one
      if (!foundBatch) {
        batches[request.created_at] = [request]
      }
    })

    // Convert batches to history format
    const history = Object.entries(batches)
      .map(([batchTime, requests]) => {
        const sentRequests = requests.filter(r => r.status === 'sent').length
        const completedRequests = requests.filter(r =>
          r.status === 'positive_review' || r.status === 'negative_feedback'
        ).length

        return {
          created_at: batchTime,
          customer_count: requests.length,
          requests_sent: sentRequests,
          requests_completed: completedRequests
        }
      })
      .filter(batch => batch.customer_count > 1) // Only show bulk uploads (more than 1 customer)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10) // Limit to 10 most recent

    return NextResponse.json({
      history
    })

  } catch (error) {
    console.error('Upload history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}