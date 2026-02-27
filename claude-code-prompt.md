# Grow Our Reviews — Full Claude Code Build Prompt

## Copy and paste this into Claude Code to get started. You can feed it in sections if needed.

---

## PROJECT OVERVIEW

I'm building a SaaS called **Grow Our Reviews** (growourreviews.com). It's a review capture automation tool for tradespeople and local service businesses.

**How it works:**
After completing a job, the business owner logs into their dashboard, enters the customer's name and phone number, and hits send. The system sends the customer an SMS with a personalised message and a link. The link takes the customer to a "sentiment gate" page — if they rate their experience 4-5 stars, they're redirected to the business's Google Reviews page to leave a public review. If they rate 1-3 stars, they're sent to a private feedback form instead (protecting the business from bad public reviews). If the customer doesn't click the link within 48 hours, one gentle nudge SMS is sent automatically. The business owner has a dashboard showing all their requests, click rates, and review activity.

---

## TECH STACK

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL + Auth + Row Level Security)
- **SMS:** Twilio
- **Payments:** Stripe (subscription billing with Checkout + Customer Portal)
- **Email:** Resend (for transactional emails like welcome, receipts)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui

---

## DATABASE SCHEMA (Supabase/PostgreSQL)

Create the following tables:

### users (extends Supabase auth.users)
```
profiles
- id (uuid, references auth.users, primary key)
- email (text, not null)
- business_name (text)
- google_review_url (text)
- phone (text)
- sms_delay_hours (integer, default 2) — how many hours after submission to send the SMS
- nudge_enabled (boolean, default true)
- nudge_delay_hours (integer, default 48)
- monthly_request_limit (integer, default 50)
- stripe_customer_id (text)
- stripe_subscription_id (text)
- subscription_status (text, default 'trialing') — trialing, active, past_due, cancelled
- trial_ends_at (timestamp)
- created_at (timestamp, default now())
- updated_at (timestamp, default now())
```

### customers
```
- id (uuid, primary key, default gen_random_uuid())
- user_id (uuid, references profiles.id, not null)
- name (text, not null)
- phone (text, not null)
- email (text, nullable)
- created_at (timestamp, default now())
```

### review_requests
```
- id (uuid, primary key, default gen_random_uuid())
- user_id (uuid, references profiles.id, not null)
- customer_id (uuid, references customers.id, not null)
- status (text, default 'scheduled') — scheduled, sent, clicked, reviewed, feedback_given, failed
- sms_message_sid (text, nullable) — Twilio message ID
- scheduled_for (timestamp, not null)
- sent_at (timestamp, nullable)
- clicked_at (timestamp, nullable)
- nudge_sent (boolean, default false)
- nudge_sent_at (timestamp, nullable)
- token (text, unique, not null) — unique token for the sentiment gate URL
- created_at (timestamp, default now())
```

### feedback
```
- id (uuid, primary key, default gen_random_uuid())
- review_request_id (uuid, references review_requests.id, not null)
- user_id (uuid, references profiles.id, not null)
- rating (integer, not null) — 1-5
- comment (text, nullable)
- created_at (timestamp, default now())
```

### Enable Row Level Security on all tables. Users should only be able to read/write their own data. The sentiment gate and feedback pages need public read/write access to specific review_requests and feedback rows (accessed via token).

---

## API ROUTES / SERVER ACTIONS

### Authentication
- Sign up (email + password via Supabase Auth)
- Login
- Logout
- Password reset

### Onboarding
- POST: Save business_name and google_review_url to profile
- Redirect to dashboard after onboarding complete

### Review Requests
- POST /api/review-requests — Create a new review request
  - Accepts: customer_name, customer_phone
  - Creates customer record if new, or finds existing by phone
  - Generates unique token for sentiment gate URL
  - Calculates scheduled_for based on user's sms_delay_hours setting
  - Returns the created review request

- GET /api/review-requests — List all review requests for the authenticated user (paginated)

### SMS Sending (background job / cron)
- GET /api/cron/send-sms — Called by Vercel Cron every 5 minutes
  - Finds all review_requests where status = 'scheduled' AND scheduled_for <= now()
  - Sends SMS via Twilio for each
  - SMS content: "Hi {customer_name}, thanks for choosing {business_name}! If you were happy with our work, we'd really appreciate a quick review — it only takes 30 seconds: {sentiment_gate_url}"
  - Updates status to 'sent', records sent_at and sms_message_sid
  - Protect with a secret key in the header (CRON_SECRET env var)

