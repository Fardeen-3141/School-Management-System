// src\app\layout.tsx

import type { Metadata } from "next";
import { Playfair_Display, Lora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Playfair Display - elegant serif with prominent serifs and classical look
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"], // 400=normal, 500=medium, 600=semi-bold, 700=bold
});

// Lora - elegant serif for body text with excellent readability
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Anipur Adarsha Vidyaniketan - Excellence in Education",
    template: "%s | Anipur Adarsha Vidyaniketan",
  },
  description:
    "Anipur Adarsha Vidyaniketan is a premier educational institution dedicated to nurturing young minds through comprehensive academic programs, modern teaching methodologies, and holistic development. Manage student records, fees, and academic progress with our integrated school management system.",
  keywords: [
    "Anipur Adarsha Vidyaniketan",
    "school management",
    "student portal",
    "fee management",
    "academic records",
    "education",
    "school administration",
    "student information system",
    "Assam school",
    "quality education",
  ],
  authors: [{ name: "Anipur Adarsha Vidyaniketan" }],
  creator: "Anipur Adarsha Vidyaniketan",
  publisher: "Anipur Adarsha Vidyaniketan",

  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://anipuradarsha.online", // Replace with your actual domain
    siteName: "Anipur Adarsha Vidyaniketan",
    title: "Anipur Adarsha Vidyaniketan - Excellence in Education",
    description:
      "Premier educational institution dedicated to nurturing young minds through comprehensive academic programs and holistic development.",
    images: [
      {
        url: "/og-image.jpg", // Add a 1200x630 image to your public folder
        width: 1200,
        height: 630,
        alt: "Anipur Adarsha Vidyaniketan Campus",
      },
    ],
  },

  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Anipur Adarsha Vidyaniketan - Excellence in Education",
    description:
      "Premier educational institution dedicated to nurturing young minds through comprehensive academic programs.",
    images: ["/og-image.jpg"],
    creator: "@anipuradarsha", // Replace with actual Twitter handle if available
  },

  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Favicon and app icons
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },

  // Web app manifest
  manifest: "/site.webmanifest",

  // Additional SEO
  alternates: {
    canonical: "https://anipuradarsha.edu.in", // Replace with your actual domain
  },

  // Verification tokens (add these when you set up Google Search Console, etc.)
  verification: {
    google: "your-google-verification-token", // Replace with actual token
    // yandex: "your-yandex-verification-token",
    // bing: "your-bing-verification-token",
  },

  // App-specific metadata
  applicationName: "Anipur Adarsha Vidyaniketan Portal",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${lora.variable}`}>
      <head>
        {/* Additional meta tags for better SEO */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#2b5797" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* School-specific structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              name: "Anipur Adarsha Vidyaniketan",
              description:
                "Premier educational institution dedicated to nurturing young minds through comprehensive academic programs and holistic development.",
              url: "https://anipuradarsha.edu.in", // Replace with actual domain
              logo: "https://anipuradarsha.edu.in/logo.png", // Replace with actual logo URL
              address: {
                "@type": "PostalAddress",
                addressLocality: "Anipur",
                addressRegion: "Assam",
                addressCountry: "IN",
              },
              sameAs: [
                // Add social media profiles if available
                // "https://facebook.com/anipuradarsha",
                // "https://twitter.com/anipuradarsha"
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${lora.variable} ${playfair.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
