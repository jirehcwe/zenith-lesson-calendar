"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { gtmContainerFor } from "@/utils/analytics";

/**
 * Loads this site's Google Tag Manager container, but only on its live
 * hostnames.
 *
 * The check runs in an effect because this is a static export: the HTML is
 * built once and cannot know which hostname will serve it. Rendering nothing
 * on the first pass also keeps the first client render identical to the
 * prerendered markup, so hydration does not mismatch.
 *
 * The <noscript> half of the install lives in the root layout. It exists for
 * when JavaScript is off, which is exactly when this component does not run.
 */
export default function GoogleTagManager({ slug }: { slug: string }) {
  const [containerId, setContainerId] = useState<string | null>(null);

  useEffect(() => {
    setContainerId(gtmContainerFor(slug, window.location.hostname));
  }, [slug]);

  if (!containerId) return null;

  // Verbatim from the GTM install snippet, with the container ID interpolated.
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`}
    </Script>
  );
}
