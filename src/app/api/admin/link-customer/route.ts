import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, forceUpdate } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover'
    })

    // Search for all customers with this email or variations
    const emailVariations = [
      email.toLowerCase(),
      email.replace('@weltodigital.com', '@weltoleads.com'),
      email.replace('@weltoleads.com', '@weltodigital.com')
    ]

    let foundCustomer = null

    for (const searchEmail of emailVariations) {
      console.log('Searching Stripe for:', searchEmail)

      const customers = await stripe.customers.list({
        email: searchEmail,
        limit: 10
      })

      if (customers.data.length > 0) {
        foundCustomer = customers.data[0]
        console.log('Found customer:', foundCustomer.id, 'for email:', searchEmail)
        break
      }
    }

    if (!foundCustomer) {
      return NextResponse.json({
        success: false,
        message: 'No Stripe customer found for any email variation',
        searchedEmails: emailVariations
      })
    }

    // Find the user profile by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, stripe_customer_id')
      .ilike('email', email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        message: 'No user profile found',
        error: profileError
      })
    }

    // Update the profile with the Stripe customer ID
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_customer_id: foundCustomer.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    if (updateError) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update profile',
        error: updateError
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully linked Stripe customer',
      customerId: foundCustomer.id,
      customerEmail: foundCustomer.email,
      profileId: profile.id
    })

  } catch (error) {
    console.error('Error linking customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to link customer' },
      { status: 500 }
    )
  }
}