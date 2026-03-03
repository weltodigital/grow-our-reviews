# Grow Our Reviews — Custom SMS Templates & Bulk Customer Upload

## FEATURE 1: CUSTOMISABLE SMS TEMPLATES

### Overview
Business owners should be able to personalise the SMS messages that get sent to their customers. We don't want them to write completely freeform messages (they might accidentally remove the review link, write something spammy, or make it too long for SMS). Instead, give them control over specific parts of the message while keeping the structure and review link locked in.

### Database Changes

Add a new table:

```
sms_templates
- id (uuid, primary key, default gen_random_uuid())
- user_id (uuid, references profiles.id, not null)
- type (text, not null) — 'initial' or 'nudge'
- greeting (text, default 'Hi')
- opening_line (text, default 'thanks for choosing {business_name}!')
- request_line (text, default 'If you were happy with our work, we''d really appreciate a quick review — it only takes 30 seconds')
- sign_off (text, nullable, default null) — e.g. "Cheers, Mike" or "Thanks, Smith Plumbing"
- is_active (boolean, default true)
- created_at (timestamp, default now())
- updated_at (timestamp, default now())
```

Add RLS policy: users can only read/write their own templates.

When a user signs up, automatically create two default templates (initial and nudge) with the default values.

### How the SMS is assembled

The final SMS is always constructed from fixed structure + user-customisable parts + the review link (which is never editable). The formula:

**Initial request:**
```
{greeting} {customer_name}, {opening_line}

{request_line} 👇

{review_link}

{sign_off}
```

**Nudge:**
```
{greeting} {customer_name}, just a gentle reminder — {request_line}:

{review_link}

{sign_off}
```

The `{customer_name}`, `{business_name}`, and `{review_link}` variables are always injected automatically. The user never sees or edits these — they just see where they'll appear.

If sign_off is null/empty, that line is simply omitted from the SMS.

### SMS Template Settings Page

Add a new section to the Settings page (/dashboard/settings) OR create a dedicated page at /dashboard/templates. I'd recommend a tab or section within Settings to keep things simple.

**Section title:** "Customise Your Messages"
**Subtitle:** "Personalise the SMS your customers receive. The review link is always included automatically."

Show two tabs or sections: "Review Request" and "Follow-Up Nudge"

**For each template, show:**

An editable form with these fields:

1. **Greeting** — text input, max 20 characters
   - Placeholder: "Hi"
   - Helper text: "This appears before the customer's name"
   - Preview shows: "{greeting} Sarah,"

2. **Opening line** — text input, max 150 characters
   - Placeholder: "thanks for choosing {business_name}!"
   - Helper text: "This appears right after the customer's name. Use {business_name} to insert your business name automatically."
   - Show character count

3. **Review request line** — textarea, max 200 characters
   - Placeholder: "If you were happy with our work, we'd really appreciate a quick review — it only takes 30 seconds"
   - Helper text: "This is the main ask. Keep it friendly and short."
   - Show character count

4. **Sign-off** — text input, max 50 characters, OPTIONAL
   - Placeholder: "e.g. Cheers, Mike"
   - Helper text: "Optional. Add a personal touch."

5. **"Reset to default"** link — resets all fields to the default text

**Below the form, show a LIVE PREVIEW:**

A mock SMS bubble (like the one on the landing page) that updates in real time as they type. Use a realistic example:

```
{greeting} Sarah, {opening_line}

{request_line} 👇

https://growourreviews.com/review/abc123

{sign_off}
```

Replace {business_name} with their actual business name from their profile. Replace {greeting}, {opening_line}, {request_line}, {sign_off} with whatever they've typed in the fields. Show "Sarah" as a placeholder customer name.

**Below the preview, show:**
- Character count for the total assembled message: "Message length: 142 / 160 characters"
- If over 160 characters, show a warning: "This message is over 160 characters and will be sent as 2 SMS segments, which costs more. Try shortening your message."
- A "Save" button

