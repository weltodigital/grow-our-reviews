# Grow Our Reviews — Blog System & 10 SEO-Optimised Articles

## CONTEXT

We need to build a blog section on growourreviews.com and publish 10 SEO-optimised articles targeting tradespeople in the UK. These articles should drive organic search traffic from tradespeople searching for help with Google reviews, local SEO, and getting more work. Each article should be genuinely useful, written in plain English for non-technical readers, and include a soft CTA to our product at the end.

The blog will live at growourreviews.com/blog with individual articles at growourreviews.com/blog/[slug].

---

## PART 1: BLOG INFRASTRUCTURE

### Create the blog system with these requirements:

**Blog listing page (/blog):**
- Page title: "Blog — Grow Our Reviews"
- Meta description: "Practical guides on Google reviews, local SEO, and getting more work for tradespeople. Learn how to grow your online reputation and win more local customers."
- Clean grid layout showing all articles as cards
- Each card shows: featured image placeholder (use a coloured gradient or icon-based header for now), title, meta description excerpt, publication date, estimated reading time, category tag
- Sort by newest first
- Use the same header/footer as the main marketing site

**Individual article pages (/blog/[slug]):**
- Clean, readable layout optimised for long-form content
- Maximum content width of 720px (optimal reading width)
- Typography: 18px base font size, 1.7 line height, comfortable paragraph spacing
- Table of contents generated automatically from H2 headings, shown as a sticky sidebar on desktop and a collapsible section at the top on mobile
- Author byline: "By Ed at Grow Our Reviews" with publication date
- Estimated reading time calculated from word count
- Category tag displayed
- Social sharing buttons (copy link, share to Facebook, share to X/Twitter, share to LinkedIn)
- "Related articles" section at the bottom showing 2-3 other articles
- CTA banner at the bottom of every article (described below)
- Breadcrumb navigation: Blog > [Article Title]

**CTA banner (appears at the bottom of every article):**
- Soft blue/indigo background
- Heading: "Automate your Google review collection"
- Body: "Grow Our Reviews sends your customers a review request after every job. More Google reviews, better local rankings, more work. Try it free for 14 days."
- Button: "Start Your Free Trial" → links to app.growourreviews.com/signup
- Secondary text: "No credit card required for 14 days"

**Internal linking CTA block (reusable component for within articles):**
- A subtle card/callout that can be inserted mid-article
- Light background, small icon
- Format: "💡 Want to automate this? [Grow Our Reviews](/pricing) handles review requests automatically after every job."
- Use sparingly — maximum once per article, placed naturally after a relevant section

---

## PART 2: TECHNICAL SEO SETUP

### Every article page must include:

**1. Meta tags:**
```html
<title>{article_title} | Grow Our Reviews</title>
<meta name="description" content="{meta_description}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://growourreviews.com/blog/{slug}" />
```

**2. Open Graph tags:**
```html
<meta property="og:title" content="{article_title}" />
<meta property="og:description" content="{meta_description}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="https://growourreviews.com/blog/{slug}" />
<meta property="og:site_name" content="Grow Our Reviews" />
<meta property="og:locale" content="en_GB" />
```

**3. Twitter Card tags:**
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{article_title}" />
<meta name="twitter:description" content="{meta_description}" />
```

**4. Article structured data (JSON-LD) — include on every article page:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{article_title}",
  "description": "{meta_description}",
  "author": {
    "@type": "Person",
    "name": "Ed",
    "url": "https://growourreviews.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Grow Our Reviews",
    "url": "https://growourreviews.com"
  },
  "datePublished": "{publish_date_ISO}",
  "dateModified": "{publish_date_ISO}",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://growourreviews.com/blog/{slug}"
  }
}
```

**5. FAQ structured data — add to articles that contain FAQ-style content (articles 2, 7, 10):**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{question}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{answer}"
      }
    }
  ]
}
```

**6. HowTo structured data — add to articles with step-by-step instructions (articles 4, 6):**
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "{how_to_title}",
  "description": "{how_to_description}",
  "step": [
    {
      "@type": "HowToStep",
      "name": "{step_name}",
      "text": "{step_text}"
    }
  ]
}
```

**7. Breadcrumb structured data:**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://growourreviews.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://growourreviews.com/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{article_title}",
      "item": "https://growourreviews.com/blog/{slug}"
    }
  ]
}
```

**8. Blog listing page structured data:**
Add CollectionPage schema to /blog:
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Blog — Grow Our Reviews",
  "description": "Practical guides on Google reviews, local SEO, and getting more work for tradespeople.",
  "url": "https://growourreviews.com/blog"
}
```

**9. XML Sitemap:**
- Generate or update the sitemap at /sitemap.xml to include all blog article URLs
- Each article entry should include: loc, lastmod, changefreq (monthly), priority (0.7)
- Blog listing page priority: 0.8

**10. Internal linking:**
- Every article should link to at least 2 other articles from this set where relevant
- Every article should link to the /pricing page at least once
- The blog listing page should be linked from the main site footer

---

## PART 3: ARTICLE WRITING GUIDELINES

