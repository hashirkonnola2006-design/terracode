import React from 'react';
import { Link } from 'react-router-dom';
import { StaticPage } from './StaticPage';

export const Terms = () => {
  return (
    <StaticPage
      title="Terms"
      dateText="Last updated 10 November 2026"
      metaDescription="TerraHeal terms of service for personal and educational use."
    >
      <p>
        TerraHeal is a free educational game about waste, recycling and climate. By using it you agree to these terms.
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        Using the site
      </h2>
      <p>
        You may play, share and link to TerraHeal for personal and educational use. Do not try to break, overload or scrape the site.
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        No professional advice
      </h2>
      <p>
        The games and facts are for learning. They are not legal, scientific or waste-management advice. Local recycling and disposal rules differ by city and country. Check your local rules.
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        Accuracy
      </h2>
      <p>
        We cite our sources on the{' '}
        <Link to="/sources" className="text-[var(--brand)] hover:underline">
          Sources
        </Link>{' '}
        page and try to keep them correct. Numbers can change when the original sources update. If you find a mistake, tell us.
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        No warranty
      </h2>
      <p>
        TerraHeal is provided as is, without warranties of any kind. It may change, break or go offline at any time.
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        Liability
      </h2>
      <p>
        To the extent the law allows, we are not liable for any loss that results from using the site.
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        Content and code
      </h2>
      <p>
        The game code is in our public repository, under the licence stated there. Third-party assets keep their own licences, listed on the{' '}
        <Link to="/credits" className="text-[var(--brand)] hover:underline">
          Credits
        </Link>{' '}
        page. The TerraHeal name and logo are not covered by the code licence.
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        Changes
      </h2>
      <p>
        We may update these terms. The date at the top shows the latest version. Using the site after a change means you accept it.
      </p>

      <h2 className="font-['Outfit',sans-serif] font-medium text-[20px] text-white mt-12 mb-3">
        Contact
      </h2>
      <p>
        Questions: [CONTACT EMAIL].
      </p>
    </StaticPage>
  );
};

export default Terms;

