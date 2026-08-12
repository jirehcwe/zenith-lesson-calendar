"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { GA_MEASUREMENT_ID, shouldLoadAnalytics } from "@/utils/analytics";

/**
 * Loads the Google tag (gtag.js), but only on the live schedule hostnames.
 *
 * The check runs in an effect rather than during render because this is a static
 * export: the HTML is built once, ahead of time, and cannot know which hostname will
 * serve it. Rendering nothing on the first pass also keeps the client's first render
 * identical to the prerendered markup, so there is no hydration mismatch.
 */
export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(shouldLoadAnalytics(window.location.hostname));
  }, []);

  if (!enabled) return null;

  return (
    <>
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
    </>
  );
}
