import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// GA4 measurement ID for the live schedule site (schedule.zenitheducationstudio.com).
const GA_MEASUREMENT_ID = "G-GX27V89PJK";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Zenith 2026 Schedule",
  description: "View the Zenith 2026 Schedule and sign up for trial classes!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased`}
      >
        {/* Pre-paint: flag embedded loads (`?embed=true`) before the hero renders so
            CSS shows the static compact bar on first paint (no flash / layout shift).
            Must run synchronously ahead of the body content below it. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(new URLSearchParams(window.location.search).get("embed")==="true"){document.documentElement.setAttribute("data-embed","true")}}catch(e){}',
          }}
        />
        {/* Google tag (gtag.js). Deliberately lives on `regular-lessons` only — the
            staging branch stays untagged so preview traffic never lands in GA4.
            `afterInteractive` keeps it off the critical path for first paint. */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
        </Script>
        {children}
      </body>
    </html>
  );
}
