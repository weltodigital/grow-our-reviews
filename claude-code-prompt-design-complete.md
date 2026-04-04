# Grow Our Reviews — Complete Site Design Overhaul (Final)

## CONTEXT

We want to elevate the visual design of the ENTIRE Grow Our Reviews platform — both the marketing site (growourreviews.com) and the application (app.growourreviews.com) — to feel premium and modern, inspired by sites like jace.ai.

Keep all existing copy, sections, and functionality exactly as they are. We're reskinning, not rewriting.

**This applies to EVERY page across both domains:**

Marketing site (growourreviews.com):
- Homepage (/)
- Pricing (/pricing)
- Blog listing (/blog)
- Blog articles (/blog/[slug])
- Privacy Policy (/privacy)
- Terms of Service (/terms)
- Cookie Policy (/cookies)
- Contact (/contact)
- Help pages (/help/*)

Application (app.growourreviews.com):
- Login (/login)
- Signup (/signup)
- Password reset (/reset-password)
- Billing setup (/billing/setup)
- Onboarding (/onboarding)
- Dashboard (/dashboard)
- Send request (/dashboard/send)
- Bulk upload (/dashboard/upload)
- Request list (/dashboard/requests)
- Feedback (/dashboard/feedback)
- Settings (/dashboard/settings)
- Billing (/dashboard/billing)
- Templates (/dashboard/templates)
- All other app pages

---

## BRAND COLOUR

The primary brand colour is **#a5be00** — a distinctive yellow-green/lime.

**Important colour contrast note:** #a5be00 is a light colour. White text on this background does NOT have sufficient contrast for accessibility (fails WCAG AA). All buttons and elements using #a5be00 as a background MUST use dark text (#0f172a), not white text. This actually looks great — it creates a bold, distinctive button style.

---

## COLOUR SYSTEM

```css
:root {
  /* Text colours */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-card: #ffffff;
  
  /* Brand / Accent colour — #a5be00 */
  --accent: #a5be00;
  --accent-hover: #8fa300;          /* Darker for hover states */
  --accent-dark: #7a8c00;           /* Even darker for active/pressed states */
  --accent-light: #f4f7e4;          /* Very light tint for subtle backgrounds and badges */
  --accent-medium: #e8efc6;         /* Medium tint for highlighted sections */
  --accent-text: #0f172a;           /* Dark text on accent backgrounds — NOT white */
  
  /* Borders */
  --border-light: #e2e8f0;
  --border-subtle: #f1f5f9;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
  
  /* Status colours (for the app dashboard) */
  --status-success: #16a34a;
  --status-warning: #d97706;
  --status-error: #dc2626;
  --status-info: #2563eb;
}
```

### Colour usage rules:
- **Accent buttons use dark text, not white.** #a5be00 is too light for white text. Use --accent-text (#0f172a) on all accent-coloured buttons and elements.
- **Background alternation:** Alternate --bg-primary and --bg-secondary for sections.
- **Accent used sparingly.** CTA buttons, links, badges, active states, highlighted pricing card border. Never as a full section background.
- **--accent-light for subtle highlights.** Badge backgrounds, selected nav items, active states in the app sidebar.
- **Status colours are separate from the brand colour.** Success (green), warning (amber), error (red), and info (blue) in the dashboard don't use the brand colour — they use standard semantic colours so users instantly understand their meaning.

---

## TYPOGRAPHY SYSTEM

### Fonts

- **Headings (H1, H2, H3, H4):** Lora (serif) — warm, trustworthy
- **Everything else:** Inter (sans-serif) — clean, readable

Import both:

```html
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Apply globally across BOTH domains:

```css
body {
  font-family: 'Inter', sans-serif;
}

h1, h2, h3, h4 {
  font-family: 'Lora', serif;
}
```

### Font Scale

