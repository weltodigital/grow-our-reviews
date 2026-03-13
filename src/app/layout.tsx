import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Grow Our Reviews - Automated Review Collection for Tradespeople",
  description: "Turn happy customers into 5-star reviews automatically. Smart SMS review requests with sentiment filtering for UK tradespeople.",
  keywords: "review automation, Google reviews, tradespeople, SMS marketing, customer feedback",
  authors: [{ name: "Grow Our Reviews" }],
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "any" },
      { url: "/grow-our-reviews-icon.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=3", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=3",
    apple: "/grow-our-reviews-icon.png?v=3",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Grow Our Reviews - Automated Review Collection",
    description: "Turn happy customers into 5-star reviews automatically. Smart SMS review requests with sentiment filtering.",
    type: "website",
    locale: "en_GB",
    images: [
      {
        url: "/grow-our-reviews-icon.png",
        width: 512,
        height: 512,
        alt: "Grow Our Reviews",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = "width=device-width, initial-scale=1";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