### Voice & Tone:
- Write as if you're a knowledgeable mate explaining something over a cup of tea — not a marketing agency writing a blog post
- Use "you" and "your" throughout — speak directly to the tradesperson
- Use UK English spelling throughout (optimise, colour, favour, behaviour, etc.)
- Avoid jargon. When you must use a technical term (like "Map Pack" or "local SEO"), explain it immediately in plain English
- Short paragraphs (2-4 sentences max). Tradespeople read on their phones between jobs
- Use specific examples for trades: plumbers, electricians, builders, roofers, landscapers. Rotate which trade you reference so every reader sees themselves
- Be direct and practical. Cut waffle. Every sentence should teach something or move the reader forward

### SEO Structure for every article:
- H1: The article title (only one H1 per page)
- H2s: Main sections (these become the table of contents)
- H3s: Subsections within H2s where needed
- Target keyword should appear in: H1, first paragraph, at least one H2, meta description, URL slug
- Use related/secondary keywords naturally throughout (listed per article below)
- Include the target keyword in the first 100 words of the article
- Aim for 1,800-2,500 words per article (long enough to rank, short enough to read)
- Use bold text sparingly to highlight key takeaways
- Include a "Key Takeaways" or "TL;DR" summary box at the top of longer articles (3-5 bullet points)

### URL structure:
- All lowercase, hyphens between words, no trailing slash
- Example: /blog/how-many-google-reviews-to-rank-locally

---

## PART 4: THE 10 ARTICLES

---

### ARTICLE 1

**Title:** How Many Google Reviews Does a Tradesperson Need to Rank in the Map Pack?
**Slug:** how-many-google-reviews-to-rank-locally
**Meta description:** Most tradespeople in the Google Map Pack have 40-80 reviews. Find out how many Google reviews you actually need to rank in local search results and start getting more calls.
**Target keyword:** how many google reviews to rank locally
**Secondary keywords:** google map pack reviews, how many reviews for local seo, tradesman google reviews, google reviews ranking factor
**Category:** Local SEO
**Reading time:** ~8 minutes
**Schema:** Article + BreadcrumbList

**Structure:**

**H1:** How Many Google Reviews Does a Tradesperson Need to Rank in the Map Pack?

**Key Takeaways box** (3-4 bullet points summarising the main findings)

**H2: What is the Google Map Pack and why should you care?**
- Explain the Map Pack (top 3 local results with map) in plain English
- Explain that 75%+ of clicks go to these 3 results
- "If you're not in the Map Pack, most people searching for your trade in your area will never see you"

**H2: How many reviews do the top-ranking tradespeople actually have?**
- Provide realistic UK-specific data. Research and present approximate ranges:
  - Small towns (under 50,000 population): Top 3 results typically have 20-50 reviews
  - Medium towns (50,000-200,000): Top 3 typically have 40-80 reviews
  - Cities (200,000+): Top 3 typically have 60-150+ reviews
- Compare across trades (plumbers, electricians, builders tend to have different averages)
- Key point: "You don't need hundreds. You need more than your local competitors."

**H2: It's not just about quantity — recency matters more than you think**
- Explain that Google heavily weights recent reviews
- A business with 100 reviews but none in the last 6 months will lose ground to one with 30 reviews but 5 in the last month
- "A steady drip of fresh reviews beats a one-time burst every time"

**H2: Your star rating is the other half of the equation**
- Explain the sweet spot (4.2-4.9 stars looks authentic, perfect 5.0 can look suspicious)
- How negative reviews affect ranking vs perception
- Why protecting your rating matters (introduce the concept of sentiment gating without hard-selling)

**H2: How to calculate your personal target**
- Practical framework: search "[your trade] near me" in your area, count the reviews of the top 3 results, aim to match or exceed the #3 spot
- "If the third plumber in your town has 35 reviews and you have 12, your target is 35. Get there as fast as you can, then keep going."

**H2: How to actually get there**
- Brief practical tips: ask after every job, make it easy (direct link), use SMS, automate
- Mention that consistency is key — 2-3 new reviews per week is better than 20 in one week and then nothing
- Internal link to Article 6 (best time to ask) and Article 4 (setting up Google Business Profile)

**Soft CTA at the end** (the standard blog CTA banner)

---

### ARTICLE 2

