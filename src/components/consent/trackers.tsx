'use client'

import Script from 'next/script'
import { useConsent } from './consent-context'

/**
 * Loads Microsoft Clarity and the Meta Pixel only after the user has explicitly
 * accepted cookies. Returns null otherwise — strict UK PECR / GDPR posture.
 *
 * The <noscript> fallback img the Meta install snippet ships with is omitted
 * deliberately: a user with JavaScript disabled cannot give consent, so we
 * cannot fire the tracking pixel for them either.
 */
export function Trackers() {
  const { consent, hydrated } = useConsent()

  if (!hydrated || consent !== 'accepted') return null

  return (
    <>
      <Script id="ms-clarity" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "wi9kltuc6l");
        `}
      </Script>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '972102845294895');
          fbq('track', 'PageView');
        `}
      </Script>
    </>
  )
}
