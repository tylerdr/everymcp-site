"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const hasMeasurementId = typeof measurementId === "string" && /^G-[A-Z0-9]+$/.test(measurementId);

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer: unknown[][];
    gtag?: Gtag;
  }
}

function sanitizedPath(pathname: string) {
  const path = pathname.split("?")[0].split("#")[0];
  return path || "/";
}

function sanitizedReferrer() {
  if (!document.referrer) {
    return "";
  }

  try {
    const referrer = new URL(document.referrer);
    return `${referrer.origin}${referrer.pathname}`;
  } catch {
    return "";
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!hasMeasurementId || !pathname) {
      return;
    }

    const path = sanitizedPath(pathname);
    const pageView = {
      page_title: "EveryMCP",
      page_location: `${window.location.origin}${path}`,
      page_path: path,
      page_referrer: sanitizedReferrer()
    };

    window.dataLayer = window.dataLayer || [];
    if (window.gtag) {
      window.gtag("event", "page_view", pageView);
    } else {
      window.dataLayer.push(["event", "page_view", pageView]);
    }
  }, [pathname]);

  if (!hasMeasurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', ${JSON.stringify(measurementId)}, {
            send_page_view: false,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
        `}
      </Script>
    </>
  );
}
