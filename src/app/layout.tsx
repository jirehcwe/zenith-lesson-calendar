import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCrashCourseConfig } from "../../crash-courses";
import GoogleTagManager from "@/components/GoogleTagManager";
import { gtmContainerForSlug } from "@/utils/analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const config = getCrashCourseConfig();

// Known at build time from the slug. Null for a platform with no container yet.
const gtmContainerId = gtmContainerForSlug(config.slug);

export const metadata: Metadata = {
  title: config.metadata.title,
  description: config.metadata.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Tag Manager (noscript). GTM asks for it right after the
            opening <body> tag. It is gated by slug but cannot be gated by
            hostname: that check runs in a client effect, which is exactly what
            does not run when JavaScript is off. Harmless in practice, because
            the app renders nothing without JavaScript. */}
        {gtmContainerId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {/* Google Tag Manager. Loads only on this site's live hostnames — see
            src/utils/analytics.ts. */}
        <GoogleTagManager slug={config.slug} />
        {children}
      </body>
    </html>
  );
}
