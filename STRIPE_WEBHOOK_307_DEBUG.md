# Stripe Webhook 307 Redirect Debug Guide

## Problem
Stripe webhooks are receiving 307 (Temporary Redirect) errors, causing Stripe to disable the webhook endpoint.

## Common Causes of 307 Redirects

### 1. HTTP vs HTTPS Issues
- Stripe sends webhooks to the exact URL configured
- If URL is configured as `http://` but server redirects to `https://`, you get 307
- **Solution**: Ensure webhook URL in Stripe dashboard uses `https://`

### 2. Trailing Slash Issues
- URL configured as `https://domain.com/api/stripe/webhook/`
- Server redirects to `https://domain.com/api/stripe/webhook` (without slash)
- **Solution**: Use exact URL without trailing slash

### 3. Domain Redirects
- www vs non-www redirects
- Old domain redirecting to new domain
- **Solution**: Use the canonical domain

## Debug Steps

### Step 1: Check Current Webhook URL in Stripe Dashboard
1. Go to Stripe Dashboard > Developers > Webhooks
2. Check the endpoint URL - should be: `https://growourreviews.com/api/stripe/webhook`
3. Ensure no trailing slash
4. Ensure it's HTTPS not HTTP

### Step 2: Test the Webhook Endpoint
```bash
# Test GET request
curl -X GET https://growourreviews.com/api/stripe/webhook

# Test POST request
curl -X POST https://growourreviews.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Test with debug endpoint
curl -X GET https://growourreviews.com/api/stripe/webhook-debug
```

### Step 3: Check Vercel Logs
1. Go to Vercel dashboard
2. Check function logs for webhook requests
3. Look for the detailed request logging we added

### Step 4: Monitor Request Headers
The webhook now logs these details for debugging:
- `correlationId`: Unique request ID
- `url`: Requested URL
- `method`: HTTP method
- `headers.host`: Host header
- `headers.x-forwarded-proto`: Protocol (should be https)
- `headers.x-forwarded-host`: Forwarded host
- `headers.stripe-signature`: Webhook signature presence

## Fixes Applied

### 1. Enhanced Logging
Added detailed request logging to identify redirect sources.

### 2. Multiple HTTP Method Support
Added GET, HEAD, and OPTIONS handlers to prevent method-based redirects.

### 3. Debug Endpoint
Created `/api/stripe/webhook-debug` for testing connectivity.

## Expected Webhook URL Configuration

**Correct URL**: `https://growourreviews.com/api/stripe/webhook`

**Common Incorrect URLs**:
- ❌ `http://growourreviews.com/api/stripe/webhook` (HTTP instead of HTTPS)
- ❌ `https://growourreviews.com/api/stripe/webhook/` (trailing slash)
- ❌ `https://www.growourreviews.com/api/stripe/webhook` (www subdomain)

## Testing After Fix

1. Update webhook URL in Stripe dashboard (if needed)
2. Re-enable the webhook endpoint
3. Trigger a test event from Stripe dashboard
4. Check Vercel logs for successful processing
5. Verify webhook events are recorded in `webhook_events` table

## Monitoring

Check the health status endpoint for webhook metrics:
```bash
curl https://growourreviews.com/api/admin/health-status
```

Look for:
- `webhooks_processed`: Number of successful webhooks
- `webhooks_failed`: Number of failed webhooks
- Recent webhook processing trends