```css
/* Hero headline (homepage only) */
.hero-h1 {
  font-family: 'Lora', serif;
  font-size: 3.75rem;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

/* Page titles (all other pages) */
h1 {
  font-family: 'Lora', serif;
  font-size: 2.75rem;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--text-primary);
}

/* Section headings */
h2 {
  font-family: 'Lora', serif;
  font-size: 2.25rem;
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

/* Sub-section headings */
h3 {
  font-family: 'Lora', serif;
  font-size: 1.5rem;
  line-height: 1.35;
  font-weight: 600;
  letter-spacing: normal;
  color: var(--text-primary);
}

/* H4 */
h4 {
  font-family: 'Lora', serif;
  font-size: 1.25rem;
  line-height: 1.4;
  font-weight: 600;
  color: var(--text-primary);
}

/* Body text */
body, p {
  font-family: 'Inter', sans-serif;
  font-size: 1.125rem;
  line-height: 1.7;
  font-weight: 400;
  color: var(--text-secondary);
}

/* Small text */
.text-sm {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  line-height: 1.5;
  font-weight: 500;
  color: var(--text-tertiary);
}

/* Hero subheadline */
.hero-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 1.25rem;
  line-height: 1.6;
  font-weight: 400;
  color: var(--text-secondary);
  max-width: 640px;
}

/* Page subtitle */
.page-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 1.125rem;
  line-height: 1.6;
  font-weight: 400;
  color: var(--text-secondary);
  max-width: 640px;
}

/* Mobile overrides */
@media (max-width: 768px) {
  .hero-h1 { font-size: 2.5rem; letter-spacing: -0.01em; }
  h1 { font-size: 2rem; }
  h2 { font-size: 1.75rem; letter-spacing: normal; }
  h3 { font-size: 1.25rem; }
  .hero-subtitle, .page-subtitle { font-size: 1.125rem; }
}
```

---

## FLOATING BUBBLE NAVIGATION BAR (Marketing Site)

### Structure:

```html
<header class="nav-wrapper">
  <nav class="nav-bubble">
    <a href="/" class="nav-logo">Grow Our Reviews</a>
    <div class="nav-links">
      <a href="/#how-it-works">How It Works</a>
      <a href="/#features">Features</a>
      <a href="/pricing">Pricing</a>
      <a href="/blog">Blog</a>
      <a href="/#faq">FAQ</a>
    </div>
    <div class="nav-actions">
      <a href="https://app.growourreviews.com/login" class="nav-btn-secondary">Log In</a>
      <a href="https://app.growourreviews.com/signup" class="nav-btn-primary">Start Free Trial</a>
    </div>
  </nav>
</header>
```

**Button text is exactly:** "Log In" and "Start Free Trial". Not "Get started" or anything else.

### Styling:

```css
.nav-wrapper {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 1rem 1.5rem;
  pointer-events: none;
}

.nav-bubble {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  max-width: 920px;
  width: 100%;
  padding: 0.625rem 0.625rem 0.625rem 1.5rem;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-light);
  border-radius: 9999px;
  box-shadow: var(--shadow-md);
}

.nav-logo {
  font-family: 'Lora', serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-links a {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 0.5rem 0.875rem;
  border-radius: 9999px;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.nav-links a:hover {
  color: var(--text-primary);
  background-color: var(--bg-secondary);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Log In — subtle outlined pill */
.nav-btn-secondary {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  text-decoration: none;
  padding: 0.5rem 1.25rem;
  border-radius: 9999px;
  border: 1px solid var(--border-light);
  background-color: transparent;
  transition: all 0.15s ease;
}

.nav-btn-secondary:hover {
  background-color: var(--bg-secondary);
  border-color: var(--text-tertiary);
}

/* Start Free Trial — brand colour pill with dark text */
.nav-btn-primary {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--accent-text);           /* Dark text — #0f172a */
  text-decoration: none;
  padding: 0.5rem 1.25rem;
  border-radius: 9999px;
  background-color: var(--accent);     /* #a5be00 */
  border: none;
  transition: all 0.15s ease;
}

.nav-btn-primary:hover {
  background-color: var(--accent-hover);  /* #8fa300 */
}

/* Mobile */
@media (max-width: 768px) {
  .nav-bubble {
    max-width: 100%;
    border-radius: 1.5rem;
    padding: 0.5rem 0.5rem 0.5rem 1.25rem;
  }
  
  .nav-links {
    display: none;
  }
  
  .nav-mobile-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--text-primary);
  }
}

@media (min-width: 769px) {
  .nav-mobile-toggle {
    display: none;
  }
}
```

### Mobile menu overlay:

```css
.nav-mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background-color: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 2rem;
}

.nav-mobile-menu a {
  font-family: 'Inter', sans-serif;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-primary);
  text-decoration: none;
}

.nav-mobile-menu .nav-btn-primary {
  font-size: 1.125rem;
  padding: 0.875rem 2rem;
}

.nav-mobile-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 1.5rem;
}
```

The bubble nav is a shared component used on ALL marketing pages via the layout. Build it as NavBubble.tsx.

---

## SPACING SYSTEM

