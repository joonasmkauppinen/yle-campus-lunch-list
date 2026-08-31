import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { ThemeProvider, ThemeToggle } from "~/components/ui/theme";
import { Toaster } from "~/components/ui/toast";
import { getBaseUrl } from "~/lib/seo";
import { cn } from "~/lib/utils";

import "~/app/styles.css";

const siteTitle = "Lounaslistat – Ylen kampus & Pasila, Helsinki";
const siteDescription =
  "Päivittäiset lounaslistat ja aukioloajat Ylen kampusalueen ja Pasilan ravintoloista (Iso Paja, Huoltamo, Piccolo, Studio 10, Pasilan Linkki, Päättäri, Akseli, Dylan).";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: siteTitle,
    template: "%s | Lounaslistat",
  },
  description: siteDescription,
  applicationName: "Lounaslistat",
  keywords: [
    "lounaslistat",
    "lounas Helsinki",
    "lounas Pasila",
    "Yle kampus lounas",
    "Iso Paja lounas",
    "Huoltamo lounas",
    "Piccolo lounas",
    "Studio 10 lounas",
    "Pasilan Linkki lounas",
    "Päättäri lounas",
    "Akseli lounas",
    "Dylan Luft",
    "Dylan Böle",
    "Dylan La Ilma",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fi_FI",
    url: "/",
    siteName: "Lounaslistat",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lounaslistat",
    startupImage: [
      {
        url: "/icons/apple_splash_2048.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/apple_splash_1668.png",
        media:
          "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/apple_splash_1536.png",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/apple_splash_1242.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/icons/apple_splash_1125.png",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/icons/apple_splash_750.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/apple_splash_640.png",
        media:
          "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/favicon.ico",
    apple: [
      {
        url: "/icons/touch-icon-iphone-retina_180x180.png",
      },
      {
        url: "/icons/touch-icon-iphone-retina_180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "/icons/touch-icon-ipad_152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        url: "/icons/touch-icon-ipad-retina_167x167.png",
        sizes: "167x167",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="fi" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider>
          {props.children}
          <div className="fixed right-4 bottom-4 z-50">
            <ThemeToggle />
          </div>
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
