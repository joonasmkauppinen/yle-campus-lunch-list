import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider, ThemeToggle } from "~/components/ui/theme";
import { Toaster } from "~/components/ui/toast";
import { cn } from "~/lib/utils";

import "~/app/styles.css";

export const metadata: Metadata = {
  title: "Lounaslistat",
  description: "Päivittäiset lounaslistat Ylen kampusalueen ravintoloista.",
  applicationName: "Lounaslistat",
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
    "apple-touch-fullscreen": "yes",
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
    <html lang="en" suppressHydrationWarning>
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
      </body>
    </html>
  );
}
