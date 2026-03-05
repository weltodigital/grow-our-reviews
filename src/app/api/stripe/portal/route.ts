import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createCustomerPortalSession } from '@/lib/stripe'
import type { Database } from '@/types/database'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    let response: NextResponse

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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user's profile to get Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to load profile' },
        { status: 500 }
      )
    }

    let customerId = (profile as any).stripe_customer_id

    // If no customer ID in profile, try to find customer by email
    if (!customerId) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2026-01-28.clover'
        })

        console.log('Looking up Stripe customer for email:', user.email)

        const customers = await stripe.customers.list({
          email: user.email,
          limit: 10, // Check more customers in case of multiple
        })

        console.log('Found customers:', customers.data.length)

        if (customers.data.length > 0) {
          // Use the most recent customer (first in list)
          customerId = customers.data[0].id
          console.log('Using customer ID:', customerId)

          // Update profile with the found customer ID
          const { error: updateError } = await (supabase as any)
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id)

          if (updateError) {
            console.error('Error updating profile with customer ID:', updateError)
          } else {
            console.log('Successfully linked customer ID to profile')
          }
        } else {
          console.log('No Stripe customers found for email:', user.email)

          // Also try searching without case sensitivity or with common variations
          const emailVariations = [
            user.email?.toLowerCase(),
            user.email?.replace('@weltodigital.com', '@weltoleads.com'),
            user.email?.replace('@weltoleads.com', '@weltodigital.com')
          ].filter(Boolean)

          for (const email of emailVariations) {
            if (email === user.email) continue // Skip the one we already tried

            console.log('Trying email variation:', email)
            const altCustomers = await stripe.customers.list({
              email: email,
              limit: 5,
            })

            if (altCustomers.data.length > 0) {
              customerId = altCustomers.data[0].id
              console.log('Found customer with variation:', email, 'ID:', customerId)

              // Update profile with the found customer ID
              await (supabase as any)
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id)
              break
            }
          }
        }
      } catch (stripeError) {
        console.error('Error looking up Stripe customer:', stripeError)
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please subscribe to a plan first.' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create customer portal session
    const session = await createCustomerPortalSession({
      customerId: customerId,
      returnUrl: `${baseUrl}/dashboard/billing`,
    })

    response = NextResponse.json({
      url: session.url,
    })
    return response

  } catch (error: any) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    )
  }
}