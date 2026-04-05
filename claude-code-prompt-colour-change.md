# Grow Our Reviews — Brand Colour Change

## CHANGE

Replace the brand colour #a5be00 with #80e000 across the ENTIRE codebase — both growourreviews.com and app.growourreviews.com.

## Updated colour variables

Find and replace the accent colour variables in your CSS/globals. The new values are:

```css
--accent: #80e000;             /* New brand green */
--accent-hover: #6bc200;       /* Darker for hover */
--accent-dark: #5aa300;        /* Even darker for active/pressed states and text on light accent backgrounds */
--accent-light: #f0fbe0;       /* Very light tint for backgrounds and badges */
--accent-medium: #d4f0a0;      /* Medium tint for highlighted sections */
--accent-text: #0f172a;        /* Dark text on accent backgrounds — #80e000 is still too light for white text */
```

## Important

- **Still use dark text on accent buttons.** #80e000 is a bright green — white text on it fails WCAG contrast. Keep using --accent-text (#0f172a) for all text on accent-coloured backgrounds.
- Search the entire codebase for any hardcoded instances of #a5be00, #8fa300, #7a8c00, #f4f7e4, or #e8efc6 and replace them with the corresponding new values above.
- Check Tailwind config if colours are defined there — update those too.
- Check any inline styles or component-level style overrides.
- After replacing, visually check: nav "Start Free Trial" button, all page CTA buttons, pricing card featured border, badges, form focus rings, active sidebar links, trial banner, onboarding progress bar, status badges that use accent, and blog CTA banners.

Do a global search for the old colour values and replace every instance. Don't miss any.