- GET /api/cron/send-nudges — Called by Vercel Cron every hour
  - Finds all review_requests where status = 'sent' AND nudge_sent = false AND sent_at < (now - user's nudge_delay_hours)
  - Sends nudge SMS: "Hi {customer_name}, just a gentle reminder — if you have 30 seconds, {business_name} would really appreciate a quick review: {sentiment_gate_url}. No pressure at all!"
  - Updates nudge_sent = true, nudge_sent_at = now()

### Sentiment Gate (public pages, no auth required)
- GET /review/{token} — The sentiment gate page
  - Looks up the review_request by token
  - Updates status to 'clicked' and records clicked_at (if first click)
  - Shows: business name, "How was your experience with {business_name}?" and 5 clickable stars
  - If customer selects 4-5 stars: redirect to the business's google_review_url
  - If customer selects 1-3 stars: show the private feedback form

- POST /api/feedback — Submit private feedback
  - Accepts: token, rating, comment
  - Creates feedback record
  - Updates review_request status to 'feedback_given'
  - Shows a thank you message

### Stripe Billing
- POST /api/stripe/create-checkout — Creates a Stripe Checkout session for the selected plan
- POST /api/stripe/webhook — Handles Stripe webhook events:
  - checkout.session.completed → update profile with stripe_customer_id, stripe_subscription_id, subscription_status = 'active'
  - customer.subscription.updated → update subscription_status
  - customer.subscription.deleted → update subscription_status = 'cancelled'
  - invoice.payment_failed → update subscription_status = 'past_due'
- GET /api/stripe/portal — Creates a Stripe Customer Portal session for managing subscription

### Dashboard Stats
- GET /api/stats — Returns for the authenticated user:
  - Total requests sent (this month)
  - Total clicks (this month)
  - Total reviews (status = 'reviewed', this month)
  - Total private feedback received (this month)
  - Click-through rate (clicks / sent)
  - Requests remaining this month (limit - sent)

---

## PAGES & ROUTES

### Public Pages (no auth)
1. **/** — Landing page / marketing site
2. **/pricing** — Pricing page with two tiers
3. **/login** — Login form
4. **/signup** — Sign up form
5. **/review/[token]** — Sentiment gate page (customer-facing)
6. **/review/[token]/feedback** — Private feedback form
7. **/review/[token]/thanks** — Thank you page after feedback or review redirect

### Protected Pages (auth required)
8. **/onboarding** — First-time setup: business name + Google review URL
9. **/dashboard** — Main dashboard with stats and recent activity
10. **/dashboard/send** — Form to send a new review request (customer name + phone)
11. **/dashboard/requests** — Full list of all review requests with status
12. **/dashboard/feedback** — View private feedback received
13. **/dashboard/settings** — Business info, SMS timing, subscription management
14. **/dashboard/billing** — Subscription status + link to Stripe Customer Portal

---

## LANDING PAGE CONTENT & STRUCTURE

The landing page should be clean, professional, and conversion-focused. Use a blue/indigo primary colour with white background. Modern SaaS design.

### Hero Section
- Headline: "Turn Happy Customers Into 5-Star Reviews — Automatically"
- Subheadline: "Grow Our Reviews sends your customers a quick review request after every job. More Google reviews, better rankings, more work. Set it up in 2 minutes."
- CTA button: "Start Your Free Trial" → /signup
- Secondary CTA: "See How It Works" → scrolls to how it works section

### How It Works Section (3 steps with icons)
1. "Finish a job" — Enter your customer's name and phone number
2. "We send the request" — A friendly SMS goes out automatically asking for a review
3. "Reviews roll in" — Happy customers go to Google. Unhappy ones give you private feedback instead.

### Features Section
- **Sentiment Gate** — "Only happy customers get sent to Google. If someone's unhappy, they tell you privately instead. Your public rating is protected."
- **Automatic Follow-Up** — "If they don't respond, we send one gentle nudge 48 hours later. No spam, just a polite reminder."
- **Simple Dashboard** — "See every request, every click, every review. Know exactly what's working."
- **Works for Any Trade** — "Plumbers, electricians, builders, roofers, landscapers, cleaners — if you do great work, this tool makes sure people say so."

### Social Proof Section
- Placeholder for testimonials (use realistic but clearly placeholder content for now, e.g. "Since using Grow Our Reviews, we've gone from 12 Google reviews to 67 in three months." — placeholder)
- "Trusted by 100+ tradespeople across the UK" (placeholder stat)

### Pricing Section
- Embed the pricing component (same as /pricing page)

### FAQ Section
- "How does it work?" — Short explanation
- "Will customers find it annoying?" — "We send one request and one optional nudge. That's it. No spam."
- "What if a customer is unhappy?" — "They get a private feedback form instead of being sent to Google. You see the feedback, and it never goes public."
- "Do I need any technical knowledge?" — "None. If you can send a text, you can use Grow Our Reviews."
- "Can I cancel anytime?" — "Yes, no contracts, cancel anytime from your dashboard."
- "How long until I see results?" — "Most businesses see their first new review within 24-48 hours of sending their first request."

### Footer
- Logo, copyright, links to privacy policy, terms, contact email

---

## PRICING TIERS (Stripe Products)

### Starter — £49/month
- Up to 50 review requests per month
- SMS review requests
- Sentiment gate (review filtering)
- Simple dashboard
- Email support

### Growth — £79/month
- Up to 150 review requests per month
- Everything in Starter
- Automatic 48-hour nudge follow-ups
- Priority support

### Both plans include a 14-day free trial (no card required to start, card required to continue after trial).

---

## SMS MESSAGE TEMPLATES

### Initial Review Request
```
Hi {customer_name}, thanks for choosing {business_name}! If you were happy with our work, we'd really appreciate a quick review — it only takes 30 seconds 👇

{sentiment_gate_url}
```

### Nudge (48 hours later)
```
Hi {customer_name}, just a gentle reminder — if you have 30 seconds, {business_name} would love a quick review:

{sentiment_gate_url}

No pressure at all — thanks!
```

---

## SENTIMENT GATE PAGE DESIGN

This is the most important page in the entire app — it's what the customer sees.

- Clean, mobile-first design (most customers will open this on their phone from an SMS)
- Show the business name prominently at the top
- "How was your experience with {business_name}?"
- 5 large, tappable star icons in a row
- When they tap a star rating:
  - 4-5 stars: Show a brief "Thank you! Redirecting you to leave a review..." message, then redirect to the Google review URL after 1.5 seconds
  - 1-3 stars: Show the private feedback form with a text area: "We're sorry to hear that. Your feedback helps us improve. What could we have done better?" and a submit button
- After feedback submission: "Thank you for your feedback. We'll use this to improve our service."
- No login required, no app download, no friction. One tap on the SMS link, one tap on the stars, done.

---

## ENVIRONMENT VARIABLES NEEDED

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
STRIPE_GROWTH_PRICE_ID=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000 (change to https://growourreviews.com in production)
CRON_SECRET= (random string to protect cron endpoints)
```

---

## IMPORTANT IMPLEMENTATION NOTES

1. **Mobile-first design throughout.** The dashboard will mostly be used on phones by tradespeople between jobs. The sentiment gate page is always on mobile.

2. **The sentiment gate page must be FAST.** No unnecessary JavaScript, no heavy frameworks on this page. It should load instantly on a 3G connection. Consider making it a lightweight static page.

3. **Phone number validation.** Accept UK format (07xxx, +447xxx) and basic international. Store in E.164 format for Twilio.

4. **Rate limiting.** Add rate limiting to the SMS sending to prevent abuse. Respect Twilio rate limits.

5. **Don't send SMS between 9pm and 8am.** If a request is scheduled for overnight, delay until 8am the next morning. Nobody wants a review request at midnight.

6. **The Google Review URL.** Help the user find this during onboarding. The format is typically: `https://search.google.com/local/writereview?placeid=PLACE_ID`. Consider adding a helper that lets them search for their business and auto-generates the URL using the Google Places API (or just give them clear instructions on how to find it manually for v1).

7. **Supabase Row Level Security.** This is critical. Every table must have RLS policies so users can only access their own data. The sentiment gate pages need a policy allowing public access to review_requests by token only.

8. **Stripe webhook verification.** Always verify the Stripe webhook signature. Use the stripe library's constructEvent method.

9. **Error handling for SMS failures.** If Twilio fails to send, update the review_request status to 'failed' and show it on the dashboard so the business owner can retry.

10. **Keep the codebase simple.** No over-engineering. No complex state management. Server components where possible. Minimal client-side JavaScript.

---

## BUILD ORDER

Please build in this order:

1. **Project setup** — Initialise Next.js with TypeScript, Tailwind, shadcn/ui. Set up project structure.
2. **Supabase setup** — Database schema, RLS policies, auth configuration.
3. **Authentication** — Sign up, login, logout, password reset pages and logic.
4. **Onboarding flow** — After first login, collect business name + Google review URL.
5. **Dashboard layout** — Sidebar/nav, stats overview, protected route wrapper.
6. **Send review request** — Form to enter customer name + phone, creates the request in the database.
7. **Sentiment gate page** — Public page at /review/[token] with star rating and feedback form.
8. **Twilio SMS integration** — API route to send SMS, cron job for scheduled sends.
9. **Nudge follow-up** — Cron job for sending nudge SMS after 48 hours.
10. **Request list page** — View all review requests with their status.
11. **Feedback page** — View all private feedback received.
12. **Stripe integration** — Checkout, webhooks, customer portal, subscription gating.
13. **Settings page** — Update business info, SMS delay timing, manage subscription.
14. **Landing page** — Marketing homepage with all sections described above.
15. **Pricing page** — Standalone pricing page.
16. **Polish** — Loading states, error handling, toast notifications, responsive design check.

---

Start with step 1. Set up the project and let me know when ready to proceed to step 2.
