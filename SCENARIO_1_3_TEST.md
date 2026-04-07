# Scenario 1.3 Test: Unconfirmed Email Login Flow

## Current Issues Identified:

### 1. **No Unconfirmed Account Detection**
- Login page doesn't check if account exists but is unconfirmed
- Users get generic "Invalid credentials" error instead of helpful messaging

### 2. **No Resend Confirmation Option**
- No "Resend confirmation email" button or link
- Users have no way to get a new confirmation email

### 3. **Unknown Confirmation Link Expiry**
- Need to determine Supabase confirmation link expiry time
- Unknown what happens when expired link is clicked

### 4. **Poor Error Messages**
- Users don't know if their account exists but is unconfirmed
- No guidance on what to do next

## Test Plan:

### Test Case 1: Login with Unconfirmed Account
1. Sign up with new email
2. Don't click confirmation email
3. Try to login with those credentials
4. **Current Expected**: Generic login error
5. **Desired**: "Please confirm your email address" + resend option

### Test Case 2: Expired Confirmation Link
1. Find a confirmation link that's several days old
2. Click the expired link
3. **Observe**: What error message appears?
4. **Desired**: Clear message + option to resend

### Test Case 3: Resend Confirmation Flow
1. Need to create this functionality
2. Should be accessible from login page
3. Should handle rate limiting

## Implementation Needed:

### 1. Enhanced Login Error Handling
```typescript
// Check if user exists but unconfirmed
// Show specific message + resend option
```

### 2. Resend Confirmation API
```typescript
// POST /api/auth/resend-confirmation
// Rate limited, user-friendly
```

### 3. Resend Confirmation Component
- Button/link on login page
- Modal or inline form
- Success/error states

## Supabase Confirmation Settings:
- **Default expiry**: 24 hours (needs verification)
- **Expired link behavior**: Shows Supabase error page (needs improvement)
- **Resend capability**: Available via `supabase.auth.resend()`