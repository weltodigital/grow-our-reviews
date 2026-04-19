import { NextRequest, NextResponse } from 'next/server'

interface ValidationResult {
  isValid: boolean
  urlType: 'review_form' | 'business_profile' | 'search_listing' | 'maps_link' | 'invalid' | 'unknown'
  suggestions?: string[]
  warning?: string
  preview?: {
    title?: string
    description?: string
    redirectsTo?: string
  }
}

// Common Google review URL patterns
const GOOGLE_PATTERNS = {
  // Correct review form URLs
  REVIEW_FORM: [
    /search\.google\.com\/local\/writereview\?placeid=/,
    /maps\.google\.com\/.*\/reviews\/.*\/write/,
    /google\.com\/maps\/.*\/reviews\/.*\/write/,
    /maps\.google\.com\/.*\/@.*\/.*\/reviews\/.*\/write/,
    /g\.page\/r\/.*\/review$/,  // Google's shortened review URLs like g.page/r/XXX/review
  ],

  // Business profile URLs (wrong - shows business info, not review form)
  BUSINESS_PROFILE: [
    /maps\.google\.com\/.*\/place\/.*\/@.*,.*z$/,
    /google\.com\/maps\/place\/.*\/@.*,.*z$/,
    /maps\.google\.com\/.*\/data=.*!4m.*!3m/,
    /google\.com\/search\?.*q=.*&.*maps/,
  ],

  // Basic search listings (also wrong)
  SEARCH_LISTING: [
    /google\.com\/search\?.*q=.*business.*location/,
    /google\.com\/maps\/search\/.*\/@/,
  ],

  // Generic maps links (could be either)
  MAPS_LINK: [
    /maps\.google\.com\/maps\?.*q=/,
    /google\.com\/maps\?.*q=/,
    /goo\.gl\/maps\//,
  ]
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({
        isValid: false,
        urlType: 'invalid',
        suggestions: ['Please provide a URL to validate']
      })
    }

    // Basic URL validation
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({
        isValid: false,
        urlType: 'invalid',
        suggestions: ['Please enter a valid URL starting with https://']
      })
    }

    // Check if it's a Google domain
    const googleDomains = ['google.com', 'maps.google.com', 'search.google.com', 'goo.gl', 'g.page']
    const isGoogleDomain = googleDomains.some(domain =>
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
    )

    if (!isGoogleDomain) {
      return NextResponse.json({
        isValid: false,
        urlType: 'invalid',
        suggestions: [
          'This must be a Google URL',
          'Google review URLs start with https://search.google.com/local/writereview or https://maps.google.com'
        ]
      })
    }

    // Determine URL type based on patterns
    const result = await validateGoogleUrl(url, parsedUrl)

    return NextResponse.json(result)

  } catch (error) {
    console.error('URL validation error:', error)
    return NextResponse.json({
      isValid: false,
      urlType: 'unknown',
      suggestions: ['Unable to validate URL. Please check the format and try again.']
    }, { status: 500 })
  }
}

async function validateGoogleUrl(url: string, parsedUrl: URL): Promise<ValidationResult> {
  // Check against known patterns
  for (const [type, patterns] of Object.entries(GOOGLE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return getValidationForPattern(type as keyof typeof GOOGLE_PATTERNS, url, parsedUrl)
      }
    }
  }

  // If no pattern matches, try to fetch and analyze
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URLValidator/1.0)'
      },
      redirect: 'follow'
    })

    const finalUrl = response.url
    const title = response.headers.get('title') || ''

    // Check if it redirected to a review form
    if (finalUrl.includes('writereview') || finalUrl.includes('/reviews/') && finalUrl.includes('/write')) {
      return {
        isValid: true,
        urlType: 'review_form',
        preview: {
          title: 'Google Review Form',
          description: 'This URL correctly leads to the review writing form',
          redirectsTo: finalUrl !== url ? finalUrl : undefined
        }
      }
    }

    // Analyze the final destination
    return analyzeGoogleDestination(finalUrl, title)

  } catch (error) {
    // If we can't fetch, provide feedback based on URL structure
    return analyzeUrlStructure(url, parsedUrl)
  }
}

