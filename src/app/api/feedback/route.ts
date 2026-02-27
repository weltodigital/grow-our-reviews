import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  let response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return response
  }

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const rating = searchParams.get('rating')
    const dateFilter = searchParams.get('dateFilter')
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    // Build the query
    let query = supabase
      .from('feedback')
      .select(`
        id,
        rating,
        comment,
        created_at,
        review_request_id,
        review_requests!inner(
          customers!inner(name, phone)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply rating filter
    if (rating && rating !== 'all') {
      query = query.eq('rating', parseInt(rating))
    }

    // Apply date filter
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case '3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
          break
        default:
          startDate = new Date(0) // All time
      }

      query = query.gte('created_at', startDate.toISOString())
    }

    const { data: feedbackData, error, count } = await query

    if (error) {
      console.error('Error fetching feedback:', error)
      response = NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      )
      return response
    }

    // Format the data for the frontend
    const formattedFeedback = feedbackData?.map((feedback: any) => ({
      id: feedback.id,
      customer_name: feedback.review_requests?.customers?.name || 'Unknown Customer',
      customer_phone: feedback.review_requests?.customers?.phone || '',
      rating: feedback.rating,
      comment: feedback.comment,
      created_at: feedback.created_at,
      review_request_id: feedback.review_request_id
    })) || []

    // Apply search filter on formatted data (since we can't easily search across relations in Supabase)
    let filteredFeedback = formattedFeedback
    if (search) {
      const searchLower = search.toLowerCase()
      filteredFeedback = formattedFeedback.filter(item =>
        item.customer_name.toLowerCase().includes(searchLower) ||
        item.customer_phone.includes(search) ||
        (item.comment && item.comment.toLowerCase().includes(searchLower))
      )
    }

    // Calculate analytics
    const totalFeedback = feedbackData?.length || 0
    const averageRating = totalFeedback > 0
      ? feedbackData!.reduce((sum, item) => sum + item.rating, 0) / totalFeedback
      : 0

    const ratingDistribution = {
      1: feedbackData?.filter(item => item.rating === 1).length || 0,
      2: feedbackData?.filter(item => item.rating === 2).length || 0,
      3: feedbackData?.filter(item => item.rating === 3).length || 0,
      4: feedbackData?.filter(item => item.rating === 4).length || 0,
      5: feedbackData?.filter(item => item.rating === 5).length || 0,
    }

    response = NextResponse.json({
      feedback: filteredFeedback,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      analytics: {
        totalFeedback,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution
      }
    })
    return response

  } catch (error) {
    console.error('Error in feedback API:', error)
    response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return response
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, rating, comment } = await request.json()

    // Validate input
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Valid rating (1-5) is required' },
        { status: 400 }
      )
    }

    let response = NextResponse.json({ success: true })

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set({ name, value, ...options })
              response.cookies.set({ name, value, ...options })
            })
          },
        },
      }
    )

    // Find the review request by token
    const { data: reviewRequest, error: findError } = await supabase
      .from('review_requests')
      .select('*')
      .eq('token', token)
      .single()

    if (findError || !reviewRequest) {
      return NextResponse.json(
        { error: 'Invalid or expired review link' },
        { status: 404 }
      )
    }

    // Check if feedback already exists for this review request
    const { data: existingFeedback } = await supabase
      .from('feedback')
      .select('id')
      .eq('review_request_id', reviewRequest.id)
      .single()

    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback has already been submitted for this request' },
        { status: 409 }
      )
    }

    // Create the feedback record
    const { error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        review_request_id: reviewRequest.id,
        user_id: reviewRequest.user_id,
        rating,
        comment: comment?.trim() || null,
      })

    if (feedbackError) {
      console.error('Error creating feedback:', feedbackError)
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      )
    }

    // Update review request status
    const { error: updateError } = await supabase
      .from('review_requests')
      .update({
        status: 'feedback_given'
      })
      .eq('id', reviewRequest.id)

    if (updateError) {
      console.error('Error updating review request status:', updateError)
      // Don't return error here since feedback was saved successfully
    }

    return response

  } catch (error) {
    console.error('Unexpected error in feedback API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}