```css
.section { padding-top: 6rem; padding-bottom: 6rem; }
@media (max-width: 768px) { .section { padding-top: 4rem; padding-bottom: 4rem; } }
.hero { padding-top: 8rem; padding-bottom: 8rem; }
.container { max-width: 1200px; margin: 0 auto; padding-left: 1.5rem; padding-right: 1.5rem; }
.text-content { max-width: 720px; }
h2 + p, h3 + p { margin-top: 1rem; }
p + p { margin-top: 1.5rem; }
.section-header { margin-bottom: 3rem; text-align: center; }
.card-grid { gap: 2rem; }
```

---

## COMPONENT STYLES

### CTA Buttons (on pages — NOT the nav)

```css
/* Primary CTA — uses brand colour with dark text */
.btn-primary {
  font-family: 'Inter', sans-serif;
  background-color: var(--accent);         /* #a5be00 */
  color: var(--accent-text);               /* #0f172a — dark text */
  font-size: 1rem;
  font-weight: 600;
  padding: 0.875rem 2rem;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background-color: var(--accent-hover);   /* #8fa300 */
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* Secondary CTA */
.btn-secondary {
  font-family: 'Inter', sans-serif;
  background-color: transparent;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  padding: 0.875rem 2rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-light);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background-color: var(--bg-secondary);
  border-color: var(--text-tertiary);
}
```

### Cards

```css
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Pricing Cards

```css
.pricing-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 1.25rem;
  padding: 2.5rem;
  position: relative;
}

/* Featured plan — uses brand colour border */
.pricing-card-featured {
  border: 2px solid var(--accent);         /* #a5be00 border */
  box-shadow: var(--shadow-lg);
}

.pricing-amount {
  font-family: 'Lora', serif;
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  line-height: 1;
}

.pricing-period {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-tertiary);
}

.pricing-features li {
  font-family: 'Inter', sans-serif;
  padding: 0.625rem 0;
  font-size: 0.9375rem;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

/* Checkmark icons in pricing lists use brand colour */
.pricing-features li::before {
  color: var(--accent);
}
```

### Testimonial Cards

```css
.testimonial {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 1rem;
  padding: 2rem;
}

.testimonial-quote {
  font-family: 'Inter', sans-serif;
  font-size: 1.0625rem;
  line-height: 1.7;
  color: var(--text-secondary);
  font-style: normal;
  margin-bottom: 1.5rem;
}

.testimonial-author {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
}

.testimonial-role {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: var(--text-tertiary);
}
```

### Badge

```css
.badge {
  font-family: 'Inter', sans-serif;
  display: inline-flex;
  align-items: center;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background-color: var(--accent-light);   /* Light tint of brand colour */
  color: var(--accent-dark);               /* Dark shade of brand colour for readable text */
}
```

---

## FOOTER (All marketing pages)

```css
.footer {
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
  padding: 4rem 0 2rem 0;
}

.footer-links a {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: var(--text-tertiary);
  text-decoration: none;
}

.footer-links a:hover {
  color: var(--text-secondary);
}

.footer-copyright {
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-subtle);
}
```

---

## MARKETING PAGE STYLES

### Homepage (/)
- Hero: .hero-h1 (Lora 60px), .hero-subtitle (Inter 20px), primary CTA button in --accent with dark text
- Alternating --bg-primary / --bg-secondary sections
- 6rem section padding throughout
- All components as previously described

### Pricing Page (/pricing)
- H1 (Lora 44px): "Simple, transparent pricing"
- Subtitle (Inter)
- Same pricing cards as homepage
- FAQ section below
- Featured card with --accent border

### Blog Listing (/blog)
- H1 (Lora 44px): "Blog"
- Subtitle (Inter)
- 2-column card grid (desktop), 1-column (mobile)
- Cards: H3 (Lora) title, Inter excerpt, category badge in --accent-light, date/reading time in --text-tertiary
- Page background: --bg-secondary, cards: --bg-card

### Blog Articles (/blog/[slug])
- Header area: --bg-secondary, category badge in --accent-light, H1 (Lora 44px), author/date (Inter --text-tertiary)
- Body: --bg-primary, max-width 720px centred
- H2 (Lora 36px), H3 (Lora 24px), body (Inter 18px)
- Links: --accent colour, underline on hover
- Blockquotes: left border in --accent
- Table of contents: sticky sidebar, Inter, highlights current section in --accent-light
- CTA banner: --accent-light background, Lora heading, Inter body, --accent button

### Legal Pages (/privacy, /terms, /cookies)
- H1 (Lora 44px), "Last updated" line (Inter --text-tertiary)
- Body: max-width 720px centred, Inter 18px
- H2 (Lora) for sections
- Clean, no sidebar

### Help Pages (/help/*)
- Same layout as blog articles
- Numbered steps, callout boxes in --accent-light
- Back link in Inter --text-tertiary

---

## APPLICATION STYLES (app.growourreviews.com)

The app uses the SAME fonts, colours, and component styles as the marketing site for brand consistency. But the app has its own navigation (sidebar), not the bubble nav.

### Global App Styles

```css
/* Same font pairing */
body { font-family: 'Inter', sans-serif; }
h1, h2, h3, h4 { font-family: 'Lora', serif; }

