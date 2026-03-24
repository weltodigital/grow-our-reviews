# Stripe Payment Authorization Testing Plan

## Pre-Implementation Checklist

### 1. Verify Stripe Account Configuration
- [ ] Check if account allows authorization holds (some regions/industries restrict this)
- [ ] Confirm £1 minimum authorization amount is permitted
- [ ] Review Stripe dashboard for any hold/auth restrictions
- [ ] Test authorization cancellation functionality

### 2. Test Card Numbers for Validation
Use these Stripe test cards to simulate different failure scenarios:

| Card Number | Type | Expected Behavior |
|-------------|------|------------------|
| `4000000000000002` | Declined | Should fail authorization test |
| `4000000000000069` | Expired | Should fail with expired_card error |
| `4000000000000119` | Processing error | Should fail with processing_error |
| `4000000000000127` | Insufficient funds | Should fail with insufficient_funds |
| `4242424242424242` | Successful | Should pass authorization test |
| `4000000000000341` | Requires authentication | May require 3D Secure |

### 3. Authorization Test Scenarios

#### Test 1: Successful Authorization
```bash
# Expected flow:
# 1. Create payment intent with test metadata
# 2. Authorization succeeds
# 3. Immediately cancel authorization
# 4. No webhook triggers user status change
# 5. Trial warning shows "payment method: valid"
```

#### Test 2: Failed Authorization - Declined Card
```bash
# Expected flow:
# 1. Use 4000000000000002 (declined card)
# 2. Authorization fails immediately
# 3. No webhook fired or webhook ignored due to test metadata
# 4. Trial warning shows "payment method: failed_test"
# 5. High-risk alert sent to admin
```

#### Test 3: Failed Authorization - Expired Card
```bash
# Expected flow:
# 1. Use 4000000000000069 (expired card)
# 2. Authorization fails with expired_card error
# 3. Trial warning captures specific error type
# 4. Alert includes "Card issue: expired_card"
```

#### Test 4: Webhook Isolation Test
```bash
# Critical test - ensure auth tests don't trigger false payment failures
# 1. Run authorization test on trial user
# 2. Check webhook_events table for payment_intent.payment_failed
# 3. Verify webhook logs show "Payment validation test failed (expected)"
# 4. Confirm user status remains "trialing" (not changed to "past_due")
# 5. Verify no trial failure metric incremented
```

## Test Commands

### Manual Authorization Test (Safe Mode)
```bash
# Test individual payment method validation
curl -X POST "https://yoursite.com/api/admin/test-payment-validation" \
  -H "Content-Type: application/json" \
  -d '{"customerId": "cus_test_12345", "testMode": true}'
```

### Trial Warning Test
```bash
# Run trial warnings manually to test payment validation
curl -X GET "https://yoursite.com/api/cron/trial-warnings" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Validation Checklist

### ✅ Authorization Mechanics
- [ ] £1 authorization creates successfully
- [ ] Authorization is immediately cancelled (not captured)
- [ ] Different card types produce expected errors
- [ ] No actual money movement occurs
- [ ] Customer doesn't see charges on their statement

### ✅ Webhook Safety
- [ ] Authorization test failures don't trigger user status changes
- [ ] Webhook handler recognizes test metadata correctly
- [ ] Real payment failures still trigger proper handling
- [ ] Health metrics distinguish between test/real failures
- [ ] Webhook logs are clear about test vs real events

### ✅ Risk Assessment
- [ ] Failed authorization tests mark users as high-risk
- [ ] Successful tests mark users as low-risk
- [ ] Edge cases (network errors, Stripe issues) handled gracefully
- [ ] Alert emails contain actionable information
- [ ] No false positives from test failures

### ✅ Customer Experience
- [ ] No customer-facing impact from authorization tests
- [ ] No emails sent to customers about test failures
- [ ] Full service access maintained regardless of test results
- [ ] No disruption to normal payment processing

## Rollback Plan

If authorization tests cause issues:

### Immediate Actions
1. **Disable payment validation**: Comment out payment test code in trial-warnings cron
2. **Monitor webhooks**: Check for unexpected payment_intent events
3. **Verify user statuses**: Ensure no users incorrectly marked as past_due
4. **Check health metrics**: Confirm no false trial failure counts

### Alternative Approaches
1. **Setup Intent Validation**: Use Stripe Setup Intents instead of payment authorization
2. **Card Validation API**: Use Stripe's card validation endpoints
3. **Subscription Update Test**: Test by updating subscription metadata
4. **Manual Review**: Flag high-risk trials for manual intervention

## Success Criteria

- [ ] Authorization tests work reliably in test mode
- [ ] Webhook system correctly ignores test events
- [ ] Real payment failures still processed correctly
- [ ] Customer experience unchanged
- [ ] Administrative alerts are accurate and actionable
- [ ] No false positives or negatives in risk assessment

## Production Deployment

Only deploy to production after:
- [ ] All test scenarios pass in Stripe test mode
- [ ] Webhook handling verified with test events
- [ ] Trial warning system tested end-to-end
- [ ] Monitoring in place for authorization test metrics
- [ ] Rollback plan prepared and documented