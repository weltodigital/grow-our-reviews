# Scenario 1.2 Test: Duplicate Email Registration

## Test Cases to Execute:

### Test Case 1: Email with Confirmed Account
1. Use an email that has already completed signup + confirmation
2. Try to register again with same email
3. **Expected**: Clear error message
4. **Observe**: What exact message appears?

### Test Case 2: Email with Unconfirmed Account
1. Use an email that signed up but never confirmed
2. Try to register again with same email
3. **Expected**: Should allow re-registration OR clear guidance
4. **Observe**: What happens?

### Test Case 3: Email from Abandoned Signup
1. Use an email that started onboarding but never completed
2. Try to register again
3. **Expected**: Should handle gracefully
4. **Observe**: User experience

## Current Code Analysis:

**Potential Issues Found:**
1. Error handling relies on `error.message` from Supabase
2. No custom handling for unconfirmed accounts
3. No guidance for users who forgot they registered

**Improvements Needed:**
1. Better error messaging for duplicate emails
2. Handle unconfirmed account case specifically
3. Provide clear next steps (e.g., "Check email" or "Try login instead")

## Test Results:
[ ] Test Case 1 - Confirmed account:
[ ] Test Case 2 - Unconfirmed account:
[ ] Test Case 3 - Abandoned signup:

## Recommendations:
(To be filled after testing)