# Grow Our Reviews — STOP Message Handling & SMS Opt-Out System

## WHY THIS IS CRITICAL

When a customer replies "STOP" to our Twilio number, we are legally required to stop sending them messages. This is required by:
- UK PECR regulations
- GDPR (right to object to processing)
- Twilio's own acceptable use policy (they can suspend our number if we ignore opt-outs)

We do NOT need to add "Reply STOP to opt out" text to our SMS messages — the messages are transactional review requests, not marketing blasts. But we MUST handle STOP replies when they come in.

We also need to handle the scenario where a customer replies with a normal message (thinking they're texting the tradesperson) — since our Twilio number is automated, not monitored by a human.

---

## 1. CREATE THE SUPPRESSION TABLE

```sql
CREATE TABLE sms_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,          -- E.164 format (+447xxxxxxxxx)
  user_id uuid NOT NULL REFERENCES profiles(id),  -- the business they opted out from
  reason text NOT NULL DEFAULT 'customer_opt_out', -- customer_opt_out, invalid_number, admin_suppressed
  source_message text,                 -- the actual message the customer sent (for audit)
  suppressed_at timestamp with time zone DEFAULT now(),
  UNIQUE(phone_number, user_id)        -- one suppression per phone per business
);

-- RLS: business owners can view their own suppressions but cannot delete them
ALTER TABLE sms_suppressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suppressions"
  ON sms_suppressions FOR SELECT
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies for users — suppressions are managed by the system only
-- Service role key is used for creating suppressions from the webhook
```

---

## 2. UPDATE TWILIO WEBHOOK TO HANDLE INBOUND SMS

The webhook at /api/twilio/webhook currently handles outbound delivery status updates (MessageStatus parameter). It also needs to handle inbound SMS messages (Body parameter).

Twilio sends both types of event to the same webhook URL. Distinguish between them:
- **Delivery status update:** has MessageStatus parameter (delivered, failed, undelivered, sent)
- **Inbound SMS:** has Body parameter and From parameter (the customer's phone number)

Update the webhook handler:

```typescript
// In /api/twilio/webhook/route.ts

export async function POST(request: Request) {
  const formData = await request.formData();
  
  // Check if this is an inbound SMS (has Body) or a delivery status update (has MessageStatus)
  const body = formData.get('Body') as string | null;
  const messageStatus = formData.get('MessageStatus') as string | null;
  const from = formData.get('From') as string | null;  // customer's phone number
  const to = formData.get('To') as string | null;      // our Twilio number
  
  if (body && from) {
    // This is an inbound SMS from a customer
    await handleInboundSMS(from, body);
  } else if (messageStatus) {
    // This is a delivery status update — handle as before (existing logic)
    await handleDeliveryStatus(formData);
  }
  
  // Always return 200 to Twilio
  return new Response('OK', { status: 200 });
}
```

### Handle inbound SMS:

```typescript
async function handleInboundSMS(fromNumber: string, messageBody: string) {
  const trimmedBody = messageBody.trim().toUpperCase();
  
  // Check for opt-out keywords
  const optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'OPTOUT', 'OPT OUT'];
  const isOptOut = optOutKeywords.some(keyword => trimmedBody === keyword);
  
  if (isOptOut) {
    await handleOptOut(fromNumber, messageBody);
  } else {
    await handleGeneralReply(fromNumber, messageBody);
  }
}
```

### Handle opt-out:

```typescript
async function handleOptOut(phoneNumber: string, originalMessage: string) {
  // Find which business last sent an SMS to this phone number
  // Look up the most recent review_request sent to this number
  const { data: recentRequest } = await supabase
    .from('review_requests')
    .select('user_id, customers!inner(phone)')
    .eq('customers.phone', phoneNumber)
    .in('status', ['sent', 'clicked', 'reviewed', 'feedback_given'])
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();
  
  if (recentRequest) {
    // Create suppression record for this phone + business combination
    const { error } = await supabase
      .from('sms_suppressions')
      .upsert({
        phone_number: phoneNumber,
        user_id: recentRequest.user_id,
        reason: 'customer_opt_out',
        source_message: originalMessage,
        suppressed_at: new Date().toISOString()
      }, {
        onConflict: 'phone_number,user_id'  // don't error on duplicate
      });
    
    if (error) {
      console.error('Failed to create suppression:', error);
    }
    
    // Also cancel any pending/scheduled requests to this number from this business
    await supabase
      .from('review_requests')
      .update({ status: 'suppressed' })
      .eq('user_id', recentRequest.user_id)
      .in('status', ['scheduled', 'queued'])
      .eq('customer_id', /* get customer_id from the phone number lookup */);
      
    console.log(`Opt-out processed: ${phoneNumber} for business ${recentRequest.user_id}`);
  } else {
    // Can't determine which business — suppress globally (create suppressions for ALL businesses that have sent to this number)
    const { data: allRequests } = await supabase
      .from('review_requests')
      .select('user_id, customers!inner(phone)')
      .eq('customers.phone', phoneNumber)
      .in('status', ['sent', 'clicked', 'reviewed', 'feedback_given']);
    
    if (allRequests) {
      const uniqueUserIds = [...new Set(allRequests.map(r => r.user_id))];
      for (const userId of uniqueUserIds) {
        await supabase
          .from('sms_suppressions')
          .upsert({
            phone_number: phoneNumber,
            user_id: userId,
            reason: 'customer_opt_out',
            source_message: originalMessage
          }, {
            onConflict: 'phone_number,user_id'
          });
      }
    }
    
    console.log(`Global opt-out processed: ${phoneNumber} (no specific business identified)`);
  }
}
```

### Handle general replies (non-STOP messages):

```typescript
async function handleGeneralReply(phoneNumber: string, messageBody: string) {
  // Customer is replying thinking they're texting the tradesperson
  // Find which business last sent them a message
  const { data: recentRequest } = await supabase
    .from('review_requests')
    .select('user_id, profiles!inner(business_name, phone)')
    .eq('customers.phone', phoneNumber)
    .in('status', ['sent', 'clicked', 'reviewed', 'feedback_given'])
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();
  
  if (recentRequest) {
    const businessName = recentRequest.profiles.business_name;
    const businessPhone = recentRequest.profiles.phone;
    
    // Send auto-reply with business contact info
    // Use Twilio to send a reply
    const replyMessage = businessPhone
      ? `Thanks for your message. This is an automated number - please contact ${businessName} directly on ${businessPhone} for any enquiries.`
      : `Thanks for your message. This is an automated number - please contact ${businessName} directly for any enquiries.`;
    
    await twilioClient.messages.create({
      body: replyMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    // NOTE: This auto-reply SMS costs money. Rate limit it:
    // Only send one auto-reply per phone number per 24 hours to prevent loops
    // Check if we've already auto-replied to this number today before sending
  }
  
  // Log the inbound message for reference (but don't store long-term — GDPR)
  console.log(`Inbound SMS from ${phoneNumber}: [message logged but not stored]`);
}
```

**IMPORTANT: Rate limit the auto-reply.** If a customer sends multiple messages, only reply once per 24 hours. Otherwise you could end up in an SMS loop (especially if the customer's phone has auto-responders). Create a simple check:

```sql
-- Add to sms_usage_tracking or create a simple table
CREATE TABLE auto_reply_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  replied_at timestamp with time zone DEFAULT now()
);

-- Before sending auto-reply, check:
-- SELECT COUNT(*) FROM auto_reply_log 
-- WHERE phone_number = $1 AND replied_at > now() - interval '24 hours'
-- If count > 0, skip the reply
```

---

## 3. CHECK SUPPRESSIONS BEFORE EVERY SMS SEND

Update both cron jobs (/api/cron/send-sms and /api/cron/send-nudges).

Before sending each SMS, add a suppression check:

```typescript
// In the send loop for each review_request:

// 1. Get the customer's phone number and the business owner's user_id
const phoneNumber = request.customer.phone;
const userId = request.user_id;

// 2. Check suppression table
const { data: suppression } = await supabase
  .from('sms_suppressions')
  .select('id')
  .eq('phone_number', phoneNumber)
  .eq('user_id', userId)
  .limit(1)
  .single();

if (suppression) {
  // This customer has opted out — do not send
  await supabase
    .from('review_requests')
    .update({ status: 'suppressed' })
    .eq('id', request.id);
  
  continue; // Skip to next request
}

// 3. If not suppressed, proceed with sending as normal
```

**Do this check for both initial requests AND nudges.** A customer might opt out after receiving the first message but before the nudge fires.

---

## 4. ADD "SUPPRESSED" STATUS TO THE SYSTEM

### Database:
- Add 'suppressed' to any status validation/enum checks on the review_requests table
- Suppressed requests should NOT count against the user's monthly credit limit (refund the credit)

### Dashboard — Request List:
- Show suppressed requests with a grey badge and a muted row style
- Tooltip on the badge: "This customer has opted out of receiving messages"
- Do NOT show a retry button for suppressed requests — opt-outs are permanent

### Dashboard — Send Request Page:
- When a user enters a phone number to send a new request, check the suppression table
- If a suppression exists for that phone + user combination, show a clear warning BEFORE they submit:
  - "This customer has opted out of receiving SMS messages from your business. We cannot send them a review request."
- Block the form submission — do not allow sending to suppressed numbers

### Dashboard — Stats:
- Exclude suppressed requests from click-through rate calculations
- They were never sent, so they shouldn't affect performance metrics
- Optionally show a separate "suppressed" count on the stats page for transparency

### Dashboard — Settings (or a new section):
- Show a list of suppressed phone numbers for this business
- Display: phone number (partially masked: +447***xxx123), reason, date suppressed
- Do NOT allow the business owner to remove suppressions — opt-outs are permanent under law
- Show a note: "These customers have opted out of receiving SMS messages. This cannot be reversed."

---

## 5. HANDLE EDGE CASES

### Edge case: Customer opts out then the business adds them again via bulk upload
- The bulk upload validation should check the suppression table
- If a phone number in the CSV is suppressed for this business, flag it in the preview:
  - Status: "⛔ Opted out" 
  - "This customer has previously opted out of messages from your business"
- Do NOT include them in the send batch, even if the user tries to confirm

### Edge case: Customer opts out of Business A but Business B also uses the platform
- Suppressions are per-business (phone_number + user_id combination)
- Opting out of Business A's messages does NOT affect Business B
- This is correct behaviour — the customer's relationship is with each business separately

### Edge case: STOP message arrives but we can't determine which business sent the SMS
- This could happen if the phone number isn't found in any review_request records
- In this case, suppress the number for ALL businesses that have ever sent to it (global suppression)
- This is the safe default — better to over-suppress than under-suppress

### Edge case: Customer sends STOP then later wants to receive messages again
- Under GDPR, they have the right to re-consent
- But this is extremely rare and we don't need to build a self-service flow for it
- If it happens, the business owner contacts us, we verify the customer wants to opt back in, and we manually delete the suppression record via the admin API
- Add an admin endpoint for this: DELETE /api/admin/suppressions with phone_number and user_id parameters, protected by ADMIN_API_KEY

---

## 6. ADMIN TOOLS

### View suppressions:
```
GET /api/admin/suppressions?user_id={user_id}
```
Returns all suppressions for a specific business. Protected by ADMIN_API_KEY.

### Remove a suppression (for re-consent):
```
DELETE /api/admin/suppressions
Body: { "phone_number": "+447xxxxxxxxx", "user_id": "uuid" }
```
Protected by ADMIN_API_KEY. Log the removal for audit purposes.

### Suppression stats in health monitoring:
Add to the daily health report:
- Total suppressions created yesterday
- Total suppressed messages (requests that were blocked)
- If suppressions spike suddenly, it could indicate a problem with message quality

---

## BUILD ORDER

1. Create the sms_suppressions table and auto_reply_log table with RLS policies
2. Add 'suppressed' to review_request status handling everywhere (dashboard badges, stats exclusions, etc.)
3. Update the Twilio webhook to detect inbound SMS vs delivery status
4. Implement STOP handling (create suppression, cancel pending requests)
5. Implement general reply auto-response with 24-hour rate limiting
6. Add suppression check to send-sms cron job
7. Add suppression check to send-nudges cron job
8. Add suppression check to the send request form (block sending to suppressed numbers)
9. Add suppression check to bulk upload validation
10. Add suppressed number list to dashboard settings
11. Create admin endpoints for viewing and removing suppressions
12. Add suppression metrics to daily health report
13. Test the full flow: send SMS → reply STOP → verify suppression created → verify no further messages sent → verify dashboard shows suppressed status

Start with step 1.
