# SMS Failure Visibility Solution

This document outlines the comprehensive SMS failure tracking and visibility system designed to solve the critical business risk of silent SMS delivery failures.

## The Problem

**Before this implementation:**
- SMS delivery failures were logged to console but invisible to business owners
- Users had no way to know if their messages were failing to deliver
- Failed requests showed "failed" status but no explanation of why
- Business owners might think the system was broken when it was actually phone number/carrier issues
- No visibility into failure patterns or rates

## The Solution

A comprehensive 4-layer visibility system that makes SMS failures impossible to miss:

### 1. **Database Schema Enhancement**

Added failure tracking columns to `review_requests` table:
```sql
ALTER TABLE review_requests ADD COLUMN sms_error_code TEXT;
ALTER TABLE review_requests ADD COLUMN sms_error_message TEXT;
ALTER TABLE review_requests ADD COLUMN sms_failed_at TIMESTAMPTZ;
ALTER TABLE review_requests ADD COLUMN retry_count INTEGER DEFAULT 0;
```

### 2. **Enhanced Twilio Webhook**

**File:** `src/app/api/twilio/webhook/route.ts`

**Improvements:**
- **Captures detailed failure information** from Twilio (error codes + messages)
- **Stores failure details** in database for permanent visibility
- **Tracks retry counts** for repeated failure patterns
- **Integrates with health metrics** for system-wide monitoring
- **Clears failure data** when messages eventually succeed

**Key Features:**
- Maps Twilio error codes to user-friendly explanations
- Increments health metrics for SMS failure tracking
- Stores exact failure timestamps for analytics

### 3. **Prominent Dashboard Alerts**

**Component:** `SmsFailureAlert.tsx`

**Red Banner Alerts** that show when:
- **> 5% failure rate** in recent requests
- **> 3 total failures** in recent requests

**Alert Severity Levels:**
- 🔴 **Critical:** ≥20% failure rate or ≥10 failures
- 🟠 **High:** ≥10% failure rate or ≥5 failures
- 🟡 **Medium:** ≥5% failure rate or ≥3 failures

**Alert Content:**
- Clear failure statistics: "3 of your last 10 requests failed (30% failure rate)"
- Quick action buttons: "View Failed Requests" & "Show Details"
- **Expandable details** showing:
  - Common failure reasons with explanations
  - Recent failed deliveries with customer info
  - Help text with specific fixing instructions

### 4. **Detailed Failure Information in Requests List**

**Enhanced Components:**
- `requests-table.tsx` - Shows failure details inline
- `requests/page.tsx` - Updated interface with failure fields
- `api/requests/route.ts` - Includes failure data in API responses

**Failure Details Display:**
- **Error codes** in monospace badges (e.g., `21211`)
- **Full error messages** from Twilio
- **User-friendly explanations** of what went wrong
- **Visible in both desktop table and mobile cards**

## Error Code Explanations

The system maps Twilio error codes to business-friendly explanations:

| Error Code | Explanation |
|------------|-------------|
| `21211` | Invalid phone number format - check the number is correct |
| `21612` | Phone number cannot receive SMS (landline or invalid carrier) |
| `21610` | Message blocked by carrier spam filter |
| `30007` | Message delivery failed - carrier rejected |
| `30008` | Unknown destination phone number |
| `21217` | Phone number is not a mobile number |
| `30003` | Unreachable destination - phone may be turned off |

## Failure Statistics API

**Endpoint:** `GET /api/sms-failures`

**Provides:**
- **Recent failure rates** (last 30 days)
- **Grouped failure reasons** with counts and explanations
- **Individual failed requests** with customer details
- **Actionable insights** for improving delivery rates

## User Experience Improvements

### Dashboard View
- **Impossible to miss** red banner when failures occur
- **One-click access** to failed requests list
- **Clear explanations** of what's wrong and how to fix it

### Requests List View
- **Inline failure details** right in the status column
- **Error codes and messages** visible at a glance
- **Retry buttons** for failed requests
- **Mobile-friendly** failure information

### Business Owner Benefits
1. **Immediate visibility** when SMS delivery issues occur
2. **Specific reasons** for each failure (not just "failed")
3. **Actionable guidance** on fixing phone number issues
4. **Historical tracking** of failure patterns
5. **Proactive alerts** before failure rates get critical

## Implementation Files

### New Files Created:
- `migrations/add_sms_failure_tracking.sql` - Database schema changes
- `src/app/api/sms-failures/route.ts` - Failure statistics API
- `src/components/dashboard/SmsFailureAlert.tsx` - Dashboard alert component

### Enhanced Files:
- `src/app/api/twilio/webhook/route.ts` - Stores failure details
- `src/app/dashboard/page.tsx` - Shows failure alerts
- `src/app/dashboard/requests/page.tsx` - Shows failure alerts + updated interface
- `src/components/dashboard/requests-table.tsx` - Shows failure details inline
- `src/app/api/requests/route.ts` - Returns failure data

## Business Impact

### Problem Solved:
❌ **Before:** "Why aren't my customers responding? Is the system broken?"

✅ **After:** "I can see 3 SMS failed due to invalid phone numbers. Let me update those contacts."

### Key Benefits:
1. **Prevents customer confusion** about system reliability
2. **Enables proactive problem solving** for delivery issues
3. **Improves deliverability** through better phone number hygiene
4. **Builds user confidence** with transparent failure reporting
5. **Reduces support burden** through self-service failure explanations

### Success Metrics:
- **100% failure visibility** - No more silent failures
- **Immediate problem identification** - Red alerts within minutes
- **Actionable error information** - Specific reasons + fixes
- **Historical tracking** - Pattern identification over time

This comprehensive solution transforms SMS delivery failures from invisible system issues into manageable, actionable business problems with clear resolution paths.