function getValidationForPattern(type: keyof typeof GOOGLE_PATTERNS, url: string, parsedUrl: URL): ValidationResult {
  switch (type) {
    case 'REVIEW_FORM':
      return {
        isValid: true,
        urlType: 'review_form',
        preview: {
          title: 'Google Review Form',
          description: 'This URL correctly leads customers to leave a review'
        }
      }

    case 'BUSINESS_PROFILE':
      return {
        isValid: false,
        urlType: 'business_profile',
        warning: 'This URL shows your business listing, but customers cannot leave reviews directly',
        suggestions: [
          'This appears to be your Google Business Profile URL',
          'Customers will see your business info but no review form',
          'You need the direct review writing URL that contains "writereview" or "reviews/write"'
        ]
      }

    case 'SEARCH_LISTING':
      return {
        isValid: false,
        urlType: 'search_listing',
        warning: 'This URL shows search results, not a review form',
        suggestions: [
          'This appears to be a Google search URL',
          'You need the direct review writing URL for your specific business',
          'Look for a URL that contains "writereview" or "reviews/write"'
        ]
      }

    case 'MAPS_LINK':
      return {
        isValid: false,
        urlType: 'maps_link',
        warning: 'This URL may not lead directly to the review form',
        suggestions: [
          'This looks like a generic Google Maps link',
          'It might work but could show your business info instead of the review form',
          'For best results, use the direct review URL with "writereview" in it'
        ]
      }

    default:
      return analyzeUrlStructure(url, parsedUrl)
  }
}

function analyzeGoogleDestination(finalUrl: string, title: string): ValidationResult {
  if (finalUrl.includes('writereview') ||
      finalUrl.includes('/reviews/') && finalUrl.includes('/write') ||
      title.toLowerCase().includes('write a review')) {
    return {
      isValid: true,
      urlType: 'review_form',
      preview: {
        title: title || 'Google Review Form',
        description: 'This URL leads to the review writing form'
      }
    }
  }

  if (finalUrl.includes('/maps/place/') ||
      title.toLowerCase().includes('business profile') ||
      title.toLowerCase().includes('google maps')) {
    return {
      isValid: false,
      urlType: 'business_profile',
      warning: 'This URL shows your business profile, not the review form',
      suggestions: [
        'Customers will see your business info but cannot leave reviews easily',
        'Look for a "Write a review" button on this page and copy that URL instead'
      ],
      preview: {
        title: title || 'Google Business Profile',
        description: 'Shows business information but not the review form'
      }
    }
  }

  return {
    isValid: false,
    urlType: 'unknown',
    warning: 'Unable to determine if this URL leads to a review form',
    suggestions: [
      'Test this URL yourself to make sure it shows a review writing form',
      'Look for URLs containing "writereview" or "reviews/write" for best results'
    ]
  }
}

function analyzeUrlStructure(url: string, parsedUrl: URL): ValidationResult {
  const path = parsedUrl.pathname + parsedUrl.search

  // Look for positive indicators
  if (path.includes('writereview') ||
      path.includes('/reviews/') && path.includes('/write') ||
      parsedUrl.hostname === 'g.page' && path.match(/\/r\/.*\/review$/)) {
    return {
      isValid: true,
      urlType: 'review_form',
      preview: {
        title: 'Google Review Form',
        description: 'URL structure suggests this leads to the review form'
      }
    }
  }

  // Look for problematic indicators
  if (path.includes('/place/') && !path.includes('reviews')) {
    return {
      isValid: false,
      urlType: 'business_profile',
      warning: 'This appears to be a business profile URL, not a review form',
      suggestions: [
        'This URL likely shows your business listing',
        'You need the direct review URL that customers can use to write reviews'
      ]
    }
  }

  // Generic Google domain but unclear structure
  return {
    isValid: false,
    urlType: 'unknown',
    warning: 'Cannot determine if this URL leads to a review form',
    suggestions: [
      'Make sure this URL takes customers directly to write a review',
      'Test the URL yourself before using it',
      'Look for URLs containing "writereview" for guaranteed review forms'
    ]
  }
}