/* Same colour variables — import the full :root block */
```

### App Sidebar Navigation

```css
.app-sidebar {
  width: 260px;
  background-color: var(--bg-primary);
  border-right: 1px solid var(--border-light);
  padding: 1.5rem 0;
  height: 100vh;
  position: fixed;
  overflow-y: auto;
}

/* Logo in sidebar */
.app-sidebar-logo {
  font-family: 'Lora', serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  padding: 0 1.5rem;
  margin-bottom: 2rem;
}

/* Sidebar nav links */
.app-sidebar a {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1.5rem;
  transition: all 0.15s ease;
}

.app-sidebar a:hover {
  color: var(--text-primary);
  background-color: var(--bg-secondary);
}

/* Active sidebar link — uses brand colour */
.app-sidebar a.active {
  color: var(--accent-dark);
  background-color: var(--accent-light);
  font-weight: 600;
}

/* Mobile: sidebar becomes a top bar or hamburger menu */
@media (max-width: 768px) {
  .app-sidebar {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid var(--border-light);
  }
}
```

### App Page Headers

```css
.app-page-header {
  margin-bottom: 2rem;
}

.app-page-header h1 {
  font-family: 'Lora', serif;
  font-size: 1.75rem;          /* Smaller than marketing pages — fits app context */
  font-weight: 700;
  color: var(--text-primary);
}

.app-page-header p {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: var(--text-tertiary);
  margin-top: 0.25rem;
}
```

### App Stats Cards (Dashboard)

```css
.stat-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.stat-card-value {
  font-family: 'Lora', serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-card-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-tertiary);
  margin-top: 0.25rem;
}

.stat-card-change {
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.stat-card-change.positive { color: var(--status-success); }
.stat-card-change.negative { color: var(--status-error); }
```

### App Form Styles

```css
/* Form labels */
label {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.375rem;
  display: block;
}

/* Form inputs */
input[type="text"],
input[type="email"],
input[type="password"],
input[type="tel"],
textarea,
select {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 0.5rem;
  padding: 0.625rem 0.875rem;
  width: 100%;
  transition: border-color 0.15s ease;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);  /* Brand colour focus ring */
}

/* Form helper text */
.form-helper {
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin-top: 0.25rem;
}

/* Form error text */
.form-error {
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  color: var(--status-error);
  margin-top: 0.25rem;
}
```

### App Buttons

```css
/* Primary app button — same brand colour */
.app-btn-primary {
  font-family: 'Inter', sans-serif;
  background-color: var(--accent);
  color: var(--accent-text);               /* Dark text on light green */
  font-size: 0.9375rem;
  font-weight: 600;
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.app-btn-primary:hover {
  background-color: var(--accent-hover);
}

/* Secondary app button */
.app-btn-secondary {
  font-family: 'Inter', sans-serif;
  background-color: transparent;
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-weight: 500;
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-light);
  cursor: pointer;
  transition: all 0.15s ease;
}

.app-btn-secondary:hover {
  background-color: var(--bg-secondary);
}

/* Danger button (for destructive actions) */
.app-btn-danger {
  font-family: 'Inter', sans-serif;
  background-color: var(--status-error);
  color: #ffffff;
  font-size: 0.9375rem;
  font-weight: 600;
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
}
```

### App Tables (Request list, Feedback list)

```css
.app-table {
  width: 100%;
  border-collapse: collapse;
}

