import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TerraHealLogo } from '../components/brand/TerraHealLogo';
import { Footer } from '../components/Footer/Footer';

export const StaticPage = ({
  title,
  dateText = 'Last updated 10 November 2026',
  metaDescription,
  children,
  id,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${title} | TerraHeal`;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', metaDescription);

    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'index, follow');
  }, [title, metaDescription]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/solutions');
    }
  };

  return (
    <div
      id={id}
      className="relative min-h-screen bg-[#050505] text-[#ffffff] flex flex-col justify-between selection:bg-[#0becc2] selection:text-black"
    >
      {/* ── Minimal Flat Top Bar ── */}
      <header className="fixed top-0 left-0 right-0 z-30 px-6 sm:px-8 py-3 bg-[#050505] border-b border-[#1f1f1f] flex items-center justify-between">
        <TerraHealLogo markSize={24} textClass="text-base font-bold" to="/solutions" />
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back to previous page"
          className="font-mono text-xs uppercase tracking-[0.12em] text-[#8a8a8a] hover:text-white transition-colors cursor-pointer min-h-[44px] flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-glow)] rounded-sm"
        >
          Back
        </button>
      </header>

      {/* ── Single Narrow Column Content ── */}
      <main className="max-w-[640px] w-full mx-auto px-6 pt-24 pb-[120px] flex-1">
        <h1 className="font-['Outfit',sans-serif] font-semibold text-[clamp(36px,6vw,56px)] leading-[1.05] tracking-[-0.02em] text-white mb-2">
          {title}
        </h1>
        <p className="font-mono text-xs text-[#8a8a8a] mb-12">
          {dateText}
        </p>

        <div className="font-body text-[16px] leading-[1.7] text-[#c8c8c8] space-y-4">
          {children}
        </div>
      </main>

      {/* ── Shared Minimal Footer ── */}
      <Footer />
    </div>
  );
};

export default StaticPage;
