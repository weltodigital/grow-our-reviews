import { createServerSupabase } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { requestId, customerName, token } = await request.json()

    if (!requestId || !customerName || !token) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the review request to verify ownership and get user_id
    const { data: reviewRequest, error: requestError } = await (supabase as any)
      .from('review_requests')
      .select('user_id')
      .eq('id', requestId)
      .eq('user_id', user.id)
      .single()

    if (requestError || !reviewRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Get the user's profile for business name
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('business_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get the user's initial SMS template
    const { data: template, error: templateError } = await (supabase as any)
      .from('sms_templates')
      .select('greeting, opening_line, request_line, sign_off')
      .eq('user_id', user.id)
      .eq('type', 'initial')
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      // Use default template if none exists
      const defaultMessage = `Hi ${customerName}, thanks for choosing ${profile.business_name}! If you were happy with our work, we'd really appreciate a quick review — it only takes 30 seconds:

${process.env.NEXT_PUBLIC_APP_URL}/review/${token}`

      return NextResponse.json({ message: defaultMessage })
    }

    // Reconstruct the SMS message using the same logic as the SMS sending
    const processedOpeningLine = template.opening_line.replace(/\{business_name\}/g, profile.business_name)

    const messageParts = []

    // Format: {greeting} {customer_name}, {opening_line}
    messageParts.push(`${template.greeting} ${customerName}, ${processedOpeningLine}`)
    messageParts.push('')
    messageParts.push(`${template.request_line}:`)
    messageParts.push('')
    messageParts.push(`${process.env.NEXT_PUBLIC_APP_URL}/review/${token}`)

    // Add sign-off if provided
    if (template.sign_off && template.sign_off.trim()) {
      messageParts.push('')
      messageParts.push(template.sign_off)
    }

    const message = messageParts.join('\n')

    return NextResponse.json({ message })

  } catch (error) {
    console.error('Error reconstructing SMS message:', error)
    return NextResponse.json(
      { error: 'Failed to load SMS message' },
      { status: 500 }
    )
  }
}