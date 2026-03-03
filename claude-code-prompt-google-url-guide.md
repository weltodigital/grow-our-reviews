# Grow Our Reviews — Google Review URL Setup Guide & Optional Onboarding

## CONTEXT

The Google Review URL is essential for the app to work — it's where happy customers get redirected after rating 4-5 stars. But most tradespeople don't know what this URL is or how to find it, and it's currently a potential wall during onboarding that could cause people to abandon setup.

We need to:
1. Make the Google Review URL field optional during onboarding (so they can skip it and explore the dashboard)
2. Block them from sending their first review request until they've added it (because without it, the sentiment gate has nowhere to redirect happy customers)
3. Provide a clear, visual, step-by-step guide that shows them exactly how to find their Google Review URL — written for someone who is not tech-savvy and is probably looking at this on their phone between jobs

## CHANGES TO ONBOARDING (/onboarding)

### Current behaviour:
- Business name and Google Review URL are both collected during onboarding
- User can't proceed without filling in both

### New behaviour:
- Business name is still REQUIRED (can't skip this)
- Google Review URL becomes OPTIONAL with a "Skip for now" link
- If they enter it, great — save it and proceed to dashboard as normal
- If they skip it, save the profile with google_review_url as null and proceed to dashboard
- Show a brief message when they skip: "No problem — you can add this anytime from Settings. You'll need it before you can send your first review request."

## GOOGLE REVIEW URL PROMPT IN DASHBOARD

When the user lands on the dashboard and their google_review_url is null, show a prominent but friendly banner at the top of the dashboard:

**Banner design:**
- Light yellow/amber background with a subtle border
- Icon: a link/chain icon or Google "G" icon
- Headline: "One more step before you can send review requests"
- Body: "You need to add your Google Review link so we know where to send your happy customers. It takes about 60 seconds."
- Two buttons:
  - Primary: "Add Google Review Link" → opens the guide/modal described below
  - Secondary/text: "Show me how to find it" → opens the step-by-step guide

This banner should appear on every dashboard page until the URL is set. It should NOT be dismissable — they genuinely can't use the product without it.

## BLOCK SENDING WITHOUT URL

On the "Send Review Request" page (/dashboard/send):

- If google_review_url is null, don't show the send form at all
- Instead show a full-page message:
  - Heading: "Before you can send review requests, you need to add your Google Review link"
  - Body: "This is the link where your happy customers will be sent to leave a Google review. Without it, we don't know where to direct them."
  - Primary button: "Add Google Review Link" → opens the setup modal/page
  - Below: "Need help finding it?" → opens the step-by-step guide

## THE SETUP MODAL / INLINE FORM

When the user clicks "Add Google Review Link", show either a modal or an inline section with:

1. A text input field for the URL
2. A "Paste your link here" placeholder
3. Basic validation: must start with "https://" and contain "google" — show an inline error if it doesn't look right: "This doesn't look like a Google Review link. Check the guide below for help finding the right one."
4. A "Save" button
5. Below the input: "Don't have your link yet? Follow our step-by-step guide below ↓"

## THE STEP-BY-STEP GUIDE

This is the most important part. Create a dedicated guide component that can be shown:
- Below the URL input in the setup modal
- As a standalone page at /help/google-review-link (accessible from settings too)
- In an expandable section on the onboarding page

### Guide content:

**Title:** "How to Find Your Google Review Link"
**Subtitle:** "Follow these steps — it takes about 60 seconds"

---

**Method 1: From Google Search (Easiest)**

**Step 1:** Open Google on your phone or computer and search for your exact business name. For example: "Smith Plumbing Bristol"

*Show a mockup/illustration of a Google search bar with "Smith Plumbing Bristol" typed in. Style it to look like a Google search but make it clearly an illustration, not a screenshot. Use a clean card with a light grey background, rounded corners, and a simple search bar graphic with the Google "G" icon on the left. Below the search bar, show a simplified business result card with a star rating and the business name.*

**Step 2:** Find your business in the search results. You should see your Google Business Profile on the right side (desktop) or at the top (mobile) with your business name, star rating, and reviews.

*Show a mockup of a Google Business Profile card with: business name, star rating (e.g. 4.6 stars), number of reviews, address, phone number. Include a row of action buttons like you'd see on a real profile.*

**Step 3:** Click the "Ask for reviews" button (it might also say "Get more reviews"). If you don't see this button, click on your business name first to open the full profile, then look for it.

*Show a mockup highlighting the "Ask for reviews" button. Use an arrow or highlight circle pointing to it.*

**Step 4:** A popup will appear with your unique review link. Click "Copy link" or select the entire link and copy it.

*Show a mockup of the Google "Share review form" popup that appears, with a link and a "Copy link" button. Highlight the copy button.*

**Step 5:** Come back to Grow Our Reviews and paste the link into the field above.

*Show a simple mockup of the Grow Our Reviews input field with a pasted URL.*

---

**Method 2: From Google Maps**

**Step 1:** Go to Google Maps (maps.google.com) and search for your business name.

**Step 2:** Click on your business listing to open your profile.

**Step 3:** Click "Ask for reviews" or the "Get more reviews" link.

**Step 4:** Copy the link from the popup that appears.

**Step 5:** Paste it into Grow Our Reviews.

---

**Method 3: From Google Business Profile Dashboard**

**Step 1:** Go to business.google.com and sign in with the Google account you use for your business.

**Step 2:** Click "Home" in the menu on the left.

**Step 3:** Look for the "Get more reviews" card on your dashboard. Click "Share review form".

**Step 4:** Copy the link.

**Step 5:** Paste it into Grow Our Reviews.

---

**Troubleshooting section at the bottom:**

**"I can't find my business on Google"**
"If your business doesn't appear in Google search, you may not have a Google Business Profile yet. You can create one for free at business.google.com — it takes about 10 minutes. Once it's set up and verified, come back here and follow the steps above."

**"I found the link but it looks weird"**
"Google review links usually look something like: https://g.page/r/XXXXX/review or https://search.google.com/local/writereview?placeid=XXXXX. If your link starts with https:// and contains 'google', it's probably correct. Paste it in and try it — we'll validate it for you."

**"I still need help"**
"No problem — email us at hello@growourreviews.com with your business name and we'll find the link for you. We usually respond within a few hours."

---

### DESIGN NOTES FOR THE GUIDE

- Each step should be numbered clearly with large step numbers (1, 2, 3, 4, 5)
- The mockup illustrations for each step should be created as simple, clean SVG or React components — NOT actual Google screenshots (copyright issues). Style them as simplified representations that clearly convey what the user should be looking for. Use grey backgrounds, rounded cards, and simple shapes to suggest the Google UI without copying it.
- Mobile-first layout — most tradespeople will read this on their phone
- Use a step-by-step vertical layout, not a horizontal carousel
- Each method should be in a collapsible accordion, with Method 1 expanded by default (it's the easiest)
- Keep the language simple and conversational. No jargon. Write like you're explaining it to your dad.

### SETTINGS PAGE UPDATE

On the Settings page (/dashboard/settings), the Google Review URL field should:
- Show the current saved URL if one exists
- Have a "Change" button to update it
- Have a "Need help finding this?" link that expands to show the same step-by-step guide
- Validate the URL on save (must start with https:// and contain "google")

### ALSO ADD TO THE ONBOARDING PAGE

On the onboarding page, below the optional Google Review URL field:
- Add a collapsible "How do I find this?" section that shows the same guide
- Keep it collapsed by default so it doesn't overwhelm the page
- The "Skip for now" link should be clearly visible so they don't feel trapped

## BUILD ORDER

1. Make Google Review URL optional in onboarding (add "Skip for now")
2. Create the step-by-step guide component (reusable across pages)
3. Create the mockup illustrations for each step
4. Add the dashboard banner for users without a URL
5. Block the send request page when URL is missing
6. Add the setup modal with URL input + guide
7. Update the settings page with the guide
8. Add the /help/google-review-link standalone page
9. Test the full flow: signup → skip URL → see banner → click guide → add URL → send first request

Start with step 1.
