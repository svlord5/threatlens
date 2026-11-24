import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://surajv5.in"),
  title: "ThreatLens | SOC & Cyber Threat Intelligence",
  description: "Enterprise Security Operations Center (SOC) & Cyber Threat Intelligence (CTI) Platform. Correlate IOCs, manage incident investigations, and perform real-time OSINT reconnaissance. Architected by Suraj Vishwanath.",
  authors: [{ name: "Suraj Vishwanath", url: "https://surajv5.in" }],
  creator: "Suraj Vishwanath",
  openGraph: {
    title: "ThreatLens | SOC & Cyber Threat Intelligence",
    description: "Advanced Security Operations Center & Cyber Threat Intelligence (CTI) Platform. Architected by Suraj Vishwanath.",
    url: "https://surajv5.in",
    siteName: "ThreatLens",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ThreatLens - Enterprise SOC Platform",
    description: "Advanced Security Operations Center & CTI Platform. Architected by Suraj Vishwanath.",
  },
};

import { Toaster } from "@/components/ui/sonner";
import { ConsoleWarning } from "@/components/ConsoleWarning";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "@/components/theme-provider";
import { DemoBanner } from "@/components/DemoBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
      </head>
      <body className="min-h-full flex flex-col">
        <NextTopLoader color="#ffffff" showSpinner={false} shadow="0 0 10px #ffffff,0 0 5px #ffffff" />
        <ConsoleWarning />
        <DemoBanner />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster theme="system" position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