**Important validation rules:**
- The review link ({review_link}) is NEVER shown in the editable fields and NEVER removable. It's always appended automatically. Make this clear in the UI: "Your review link is always included automatically — you don't need to add it."
- {business_name} can be used in the opening_line field and will be replaced with their actual business name
- {customer_name} is always prepended after the greeting automatically
- Don't let them save if total assembled message (with sample data) exceeds 300 characters — that's getting into 3-segment SMS territory which is too expensive
- Strip any URLs from user input — they shouldn't be adding their own links

### Update the SMS Sending Logic

In the cron jobs that send SMS (/api/cron/send-sms and /api/cron/send-nudges):

1. When building the SMS, first check if the user has a custom template for that type (initial or nudge)
2. If they do, use their custom fields to assemble the message
3. If they don't (shouldn't happen if we create defaults on signup, but as a fallback), use the hardcoded default messages
4. Always inject {customer_name}, {business_name}, and {review_link} into the assembled message
5. Always append the review link — even if somehow their template doesn't reference it

### Migration for Existing Users

When this feature ships, create default templates for any existing users who don't have them. Run this as a one-time migration or handle it in the SMS sending logic as a fallback.

---

## FEATURE 2: BULK CUSTOMER UPLOAD

### Overview
A tradesperson who signs up today might have done 500 jobs over the past few years with customers who never left a review. Instead of entering them one by one, let them upload a CSV/spreadsheet of past customers and send review requests to all of them (within their plan limits).

This is a powerful onboarding moment — they go from "I have 8 Google reviews" to potentially sending 50 requests in one go on their first day.

### Upload Page

Create a new page at /dashboard/upload OR add it as a prominent section on /dashboard/send.

**Page heading:** "Send Requests to Previous Customers"
**Subtitle:** "Upload a list of past customers and send them all a review request. Perfect for catching up on reviews you've missed."

### Upload Flow

**Step 1: Download Template**

Show a "Download CSV template" button that downloads a simple CSV file with these columns:

```csv
name,phone
Sarah Johnson,07712345678
Mike Williams,07798765432
```

Also show the format requirements clearly:
- "Your file should have two columns: **name** and **phone**"
- "Phone numbers should be UK mobile numbers (starting with 07)"
- "Save as .csv (comma separated values)"
- "Maximum 200 rows per upload"

Show a mini example table on the page so they can see the expected format without downloading:

| name | phone |
|------|-------|
| Sarah Johnson | 07712345678 |
| Mike Williams | 07798765432 |

**Accepted file formats:** .csv only (keeps it simple — no Excel parsing needed)

**Step 2: Upload File**

A drag-and-drop zone or file picker button: "Drop your CSV here or click to browse"

On upload, parse the CSV client-side and show a preview:

**Step 3: Preview & Validate**

Show a table of all parsed rows with validation status:

| # | Name | Phone | Status |
|---|------|-------|--------|
| 1 | Sarah Johnson | +447712345678 | ✅ Ready |
| 2 | Mike Williams | +447798765432 | ✅ Ready |
| 3 | | 07700123456 | ❌ Name missing |
| 4 | Dave Roberts | 0771234 | ❌ Invalid phone number |
| 5 | Sarah Johnson | +447712345678 | ⚠️ Duplicate (row 1) |
| 6 | Jane Smith | +447712345678 | ⚠️ Already sent request |

**Validation rules:**
- Name is required and must be at least 2 characters
- Phone is required and must be a valid UK mobile number. Accept these formats and normalise to E.164:
  - 07xxxxxxxxx → +447xxxxxxxxx
  - +447xxxxxxxxx (already correct)
  - 447xxxxxxxxx → +447xxxxxxxxx
  - 00447xxxxxxxxx → +447xxxxxxxxx
- Check for duplicates within the uploaded file (same phone number)
- Check for duplicates against existing customers for this user (same phone number) who already have a review_request in the last 30 days — mark as "Already sent request"
- Rows with errors are highlighted in red and excluded from the send
- Rows with warnings (duplicates) are highlighted in yellow — let the user decide whether to include them

