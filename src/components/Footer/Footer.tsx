import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface FooterProps {
  className?: string;
}

/**
 * Shared TerraHeal Footer Component
 *
 * Minimal, flat, bold aesthetic.
 * Background #050505, border #1f1f1f, text #ffffff, secondary #8a8a8a, accent --brand.
 */
export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const resetAllProgress = useGameStore((s) => s.resetAllProgress);

  const handleResetConfirm = () => {
    resetAllProgress();
    setShowResetConfirm(false);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `min-h-[44px] inline-flex items-center font-mono uppercase text-[12px] tracking-[0.12em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-glow)] rounded-sm ${
      isActive ? 'text-white font-medium' : 'text-[#8a8a8a] hover:text-white'
    }`;

  return (
    <footer
      id="sources"
      className={`relative w-full bg-[#050505] border-t border-[#1f1f1f] text-[#ffffff] select-none ${className}`}
    >
      <div className="max-w-[1224px] mx-auto px-6 sm:px-8 pt-16 pb-12">
        {/* ── Row 1: Brand & Nav Columns ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 md:gap-16">
          {/* Row 1 (Left): Wordmark & Tagline */}
          <div className="space-y-2">
            <Link
              to="/solutions"
              aria-label="TerraHeal Home"
              className="inline-block font-pixel text-2xl font-bold tracking-tight leading-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-glow)] rounded-sm"
              style={{ fontFamily: "'Pixelify Sans', monospace, sans-serif" }}
            >
              <span className="text-white">Terra</span>
              <span className="text-[var(--brand)]">Heal</span>
            </Link>
            <p className="font-body text-[14px] text-[#8a8a8a] leading-normal">
              Heal the planet by playing.
            </p>
          </div>

          {/* Row 1 (Right): Two Link Columns (PLAY and INFO) */}
          <div className="grid grid-cols-2 gap-8 sm:gap-16">
            {/* Column "PLAY" */}
            <div className="flex flex-col">
              <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#8a8a8a] mb-2 font-medium">
                PLAY
              </span>
              <nav className="flex flex-col" aria-label="Play Games Navigation">
                <NavLink to="/clean" className={navLinkClass}>
                  Cleanup Mission
                </NavLink>
                <NavLink to="/quiz" className={navLinkClass}>
                  Zero-Waste Quiz
                </NavLink>
              </nav>
            </div>

            {/* Column "INFO" */}
            <div className="flex flex-col">
              <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#8a8a8a] mb-2 font-medium">
                INFO
              </span>
              <nav className="flex flex-col" aria-label="Information Navigation">
                <NavLink to="/sources" className={navLinkClass}>
                  Sources
                </NavLink>
                <NavLink to="/credits" className={navLinkClass}>
                  Credits
                </NavLink>
                <NavLink to="/terms" className={navLinkClass}>
                  Terms
                </NavLink>
                <NavLink to="/privacy" className={navLinkClass}>
                  Privacy
                </NavLink>
              </nav>
            </div>
          </div>
        </div>

        {/* ── Row 2: Divider ── */}
        <div className="border-t border-[#1f1f1f] my-8 sm:my-10" />

        {/* ── Row 3: Meta & Reset Action ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-[12px] text-[#8a8a8a]">
          {/* Row 3 (Left): Copyright & GitHub */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <span>TerraHeal 2026. Built for TerraCode 2026.</span>
            <a
              href="https://github.com/hashirkonnola2006-design/terracode"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TerraHeal GitHub repository"
              className="min-h-[44px] inline-flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-glow)] rounded-sm"
            >
              <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>GitHub</span>
            </a>
          </div>

          {/* Row 3 (Right): Reset All Progress */}
          <div className="pt-2 md:pt-0">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="min-h-[44px] inline-flex items-center font-mono uppercase text-[12px] tracking-[0.12em] text-red-500 hover:text-red-400 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-glow)] rounded-sm"
            >
              RESET ALL PROGRESS
            </button>
          </div>
        </div>
      </div>

      {/* ── Flat Reset Confirmation Modal ── */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85"
        >
          <div className="p-6 bg-[#050505] border border-[#333333] max-w-sm w-full space-y-4 text-left">
            <h3
              id="reset-modal-title"
              className="font-['Outfit',sans-serif] font-medium text-lg text-white"
            >
              Reset all game progress?
            </h3>
            <p className="font-body text-xs text-[#8a8a8a] leading-relaxed">
              This will clear both the Cleanup Mission and Zero-Waste Quiz progress, scores, and saved Earth states. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 min-h-[44px] px-4 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white text-xs font-mono uppercase tracking-[0.12em] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-glow)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="flex-1 min-h-[44px] px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-mono uppercase tracking-[0.12em] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-glow)]"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
