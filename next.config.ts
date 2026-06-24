import type { NextConfig } from "next";

// Baseline security headers applied to every response. These are the low-risk,
// high-value ones; a full Content-Security-Policy is intentionally omitted for
// now because the marketing site loads third-party scripts (Stripe, Clarity,
// Meta Pixel) and a CSP needs to be tuned against those to avoid breakage.
const securityHeaders = [
  // Force HTTPS for 2 years, including subdomains. Vercel already serves HTTPS;
  // this tells browsers to never attempt HTTP.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disallow framing by other origins (clickjacking protection).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop browsers MIME-sniffing responses away from the declared content-type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs (which can contain review tokens) to other origins.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deny powerful browser features the app doesn't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