**Show a summary above the table:**
- "12 customers ready to send"
- "2 errors (will be skipped)"
- "1 duplicate (optional)"
- "Your plan allows 50 requests/month. You've used 8 this month. You can send up to 42 more."

If the number of valid rows exceeds their remaining monthly limit, show a warning:
"You have 42 requests remaining this month but your file has 65 valid customers. Only the first 42 will be sent. Upgrade to Growth for 150 requests/month, or send the rest next month."

Let them proceed with a partial send (first N customers up to their limit) — don't block the entire upload.

**Step 4: Confirm & Send**

A "Send {N} Review Requests" button.

On click, show a confirmation modal:
- "You're about to send {N} review requests"
- "SMS messages will be sent gradually over the next few hours to avoid looking like spam"
- "Each customer will receive one polite review request"
- Two buttons: "Send All" and "Cancel"

**Step 5: Processing**

On confirmation:

1. Create customer records for any new customers (match existing by phone + user_id)
2. Create review_request records for each valid row
3. **IMPORTANT: Stagger the scheduled_for times.** Don't schedule all 50 requests for the same time — that looks spammy and could trigger Twilio rate limits. Instead:
   - Schedule them in batches of 5, spaced 15 minutes apart
   - So 50 requests would be sent over ~2.5 hours
   - First batch: now + user's sms_delay_hours
   - Second batch: now + sms_delay_hours + 15 minutes
   - Third batch: now + sms_delay_hours + 30 minutes
   - And so on
   - Still respect the 9pm-8am quiet hours rule
4. Show a success page: "Done! {N} review requests have been scheduled. They'll be sent gradually over the next few hours. Check your dashboard to track progress."
5. Redirect to /dashboard/requests where they can see all the scheduled requests

### Dashboard Updates

On the main dashboard, after a bulk upload, the recent activity section should show:
- "Bulk upload: 42 review requests scheduled" with a timestamp
- Individual requests appear in the request list as normal with status "scheduled"

### Upload History

On the upload page, below the upload form, show a simple history of previous uploads:
- Date, number of customers uploaded, number sent, number of reviews received
- This gives them a reason to do another bulk upload later (e.g. after accumulating more past customers)

### CSV Parsing Notes

- Use a client-side CSV parser (papaparse is already available in the project)
- Handle common issues gracefully:
  - Extra whitespace in names/numbers → trim
  - Empty rows → skip silently
  - Header row with different casing (Name, PHONE, etc.) → normalise to lowercase
  - BOM characters in UTF-8 files → strip
  - Quoted fields → handle correctly
- If the file has more than 2 columns, only use the first two (or look for columns named "name" and "phone")
- If the file has no header row (first row looks like a name and phone number), treat it as data, not a header
- Maximum file size: 1MB (way more than enough for 200 rows)

### Permissions & Limits

- Both Starter and Growth users can use bulk upload
- The upload is still subject to their monthly request limit
- The 200-row-per-upload limit prevents abuse and keeps processing fast
- Rate limit: maximum 3 uploads per day per user (prevent accidental re-uploads)

---

## BUILD ORDER

### SMS Templates (build first — simpler feature, high value):
1. Create sms_templates database table and RLS policies
2. Create default templates on user signup
3. Build the template editing UI in Settings
4. Build the live SMS preview component
5. Update SMS sending logic to use custom templates
6. Add character count and validation
7. Migration: create default templates for existing users

### Bulk Upload (build second — more complex but high impact):
8. Create the upload page UI with drag-and-drop
9. Build the CSV template download
10. Build CSV parsing and validation logic (client-side)
11. Build the preview table with validation status
12. Build the confirmation and staggered scheduling logic
13. Add the plan limit checking and warnings
14. Build the success page and redirect
15. Add upload history section
16. Test with various CSV formats and edge cases

Start with step 1 — create the sms_templates table.
