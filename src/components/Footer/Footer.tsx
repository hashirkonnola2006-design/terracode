import React from 'react';
import { Zap, ZapOff, Leaf } from 'lucide-react';

interface FooterProps {
  isLowPower:       boolean;
  onToggleLowPower: () => void;
}

/**
 * Footer
 *
 * Project name, theme, GitHub/credits links,
 * low-power toggle, and a sustainable page-weight note.
 */
export const Footer: React.FC<FooterProps> = ({ isLowPower, onToggleLowPower }) => {
  // Rough page weight estimate (textures + JS bundle gzipped)
  const pageWeightKb = '~360';

  return (
    <footer className="relative bg-[rgba(2,7,14,0.35)] backdrop-blur-md text-slate-400 text-xs">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">

          {/* Brand */}
          <div>
            <a href="#" className="inline-flex items-center gap-2 group mb-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30
                flex items-center justify-center group-hover:scale-110 transition-transform">
                <Leaf className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              </span>
              <span className="font-display font-bold text-sm text-white">EcoFuture</span>
            </a>
            <p className="text-slate-500 leading-relaxed max-w-xs">
              Built for <span className="text-emerald-400">TerraCode 2026</span> — theme:
              Green Tomorrow, Building a Sustainable Future.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2.5">
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              GitHub Repository
            </a>
            <a
              href="#"
              className="hover:text-emerald-400 transition-colors"
            >
              Credits &amp; Licences
            </a>
            <a
              href="https://www.ipcc.ch/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              Data Sources
            </a>
          </div>

          {/* Low-Power Mode toggle + page weight */}
          <div className="flex flex-col items-start sm:items-end gap-3">
            <button
              onClick={onToggleLowPower}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all text-xs font-medium
                ${isLowPower
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                }`}
            >
              {isLowPower
                ? <><ZapOff className="w-3.5 h-3.5" /> Eco Mode: ON (2D Fallback)</>
                : <><Zap className="w-3.5 h-3.5 text-amber-400" /> Eco Mode: OFF (3D Globe)</>
              }
            </button>
            <span className="text-slate-600 font-mono">
              Approx. page weight (gzip): {pageWeightKb} KB
            </span>
            <span className="text-slate-600">
              60 fps · DPR capped at 2 · Zero third-party trackers
            </span>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row
          items-center justify-between gap-3 text-slate-600">
          <span>© 2026 EcoFuture / TerraCode. MIT Licence.</span>
          <span className="text-center">
            Earth textures: NASA Blue Marble (public domain) via Three.js examples (MIT) ·
            Simplex noise: Ashima Arts (MIT)
          </span>
        </div>
      </div>
    </footer>
  );
};

