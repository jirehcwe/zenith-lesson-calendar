import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import GoogleTagManager from "@/components/GoogleTagManager";
import { GTM_CONTAINER_ID } from "@/utils/analytics";
import "./globals.css";

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
        {/* Google Tag Manager (noscript) — GTM asks for this immediately after the
            opening <body> tag, so it goes first. It renders nothing when JavaScript
            is on, so it does not disturb the pre-paint script below.

            This half cannot be hostname-gated: gating happens in a client effect,
            which is precisely what does not run when JavaScript is off. Harmless in
            practice — the app renders nothing without JavaScript, so anything that
            reaches this iframe is a bot rather than a visitor. */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* Pre-paint: flag embedded loads (`?embed=true`) before the hero renders so
            CSS shows the static compact bar on first paint (no flash / layout shift).
            Must run synchronously ahead of the body content below it. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(new URLSearchParams(window.location.search).get("embed")==="true"){document.documentElement.setAttribute("data-embed","true")}}catch(e){}',
          }}
        />
        {/* Google Tag Manager. Fires only on the live schedule hostnames — see
            src/utils/analytics.ts for why the branch cannot be trusted to scope it. */}
        <GoogleTagManager />
        {children}
      </body>
    </html>
  );
}