.app-table th {
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.app-table td {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: var(--text-secondary);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
}

.app-table tr:hover {
  background-color: var(--bg-secondary);
}
```

### App Status Badges

```css
.status-badge {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.status-badge.scheduled { background-color: #f1f5f9; color: #64748b; }
.status-badge.queued { background-color: #fef3c7; color: #d97706; }
.status-badge.sent { background-color: #dbeafe; color: #2563eb; }
.status-badge.clicked { background-color: #fef3c7; color: #d97706; }
.status-badge.reviewed { background-color: #dcfce7; color: #16a34a; }
.status-badge.feedback_given { background-color: #ffedd5; color: #ea580c; }
.status-badge.failed { background-color: #fee2e2; color: #dc2626; }
.status-badge.suppressed { background-color: #f1f5f9; color: #94a3b8; }
```

### App Trial Banner

```css
.trial-banner {
  background-color: var(--accent-light);
  border: 1px solid var(--accent-medium);
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.trial-banner-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--accent-dark);
}

.trial-banner-days {
  font-family: 'Lora', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-dark);
}
```

### App Empty States

```css
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state h3 {
  font-family: 'Lora', serif;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-family: 'Inter', sans-serif;
  color: var(--text-tertiary);
  font-size: 0.9375rem;
  margin-bottom: 1.5rem;
}
```

### Auth Pages (Login, Signup, Reset Password)

```css
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary);
  padding: 2rem;
}

.auth-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 1rem;
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
}

.auth-card h1 {
  font-family: 'Lora', serif;
  font-size: 1.75rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.auth-card .subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: var(--text-tertiary);
  text-align: center;
  margin-bottom: 2rem;
}

/* Auth page submit button uses brand colour */
.auth-card .btn-submit {
  width: 100%;
  background-color: var(--accent);
  color: var(--accent-text);
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
}

.auth-card .btn-submit:hover {
  background-color: var(--accent-hover);
}
```

### Billing Setup Page

```css
/* Plan selection cards on billing setup use the same pricing card style */
/* Featured/selected plan gets brand colour border */
.plan-card.selected {
  border: 2px solid var(--accent);
  box-shadow: var(--shadow-md);
}

/* "Most Popular" badge uses brand colour */
.plan-badge {
  background-color: var(--accent);
  color: var(--accent-text);
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  position: absolute;
  top: -0.75rem;
  left: 50%;
  transform: translateX(-50%);
}
```

### Onboarding Page

```css
/* Onboarding uses the same auth-page centred layout */
.onboarding-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary);
  padding: 2rem;
}

.onboarding-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 1rem;
  padding: 2.5rem;
  width: 100%;
  max-width: 540px;
  box-shadow: var(--shadow-lg);
}

.onboarding-card h1 {
  font-family: 'Lora', serif;
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

/* Progress indicator */
.onboarding-progress {
  height: 4px;
  background-color: var(--border-light);
  border-radius: 2px;
  margin-bottom: 2rem;
}

.onboarding-progress-fill {
  height: 100%;
  background-color: var(--accent);
  border-radius: 2px;
  transition: width 0.3s ease;
}
```

---

## ANIMATIONS (Marketing site only)

```css
.animate-on-scroll {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.animate-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}
```

Intersection Observer, trigger once. Apply to homepage sections only. Don't animate legal pages, blog content, or app pages.

---

## WHAT NOT TO DO

- Don't use white text on --accent backgrounds — always use dark text (--accent-text)
- Don't use --accent for error, warning, or success states — use the semantic status colours
- Don't add gradients
- Don't use heavy borders or shadows
- Don't centre body text
- Don't use all-caps except for small badges and table headers
- Don't use Lora below 20px
- Don't use the bubble nav on app pages — the app has its own sidebar nav
- Don't use different colour variables on the app vs marketing site — they share the same :root

---

## BUILD ORDER

1. Import Lora and Inter fonts in both marketing and app global layouts
2. Set up CSS custom properties (with #a5be00 as accent) in a shared global stylesheet
3. Apply font-family rules globally across both domains
4. Build the bubble nav component for the marketing site
5. Apply bubble nav to all marketing pages via layout
6. Restyle the homepage hero with --accent CTA buttons (dark text)
7. Apply section spacing to all homepage sections
8. Restyle all homepage components
9. Style blog listing and article pages
10. Style legal pages
11. Style pricing page
12. Add scroll animations to homepage
13. Update footer
14. Restyle app sidebar navigation with --accent active state
15. Restyle app auth pages (login, signup, reset password)
16. Restyle app onboarding and billing setup pages
17. Restyle app dashboard (stats cards, tables, badges, forms, buttons)
18. Restyle app send, upload, requests, feedback, settings, billing pages
19. Mobile responsiveness pass — every page on both domains at 375px
20. Cross-site consistency check — navigate between marketing site and app, verify fonts, colours, and overall feel are cohesive

Start with steps 1-6.
