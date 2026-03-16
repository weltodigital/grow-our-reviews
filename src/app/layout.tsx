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
      { url: "/favicon-new.ico?v=7&t=20260316", sizes: "any" },
      { url: "/icon-192.png?v=7&t=20260316", sizes: "192x192", type: "image/png" },
      { url: "/icon-192.png?v=7&t=20260316", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png?v=7&t=20260316", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon-new.ico?v=7&t=20260316",
    apple: "/icon-192.png?v=7&t=20260316",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Grow Our Reviews - Automated Review Collection",
    description: "Turn happy customers into 5-star reviews automatically. Smart SMS review requests with sentiment filtering.",
    type: "website",
    locale: "en_GB",
    images: [
      {
        url: "/icon-192.png",
        width: 192,
        height: 192,
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
      <head>
        <link rel="icon" href="/favicon-new.ico?v=7&t=20260316" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon-new.ico?v=7&t=20260316" type="image/x-icon" />
        <link rel="icon" href="/icon-192.png?v=7&t=20260316" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-192.png?v=7&t=20260316" type="image/png" sizes="32x32" />
        <link rel="icon" href="/icon-192.png?v=7&t=20260316" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/icon-192.png?v=7&t=20260316" />
      </head>
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
