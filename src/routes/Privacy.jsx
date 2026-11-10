import React from 'react';
import { StaticPage } from './StaticPage';

export const Privacy = () => {
  return (
    <StaticPage
      title="Privacy"
      dateText="Last updated 10 November 2026"
      metaDescription="TerraHeal privacy policy. No accounts, no trackers, no cookies. Local storage details."
    >
      <p>
        TerraHeal has no accounts and no sign-up. We do not collect your name, email or any personal data on our servers.
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        Stored on your device
      </h2>
      <p>
        Your game progress, settings (sound, Lite mode), tutorial state, quiz best score and, if you enter one, the name for your certificate are saved in your browser (localStorage). A session flag is saved in sessionStorage to track whether the intro animation has played. This data stays on your device. Reset all progress in the footer, or clear your browser data, removes it.
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        Certificates
      </h2>
      <p>
        Certificates are created in your browser. Nothing is uploaded. If you share one, it goes where you send it.
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        Analytics and cookies
      </h2>
      <p>
        We do not use analytics, advertising or tracking cookies. No cookies are set by this site.
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        Hosting and fonts
      </h2>
      <p>
        The site is hosted on Vercel, which may keep standard server logs such as IP address and browser type for security and operation. Fonts load from Google Fonts (fonts.googleapis.com and fonts.gstatic.com).
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        Children
      </h2>
      <p>
        TerraHeal collects no personal data from anyone, including children.
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        Changes and contact
      </h2>
      <p>
        We may update this policy. The date at the top shows the latest version. Using the site after a change means you accept it. Questions: [CONTACT EMAIL].
      </p>
    </StaticPage>
  );
};

export default Privacy;

