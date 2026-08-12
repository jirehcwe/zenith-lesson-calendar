"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { GTM_CONTAINER_ID, shouldLoadAnalytics } from "@/utils/analytics";

/**
 * Loads the Google Tag Manager container, but only on the live schedule hostnames.
 *
 * The check runs in an effect rather than during render because this is a static
 * export: the HTML is built once, ahead of time, and cannot know which hostname will
 * serve it. Rendering nothing on the first pass also keeps the client's first render
 * identical to the prerendered markup, so there is no hydration mismatch.
 *
 * The `<noscript>` half of the GTM install cannot live here — it exists to work when
 * JavaScript is off, which is exactly when this component never runs. It sits ungated
 * in the root layout instead.
 */
export default function GoogleTagManager() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(shouldLoadAnalytics(window.location.hostname));
  }, []);

  if (!enabled) return null;

  // Verbatim from the GTM install snippet, with the container ID interpolated.
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');`}
    </Script>
  );
}
