import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAppUrl(path: string = '') {
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or default
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'
    return `${baseUrl}${path}`
  }

  // Client-side: check if we're already on app subdomain
  const hostname = window.location.hostname
  if (hostname.startsWith('app.')) {
    return `${window.location.protocol}//${hostname}${path}`
  }

  // If on main domain, redirect to app subdomain
  const appHostname = hostname.includes('localhost')
    ? `app.${hostname}`
    : `app.${hostname.replace('www.', '')}`

  return `${window.location.protocol}//${appHostname}${path}`
}
