# Testing Webhook Failure Scenarios

## Test 1: Orphaned Checkout Detection & Auto-Fix

### Setup
1. **Switch to Stripe Test Mode**: Ensure using test API keys
2. **Prepare webhook endpoint**: Use `/api/stripe/webhook`

### Test Procedure

#### Step 1: Create Orphaned Checkout
```bash
# 1. Temporarily break webhook endpoint
# Add this to the top of /api/stripe/webhook/route.ts:
# return NextResponse.json({ error: "Simulated failure" }, { status: 500 })

# 2. Create a test checkout session in Stripe test mode
curl -X POST https://api.stripe.com/v1/checkout/sessions \
  -u sk_test_YOUR_KEY: \
  -d "mode=subscription" \
  -d "line_items[0][price]=price_YOUR_TEST_PRICE" \
  -d "line_items[0][quantity]=1" \
  -d "success_url=https://yoursite.com/success" \
  -d "cancel_url=https://yoursite.com/cancel" \
  -d "metadata[userId]=test-user-123" \
  -d "client_reference_id=test-user-123"

# 3. Complete the checkout in Stripe's test interface
# Note: The webhook will fail due to the simulated error

# 4. Verify no profile was created
# Check your database - there should be no profile for test-user-123
```

#### Step 2: Run Reconciliation Job
```bash
# 1. Restore webhook endpoint (remove the error simulation)

# 2. Run reconciliation manually
curl -X GET "https://yoursite.com/api/cron/stripe-reconciliation" \
  -H "Authorization: Bearer $CRON_SECRET"

# Expected Result:
# - Orphaned checkout detected
# - Profile automatically created
# - Alert email sent to ed@growourreviews.com
```

#### Step 3: Verify Auto-Fix
```bash
# Check that profile was created with correct data:
# - User ID matches session metadata
# - Stripe customer ID populated
# - Subscription status matches Stripe
# - Monthly request limit matches plan
```

#### Step 4: Test Manual Sync
```bash
# Test the manual sync endpoint
curl -X POST "https://yoursite.com/api/admin/stripe-sync" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-123"}'

# Should return success with current Stripe data
```

## Test 2: Status Mismatch Detection

### Setup
1. Create a profile with active subscription
2. Cancel the subscription in Stripe dashboard
3. Don't update the database (simulate webhook failure)

### Test Procedure
```bash
# Run reconciliation
curl -X GET "https://yoursite.com/api/cron/stripe-reconciliation" \
  -H "Authorization: Bearer $CRON_SECRET"

# Expected Result:
# - Mismatch detected (DB: active, Stripe: cancelled)
# - Alert email sent (no auto-fix for status mismatches)
```

## Test 3: Webhook Event Deduplication

### Test Procedure
```bash
# 1. Send the same Stripe event twice to webhook endpoint
# 2. Verify only processed once (check webhook_events table)
# 3. Second attempt should return 200 but skip processing
```

## Validation Checklist

### ✅ Orphaned Checkout Detection
- [ ] Detects customers who paid but have no profile
- [ ] Automatically creates missing profiles with correct data
- [ ] Sends detailed alert email
- [ ] Logs all operations with correlation IDs

### ✅ Status Mismatch Detection
- [ ] Finds discrepancies between DB and Stripe
- [ ] Alerts but doesn't auto-fix (requires manual investigation)
- [ ] Provides clear details in alert email

### ✅ Webhook Resilience
- [ ] Idempotency prevents duplicate processing
- [ ] Always returns 200 to prevent Stripe retries
- [ ] Structured logging for debugging
- [ ] All events recorded in webhook_events table

### ✅ Manual Tools
- [ ] Admin sync API works for individual users
- [ ] Reconciliation API can be run manually
- [ ] Alert emails contain actionable information

## Expected Alert Email Format

```
Subject: Stripe Reconciliation Alert — 2 issues found

Stripe reconciliation found 2 billing issues:

✅ AUTO-FIXED CHECKOUTS (1) - Profiles created automatically:
- test@example.com | Session: cs_test_123 | Amount: £29.00

🚨 ORPHANED CHECKOUTS (0) - REQUIRE MANUAL FIX:

⚠️ STATUS MISMATCHES (1) - Database vs Stripe:
- user@example.com | DB: active | Stripe: cancelled | Sub: sub_123

Checked at: 2025-01-01T06:00:00.000Z
Total profiles checked: 25
Auto-fixed orphaned checkouts: 1

🔧 Status mismatches require manual investigation - use /api/admin/stripe-sync to fix.
✅ Orphaned checkouts are auto-fixed when possible.
```

## Post-Test Cleanup
1. Remove test profiles from database
2. Cancel test subscriptions in Stripe
3. Verify no test data remains in production