**Title:** What to Do When You Get an Unfair Google Review (A Tradesperson's Guide)
**Slug:** unfair-google-review-tradesman-guide
**Meta description:** Got an unfair or fake Google review? Here's exactly what to do — from responding professionally to reporting it to Google, with copy-paste response templates for tradespeople.
**Target keyword:** unfair google review tradesman
**Secondary keywords:** how to remove fake google review UK, respond to bad google review tradesman, google review response templates, unfair 1 star review
**Category:** Reputation Management
**Reading time:** ~10 minutes
**Schema:** Article + FAQPage + BreadcrumbList

**Structure:**

**H1:** What to Do When You Get an Unfair Google Review (A Tradesperson's Guide)

**Opening:** Empathise immediately — "You've just seen a 1-star review pop up on your Google profile. Your stomach drops. You know the work was good. This feels personal." Acknowledge the emotion, then tell them this article will give them a clear action plan.

**H2: First — don't respond in anger (seriously)**
- The worst thing you can do is fire back. Explain why.
- "Take 24 hours. Show a mate. Then come back and respond professionally."

**H2: Is the review actually against Google's policies?**
- List what Google will remove: spam, fake reviews (from people who were never customers), reviews containing hate speech, reviews for the wrong business, conflict of interest reviews (competitors)
- List what Google WON'T remove: negative opinions, even if you disagree
- Step-by-step how to report a review to Google via Google Business Profile
- Set realistic expectations: "Google removes about 10% of reported reviews. Don't rely on this as your only strategy."

**H2: How to respond to an unfair review professionally**
- Explain that your response isn't really for the reviewer — it's for every future customer who reads it
- The framework: Acknowledge → Apologise (for their experience, not admitting fault) → Offer to resolve offline → Keep it short
- Provide 4 copy-paste response templates:
  1. Response to a genuine complaint where you made a mistake
  2. Response to an exaggerated or unfair complaint
  3. Response to what you believe is a fake review
  4. Response to a review that's clearly for the wrong business
- Each template should be realistic, professional, and feel like a real tradesperson wrote it — not a corporate PR department

**H2: The real solution — bury it with good reviews**
- One bad review among 8 total reviews looks terrible. One bad review among 60 total reviews barely registers.
- "The best defence against bad reviews is a steady stream of good ones"
- This is where the product pitch fits naturally — automating review collection so bad reviews get buried fast
- Internal link to Article 1 (how many reviews you need)

**H2: FAQ section** (mark up with FAQPage schema)
- "Can I sue someone for leaving a fake Google review in the UK?" (Brief answer: technically yes under defamation law, but it's expensive and rarely worth it. Focus on your response and getting more positive reviews.)
- "How long does it take Google to remove a reported review?" (Usually 5-14 days for a decision, and most reports are rejected.)
- "Should I respond to every review, even good ones?" (Yes — Google rewards engagement, and it shows you care.)
- "Can I pay to have a review removed?" (No. Services claiming to do this are scams. Google's removal process is the only legitimate route.)

---

### ARTICLE 3

**Title:** Google Reviews vs Checkatrade: Which Actually Gets Tradespeople More Work?
**Slug:** google-reviews-vs-checkatrade
**Meta description:** Tradespeople spend £50-100/month on Checkatrade. But do Google reviews get you more work for free? We compare the two to help you decide where to focus.
**Target keyword:** google reviews vs checkatrade
**Secondary keywords:** is checkatrade worth it for tradespeople, checkatrade reviews vs google reviews, best way to get leads as tradesman UK, checkatrade alternatives
**Category:** Getting More Work
**Reading time:** ~9 minutes
**Schema:** Article + BreadcrumbList

**Structure:**

**H1:** Google Reviews vs Checkatrade: Which Actually Gets Tradespeople More Work?

**Opening:** "If you're a tradesperson in the UK, you've probably thought about signing up for Checkatrade — or you're already paying for it and wondering if it's worth the money. Let's compare it properly with the one thing that's completely free: your Google reviews."

**H2: How Checkatrade works (and what it costs)**
- Explain the model: you pay monthly (typically £50-120/month depending on trade and area), you appear in their directory, leads come through
- Pros: established brand, customer trust, vetting badge
- Cons: ongoing cost, shared leads (you and 3 other plumbers get the same enquiry), price competition, you're building Checkatrade's platform not your own
- You don't own the relationship — if you stop paying, your reviews and profile disappear

**H2: How Google reviews work (and why they're free)**
- Explain: your Google Business Profile is free, reviews are free, ranking in the Map Pack is free
- When someone searches "plumber near me", Google shows local results — not Checkatrade results
- Your Google reviews and ranking belong to YOU. You never lose them.
- The more reviews you have, the higher you rank, the more calls you get — at zero cost per lead

**H2: The real comparison — side by side**
- Create a comparison covering:
  - Monthly cost: Checkatrade £50-120/month vs Google Reviews £0 (or cost of automation tool)
  - Lead quality: Checkatrade leads are shared vs Google leads come directly to you
  - Long-term value: Checkatrade reviews disappear if you leave vs Google reviews are permanent
  - Trust signal: Both are trusted, but Google is where people search first
  - Control: Checkatrade controls your listing vs you control your Google profile
  - Visibility: Checkatrade = their platform only vs Google = the world's biggest search engine

**H2: The honest verdict — it's not either/or**
- Be fair: Checkatrade has value, especially for new businesses with no reputation
- But if you had to pick one thing to invest time in, Google reviews give you more long-term value per hour spent
- The smart play: use Checkatrade for short-term leads while building your Google review count. Once your Google presence is strong enough to generate organic leads, evaluate whether Checkatrade is still worth the cost.
- Internal link to Article 7 (how Google local search works) and Article 1 (how many reviews you need)

**H2: How to build your Google reviews while still using Checkatrade**
- Practical tips: every Checkatrade job is also a Google review opportunity
- After every job, send a review request to build your Google profile alongside your Checkatrade profile
- Soft product mention: "Tools like Grow Our Reviews automate this — one review request sent after every job, automatically"

---

### ARTICLE 4

**Title:** How to Set Up a Google Business Profile for Your Trade Business (Step-by-Step)
**Slug:** google-business-profile-setup-tradesmen
**Meta description:** A complete step-by-step guide to setting up your Google Business Profile as a tradesperson. Get found on Google Maps, show up in local search, and start collecting reviews.
**Target keyword:** google business profile setup tradesmen
**Secondary keywords:** google my business for tradesmen UK, how to set up google business profile plumber, google maps listing tradesman, google business profile electrician
**Category:** Local SEO
**Reading time:** ~10 minutes
**Schema:** Article + HowTo + BreadcrumbList

**Structure:**

**H1:** How to Set Up a Google Business Profile for Your Trade Business (Step-by-Step)

**Opening:** "If you don't have a Google Business Profile, you're invisible when someone searches for your trade in your area. Setting one up is free and takes about 15 minutes. Here's exactly how to do it."

**H2: What is a Google Business Profile and why do you need one?**
- Brief explanation: it's the free listing that appears on Google Maps and in local search results
- It shows your business name, phone number, reviews, hours, photos, and location
- Without it, you literally cannot appear in the Map Pack
- Internal link to Article 7 (how Google local search works)

**H2: Step 1 — Create or claim your profile**
- Go to business.google.com
- Search for your business name (it might already exist)
- If it exists, claim it. If not, create a new listing.
- Walk through the form fields: business name, category, address or service area

**H2: Step 2 — Verify your business**
- Explain the verification methods (postcard, phone, email, video)
- Postcard is most common for trades — takes 5-7 days
- "Don't skip verification. Without it, your profile won't appear in search results."

**H2: Step 3 — Fill in every single field**
- Business name (exact legal/trading name — don't stuff keywords)
- Primary category: choose the most specific option (e.g. "Plumber" not "Home Services")
- Secondary categories: add all relevant ones
- Service area: list every town/area you serve
- Phone number, website, hours
- Business description: explain what you do, areas you cover, and what makes you different. Include your trade and location naturally.
- Explain what NOT to do: don't use a fake address, don't keyword-stuff your business name

**H2: Step 4 — Add photos**
- Upload at least 10 photos: your team, your van, completed work (before and after), your tools
- Google profiles with photos get significantly more clicks
- Add new photos regularly — Google rewards active profiles

**H2: Step 5 — Get your Google Review link**
- Step-by-step instructions for finding the review link
- "This is the link you'll share with customers so they can leave you a review"
- Internal link to Article 6 (when and how to ask for reviews)

**H2: Step 6 — Start collecting reviews**
- Your profile is set up but empty reviews look bare
- Ask your last 10-20 happy customers to leave a review
- "The faster you build up your initial review count, the sooner you'll start appearing in local search"
- Soft product CTA

**H2: Common mistakes to avoid**
- Using a PO Box or virtual address (Google may suspend your profile)
- Adding keywords to your business name ("Best Plumber London" — Google will penalise this)
- Ignoring the profile after setup — Google favours active profiles
- Not responding to reviews

Mark up the step-by-step sections with HowTo schema.

---

### ARTICLE 5

**Title:** Why Your Competitor With Worse Work Gets More Jobs Than You
**Slug:** competitor-gets-more-work-than-you
**Meta description:** You do better work but your competitor gets more calls. Here's why — and exactly what to do about it. The answer isn't working harder, it's working smarter on your online presence.
**Target keyword:** competitor gets more work tradesman
**Secondary keywords:** how to get more work as a tradesman, tradesman not getting enough work, plumber not enough jobs, online reputation tradesmen
**Category:** Getting More Work
**Reading time:** ~8 minutes
**Schema:** Article + BreadcrumbList

**Structure:**

**H1:** Why Your Competitor With Worse Work Gets More Jobs Than You

**Opening:** "You've been in the trade for years. Your work is excellent. Your customers are happy. But somehow, the bloke down the road — the one you know cuts corners — is booked solid and you've got gaps in your diary. What's going on?"

**H2: It's not about the quality of your work (not anymore)**
- The honest truth: skill matters, but it's table stakes. Lots of tradespeople do good work.
- The deciding factor for most customers is who they FIND first and who they TRUST at first glance
- And both of those are determined by your online presence — specifically your Google reviews

**H2: The 3-second decision**
- When someone searches "electrician near me", they see 3 results in the Map Pack
- They glance at the name, star rating, and number of reviews
- A tradesperson with 60 reviews and 4.8 stars gets the call. One with 8 reviews and 4.5 stars doesn't. Even if the second one does better work.
- "The customer has no way to judge your work before hiring you. All they have is your online reputation."

**H2: What your competitor is doing that you're not**
- They're asking for reviews (or automating it)
- They're responding to reviews (Google rewards this)
- They've got a properly filled-out Google Business Profile with photos
- They might be on Checkatrade or other platforms too
- They're not necessarily better at their trade — they're better at being visible
- Internal link to Article 3 (Google reviews vs Checkatrade)

**H2: The gap between happy customers and reviews**
- Most tradespeople have hundreds of satisfied customers but only a handful of reviews
- The reason: customers intend to leave a review but forget. Or they don't know how. Or the moment passes.
- "Your happy customers ARE your marketing. You just need a system to turn their satisfaction into a public review."

**H2: How to close the gap (starting today)**
- Start with the low-hanging fruit: text your last 20 happy customers and ask
- Set up a system: after every job, send a review request within a few hours
- Respond to every review you get (shows Google and customers that you're engaged)
- Fill out your Google Business Profile properly — internal link to Article 4
- Post photos of your work regularly

**H2: What happens when you get this right**
- Paint a picture: 3 months from now, you've gone from 12 reviews to 50. You're now in the Map Pack. Your phone rings more. You can be choosier about jobs. You can charge more.
- "Your competitor didn't get lucky. They got visible. Now it's your turn."
- Internal link to Article 1 (how many reviews to rank) and Article 8 (case study)

---

### ARTICLE 6

**Title:** The Best Time to Ask a Customer for a Google Review (And Exactly What to Say)
**Slug:** best-time-to-ask-for-google-review
**Meta description:** Timing is everything when asking for a Google review. Here's when to ask, what to say (with word-for-word scripts), and how to automate the whole process.
**Target keyword:** best time to ask for google review
**Secondary keywords:** how to ask for google review tradesman, ask customers for reviews, review request message template, when to send review request SMS
**Category:** Google Reviews
**Reading time:** ~8 minutes
**Schema:** Article + HowTo + BreadcrumbList

**Structure:**

**H1:** The Best Time to Ask a Customer for a Google Review (And Exactly What to Say)

**Opening:** "You know you should be asking for reviews. But when's the right moment? And what do you actually say without sounding desperate? Here's the simple answer — and some word-for-word scripts you can steal."

**H2: Why timing matters more than you think**
- Customer satisfaction peaks at the moment the job is done and they can see the result
- That satisfaction fades quickly — within 24-48 hours, they've moved on to other things
- The window for getting a review is short. Miss it and it's gone.

**H2: The best time to ask (ranked)**
1. **2-4 hours after the job** — satisfaction is still high, they've had time to appreciate the work, they're settled
2. **Same day, but later that evening** — gives them time to relax and use their phone
3. **Next morning** — still fresh, and they're likely checking their phone
4. **On the spot before you leave** — bold, and some tradespeople do this well. But it puts pressure on the customer and they might say yes and then forget.
5. **More than 48 hours later** — effectiveness drops significantly. Most won't bother.

**H2: How to ask in person (for those who prefer it)**
- Keep it casual: "If you're happy with the job, I'd really appreciate a quick Google review. It helps other people find us."
- Don't be pushy. Ask once.
- Hand them a business card with a QR code if you have one
- Best for: jobs where you build rapport (kitchen installs, rewires, bigger projects)

**H2: How to ask via text message (the most effective method)**
- Why SMS works: 98% open rate, the link is right there, they can do it in 30 seconds
- Provide 3 SMS templates tradespeople can copy:
  1. **The friendly ask:** "Hi {name}, thanks for choosing {business}! If you were happy with the work, we'd really appreciate a quick Google review — takes 30 seconds: {link}"
  2. **The specific ask:** "Hi {name}, glad we got your {job type} sorted. If you have a moment, a Google review would mean a lot to us: {link}"
  3. **The personal ask:** "Hi {name}, it's {your name} from {business}. Really enjoyed doing the work at yours today. If you're happy, a quick Google review helps us a lot: {link}"
- Explain how to get their Google review link (brief, link to Article 4 for full setup)
- Internal mid-article CTA: "Want this sent automatically after every job? That's exactly what Grow Our Reviews does."

**H2: How to ask via email**
- Less effective than SMS but still works
- Provide a short email template
- Best for commercial clients or larger projects

**H2: The follow-up — one nudge, that's it**
- If they haven't reviewed after 48 hours, send one polite reminder
- Provide a nudge template
- After that, leave it. Two messages maximum. Never three.
- "Pestering customers damages relationships and can lead to negative reviews out of annoyance."

**H2: How to automate the whole thing**
- The problem with doing it manually: you're on to the next job, you forget, the moment passes
- This is why automation works — it removes the forgetting problem entirely
- Describe the automated flow without hard-selling: after every job, enter the customer's name and number, the system handles timing, message, and follow-up
- Soft product CTA

Mark up the "how to ask via text message" section with HowTo schema.

---

### ARTICLE 7

**Title:** How Google Decides Which Tradespeople to Show in Local Search Results
**Slug:** how-google-local-search-works-tradesmen
**Meta description:** Google uses three main factors to decide which tradespeople appear in local search results. Here's how the algorithm works in plain English — and how to use it to get more calls.
**Target keyword:** how google local search works tradesmen
**Secondary keywords:** google map pack ranking factors, local seo for tradesmen UK, how to rank higher on google maps tradesman, google local search algorithm
**Category:** Local SEO
**Reading time:** ~9 minutes
**Schema:** Article + FAQPage + BreadcrumbList

**Structure:**

**H1:** How Google Decides Which Tradespeople to Show in Local Search Results

**Opening:** "When someone types 'plumber near me' into Google, three businesses show up at the top. How does Google pick those three? It's not random, and it's not about who's been around longest. Here's how it actually works."

**H2: The three factors Google uses**
- Briefly introduce: Relevance, Distance, and Prominence
- "Google has confirmed these are the three factors. Everything else is detail."

**H2: Factor 1 — Relevance (does your profile match what they searched?)**
- Google checks whether your business category, description, and content match the search query
- If someone searches "emergency plumber" and your profile category is "Plumber" with "emergency" in your description, you're relevant
- Practical tips: choose the right categories, write a detailed description, add all your services
- Internal link to Article 4 (Google Business Profile setup)

**H2: Factor 2 — Distance (how close are you?)**
- Google prioritises businesses near the searcher's location
- You can't fake this. If someone is in Manchester and you're in London, you won't show up for them.
- But: if you serve multiple areas, make sure your service area is set correctly in your profile
- For tradespeople who travel to customers (most of you), your service area matters more than your office address

**H2: Factor 3 — Prominence (how well-known and trusted is your business?)**
- This is the one you have the most control over
- Prominence is influenced by:
  - **Number of Google reviews** (more = more prominent)
  - **Average star rating** (higher = more prominent)
  - **Recency of reviews** (fresh reviews count more than old ones)
  - **Review velocity** (a steady stream beats a one-time burst)
  - **Whether you respond to reviews** (Google rewards engagement)
  - **Your website and other online mentions** (backlinks, directory listings)
  - **Activity on your profile** (posting updates, adding photos)
- "Reviews are the single biggest lever you can pull for prominence. Everything else is secondary."
- Internal link to Article 1 (how many reviews you need)

**H2: The Map Pack — the only thing that matters**
- Explain what the Map Pack is and why the top 3 spots get almost all the clicks
- Below the Map Pack, most people don't scroll
- "If you're result number 4, you might as well be result number 400"

**H2: What you can do about it (practical action plan)**
- Priority 1: Get more reviews, consistently
- Priority 2: Respond to every review
- Priority 3: Complete your Google Business Profile fully
- Priority 4: Add photos regularly
- Priority 5: Post updates to your profile
- "Focus 80% of your effort on reviews. That's the highest-impact thing you can do."

**H2: FAQ section** (mark up with FAQPage schema)
- "How long does it take to rank in the Map Pack?" (Typically 2-6 months with consistent effort, depending on competition in your area)
- "Can I rank in the Map Pack without a website?" (Yes — your Google Business Profile is what ranks in the Map Pack, not your website. A website helps, but it's not essential for local search.)
- "Does paying for Google Ads help my local ranking?" (No. Paid ads and organic local results are separate. You can't buy your way into the Map Pack.)
- "What if there are already 3 strong businesses in my area?" (The Map Pack isn't fixed. If you build more reviews and a stronger profile, you can overtake them. Businesses that stop collecting reviews eventually lose ground.)

---

### ARTICLE 8

**Title:** How One Tradesperson Went From 6 Google Reviews to 50 in 3 Months
**Slug:** tradesperson-6-to-50-google-reviews
**Meta description:** A practical case study showing how a tradesperson grew from 6 to 50 Google reviews in 3 months using a simple automated system. Here's exactly what they did, step by step.
**Target keyword:** how to get 50 google reviews tradesman
**Secondary keywords:** grow google reviews fast, google review case study tradesman, get more google reviews quickly UK, automated review requests
**Category:** Case Studies
**Reading time:** ~7 minutes
**Schema:** Article + BreadcrumbList

**Structure:**

**H1:** How One Tradesperson Went From 6 Google Reviews to 50 in 3 Months

**Opening:** "This is the story of how one UK tradesperson went from barely showing up on Google to being the top-rated business in their area. No ads, no SEO agency, no tricks. Just a simple system for collecting reviews after every job."

**Note to Claude Code:** Write this as a realistic but anonymised case study. Use "Dave" as the tradesperson's name and "a heating engineer in the Midlands" as his trade and location. Base the numbers on realistic scenarios:
- Starting point: 6 reviews, 4.3 star average, nowhere near the Map Pack
- Month 1: Sent review requests to 30 past customers (bulk upload) + 15 new job customers. Got 18 new reviews.
- Month 2: Sent requests to 20 new job customers. Got 12 new reviews. Now at 36 total.
- Month 3: Sent requests to 25 new job customers. Got 14 new reviews. Now at 50 total, 4.7 stars.
- Result: Started appearing in Map Pack. Phone calls increased noticeably. Could be choosier about which jobs to take.

**H2: Where Dave started**
- 6 reviews, mostly from 2+ years ago
- Great work, happy customers, but never asked for reviews
- Competitor down the road had 45 reviews and was getting all the calls

**H2: Month 1 — the catch-up**
- First: uploaded a list of 30 past customers he knew were happy
- Staggered the requests over a week
- Result: 18 out of 30 left a review (60% conversion from past customers — realistic because they already had a relationship)
- Also started sending requests after every new job — 15 new job requests, 8 reviews
- End of month 1: 32 reviews, 4.6 stars

**H2: Month 2 — building the habit**
- Made it part of his routine: finish job → enter customer name and number → done
- 20 new job requests, 12 reviews (60% conversion from recent jobs is realistic)
- Started responding to every review — short, genuine thank-yous
- End of month 2: 44 reviews

**H2: Month 3 — the results kick in**
- 25 requests, 14 reviews
- Crossed 50 reviews with a 4.7 star average
- Started appearing in the Map Pack for "heating engineer [his town]"
- Noticed 3-4 extra enquiry calls per week from people who found him on Google
- One customer specifically said "I chose you because you had the most reviews"

**H2: The numbers**
- 50 reviews total, up from 6
- Average conversion rate from request to review: approximately 55-60%
- Total time spent: roughly 2 minutes per day (entering customer details)
- Cost: the price of the automation tool + SMS costs
- Return: 3-4 extra jobs per week worth £200-500 each

**H2: What Dave learned**
- Asking past customers first was the quick win — they were happy to help
- The sentiment gate caught 3 unhappy customers who gave private feedback instead of 1-star reviews
- Responding to reviews mattered more than he expected — customers mentioned it
- Consistency was the key. Not big bursts, just steady daily requests.

**H2: How to replicate this**
- Step 1: Set up your Google Business Profile properly (link to Article 4)
- Step 2: Upload your past happy customers and send bulk requests
- Step 3: After every new job, send a review request
- Step 4: Respond to every review
- Step 5: Keep going for 3 months and watch the results
- Product CTA

---

### ARTICLE 9

**Title:** How to Respond to Every Type of Google Review (With Copy-Paste Templates)
**Slug:** google-review-response-templates-tradesmen
**Meta description:** Ready-to-use Google review response templates for tradespeople. Copy, paste, and personalise responses for 5-star reviews, complaints, fake reviews, and everything in between.
**Target keyword:** google review response templates tradesmen
**Secondary keywords:** how to reply to google reviews, google review response examples, respond to negative review tradesman, respond to 5 star review
**Category:** Reputation Management
**Reading time:** ~9 minutes
**Schema:** Article + BreadcrumbList

**Structure:**

**H1:** How to Respond to Every Type of Google Review (With Copy-Paste Templates)

**Opening:** "Responding to Google reviews isn't just polite — it's a ranking factor. Google rewards businesses that engage with their reviews. But knowing what to say isn't always obvious, especially when the review is negative or unfair. Here are ready-to-use templates for every situation."

**H2: Why responding matters (even to good reviews)**
- Google's own documentation says responding to reviews improves local visibility
- Future customers read your responses — it's a chance to show your personality
- Responding to negative reviews professionally can actually win you customers

**H2: How to respond to a 5-star review**
- Keep it short, genuine, and personal. Mention the customer's name and the work if possible.
- Provide 3 template variations:
  1. Short and sweet (2 sentences)
  2. Personal and specific (mentions the job)
  3. Encouraging referrals (thanks them and subtly invites them to recommend you)
- "Don't copy-paste the same reply to every 5-star review. Google can tell, and it looks lazy. Vary your responses."

**H2: How to respond to a 4-star review**
- Don't take it personally — 4 stars is great
- Thank them, acknowledge you always aim for 5 stars, and ask if there's anything you could improve
- 2 template variations

**H2: How to respond to a 3-star review**
- This is borderline. Treat it as useful feedback.
- Thank them, ask what could have been better, offer to discuss it privately
- 2 template variations

**H2: How to respond to a 1 or 2-star review**
- The most important response you'll ever write
- Stay calm. Don't be defensive. Don't argue.
- The framework: Acknowledge → Apologise for their experience → Offer to resolve offline → Keep it short
- 3 template variations:
  1. When the complaint is valid
  2. When the complaint is exaggerated
  3. When you believe the review is unfair or fake
- "Every future customer will read this response. Write it for them, not for the reviewer."
- Internal link to Article 2 (dealing with unfair reviews)

**H2: How to respond to a review with no text (just a star rating)**
- Keep it brief: "Thanks for the review, [name]! Glad we could help."
- 1 template

**H2: How to respond to a review that's clearly for the wrong business**
- Be polite: "Thanks for the review, but we think this might be intended for a different business. We're [business name] and we do [trade]. If you did use our services, please get in touch and we'll be happy to help."
- 1 template

**H2: Golden rules for all responses**
- Always use the customer's name
- Always respond within 24-48 hours
- Never argue, even when you're right
- Keep it under 4 sentences for positive reviews
- Take negative conversations offline quickly
- Include your trade or location naturally when it makes sense (mild SEO benefit)

---

### ARTICLE 10

**Title:** Checkatrade, MyBuilder, or Google Reviews: Where Should Tradespeople Focus in 2026?
**Slug:** checkatrade-mybuilder-google-reviews-2026
**Meta description:** Comparing Checkatrade, MyBuilder, and Google Reviews for UK tradespeople in 2026. Which platform gives you the best return on your time and money? Here's the honest breakdown.
**Target keyword:** checkatrade vs mybuilder vs google reviews 2026
**Secondary keywords:** is checkatrade worth it 2026, mybuilder review, best lead generation for tradesmen UK, checkatrade alternatives 2026
**Category:** Getting More Work
**Reading time:** ~10 minutes
**Schema:** Article + FAQPage + BreadcrumbList

**Structure:**

**H1:** Checkatrade, MyBuilder, or Google Reviews: Where Should Tradespeople Focus in 2026?

**Opening:** "Every tradesperson has to decide where to spend their time and money on getting more work. Checkatrade, MyBuilder, and Google Reviews are the three biggest options in the UK. Each works differently, costs differently, and delivers different results. Here's the honest comparison."

**H2: Checkatrade — the established directory**
- What it is: paid directory with vetting process
- Cost: typically £50-120+/month depending on trade and area
- How leads work: customers search Checkatrade, your profile appears, they contact you (often contacting multiple tradespeople)
- Pros: brand trust, vetting badge, good for new businesses
- Cons: expensive, leads are shared, price competition, you don't own the reviews, price rises regularly
- Best for: new businesses with no online presence who need leads immediately

**H2: MyBuilder — the job bidding platform**
- What it is: customers post jobs, tradespeople express interest, customer chooses
- Cost: you pay per lead/introduction (typically £2-10+ per lead depending on job size)
- How leads work: you browse posted jobs, express interest, customer picks from shortlisted tradespeople
- Pros: you can see the job before you commit, pay-per-lead model
- Cons: competitive bidding, customers often pick cheapest quote, lead quality varies, you're competing directly with other tradespeople for every job
- Best for: tradespeople who are good at selling themselves and have capacity to fill

**H2: Google Reviews — the free organic engine**
- What it is: your Google Business Profile with customer reviews
- Cost: free (or the cost of a review automation tool)
- How leads work: customers search Google for your trade + their area, find you in the Map Pack, call you directly. No middleman, no bidding, no shared leads.
- Pros: completely free, leads come direct to you, reviews are permanent and grow over time, you own everything
- Cons: takes time to build up, requires consistent effort, need a Google Business Profile set up properly
- Best for: any tradesperson who wants long-term, free lead generation
- Internal link to Article 1 (how many reviews you need) and Article 7 (how the algorithm works)

**H2: The real comparison — what £100/month gets you**
- £100/month on Checkatrade: X leads, shared, some convert
- £100/month on MyBuilder leads: X introductions, competitive, some convert
- £100/month on review automation: 50+ review requests sent, 25+ new reviews generated, permanent improvement to Google ranking, increasing free leads month after month
- "Checkatrade and MyBuilder give you leads today. Google reviews give you leads forever."

**H2: The hybrid strategy (what we'd actually recommend)**
- If you're brand new: start with Checkatrade or MyBuilder for immediate leads. Simultaneously build your Google review count.
- Once you have 40-50+ Google reviews: evaluate whether the paid platforms are still worth the cost. Many tradespeople find they can drop them entirely.
- Always invest in Google reviews regardless of what else you're doing — they compound over time
- "Think of Checkatrade as renting leads. Think of Google reviews as owning your reputation."

**H2: FAQ section** (mark up with FAQPage schema)
- "Can I use all three at once?" (Yes, and many tradespeople do. The key is tracking which source actually generates profitable work.)
- "Which is best for emergency work?" (Google. When someone has a burst pipe at midnight, they Google "emergency plumber near me" — they don't open the Checkatrade app.)
- "I'm just starting out with no reviews — where should I begin?" (Start with whichever platform gets you your first 10-20 jobs. Then send every one of those customers a Google review request. Build both simultaneously.)
- "Will this article be updated?" (Yes. We update this comparison annually to reflect pricing changes and platform updates.)

---

## BUILD ORDER

1. Build the blog infrastructure (listing page, article template, CTA components, schema markup)
2. Set up technical SEO (meta tags, structured data, sitemap, breadcrumbs)
3. Write and publish Article 5 ("Why Your Competitor Gets More Work") — most shareable, best for Facebook groups
4. Write and publish Article 6 ("Best Time to Ask for a Review") — pure practical value, strong search intent
5. Write and publish Article 7 ("How Google Local Search Works") — foundational education piece
6. Write and publish Article 1 ("How Many Reviews to Rank") — data-driven, unique angle
7. Write and publish Article 4 ("Google Business Profile Setup") — catches people at the start of their journey
8. Write and publish Article 9 ("Response Templates") — utility content people bookmark
9. Write and publish Article 2 ("Unfair Review Guide") — emotional urgent search
10. Write and publish Article 3 ("Google Reviews vs Checkatrade") — comparison, strong intent
11. Write and publish Article 8 ("Case Study: 6 to 50 Reviews") — social proof content
12. Write and publish Article 10 ("Checkatrade vs MyBuilder vs Google 2026") — annual comparison
13. Add internal links between all articles (cross-check every article links to at least 2 others)
14. Update sitemap and submit to Google Search Console
15. Add blog link to main site footer navigation

Start with step 1 — build the blog infrastructure.
