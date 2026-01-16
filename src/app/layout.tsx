import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PlayerProvider } from "@/context/PlayerContext";
import { LibraryProvider } from "@/context/LibraryContext";
import { ThemeProvider } from "@/context/ThemeContext";
import BottomNav from "@/components/BottomNav/BottomNav";
import MiniPlayer from "@/components/MiniPlayer/MiniPlayer";
import NowPlaying from "@/components/NowPlaying/NowPlaying";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "AudioMab",
  description: "Stream YouTube audio with style",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AudioMab",
  },
  openGraph: {
    title: "AudioMab",
    description: "Stream YouTube audio with style",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon links for Google Search and browsers */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <LibraryProvider>
            <PlayerProvider>
              <div className="app-container">
                {children}
              </div>
              <MiniPlayer />
              <NowPlaying />
              <BottomNav />
              <ServiceWorkerRegistration />
            </PlayerProvider>
          </LibraryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
