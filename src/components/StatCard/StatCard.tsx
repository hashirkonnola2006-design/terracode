import React, { useRef, useEffect, useState } from 'react';

interface StatCardProps {
  title:        string;
  value:        number;
  prefix?:      string;
  suffix?:      string;
  label:        string;
  changeType?:  'positive' | 'negative';
  source:       string;
  sourceUrl?:   string;
  year:         string;
  sparkline?:   number[];
  icon?:        React.ReactNode;
  compact?:     boolean; // narrower variant for story sections
}

/**
 * StatCard
 *
 * Glass panel with a count-up number animation.
 * Animation triggers once when the card enters the viewport
 * via IntersectionObserver (no extra library required).
 * Sparkline is a hand-drawn SVG polyline from the data array.
 */
export const StatCard: React.FC<StatCardProps> = ({
  title, value, prefix = '', suffix = '', label,
  changeType = 'positive', source, sourceUrl, year,
  sparkline, icon, compact = false,
}) => {
  const [display, setDisplay] = useState(0);
  const cardRef      = useRef<HTMLDivElement>(null);
  const hasAnimated  = useRef(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const abs = Math.abs(value);
        const neg = value < 0;
        const dur = 1800;
        const start = performance.now();
        const tick  = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          // ease-out cubic
          const e = 1 - Math.pow(1 - p, 3);
          setDisplay(neg ? -(e * abs) : e * abs);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  const fmt = (n: number) => {
    const a = Math.abs(n);
    if (a >= 10)  return Math.round(a).toString();
    if (a >= 1)   return a.toFixed(1);
    return a.toFixed(2);
  };

  const isNeg = value < 0;
  const accentColor = changeType === 'positive' ? '#0becc2' : '#f87171';

  /* ── Sparkline SVG ─ */
  const sparkSVG = sparkline && sparkline.length >= 2 ? (() => {
    const W = 72, H = 22;
    const min = Math.min(...sparkline), max = Math.max(...sparkline);
    const range = max - min || 1;
    const pts = sparkline.map((v, i) => {
      const x = (i / (sparkline.length - 1)) * W;
      const y = H - ((v - min) / range) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return (
      <svg width={W} height={H} className="mt-1 opacity-80">
        <polyline points={pts} fill="none"
          stroke={accentColor} strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  })() : null;

  return (
    <div
      ref={cardRef}
      className={`
        relative group overflow-hidden
        rounded-2xl border border-white/10
        bg-slate-900/55 backdrop-blur-xl
        hover:border-[#0becc2]/25 hover:bg-slate-900/70
        transition-all duration-500 shadow-glass
        ${compact ? 'p-4' : 'p-5 sm:p-6'}
      `}
    >
      {/* Hover radial glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none
        bg-[radial-gradient(circle_at_top_right,rgba(74,222,128,0.07),transparent_60%)]" />

      <div className="flex items-start justify-between mb-2">
        {/* Icon + title */}
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center
              bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
              {icon}
            </div>
          )}
          <span className="text-sm font-semibold text-slate-200">{title}</span>
        </div>
        {/* Top-right arrow */}
        <div className="w-6 h-6 rounded-lg flex items-center justify-center
          bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
          <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Big number */}
      <div
        className={`font-display font-extrabold tabular-nums leading-none ${compact ? 'text-3xl' : 'text-4xl'}`}
        style={{ color: accentColor }}
      >
        {isNeg && display < 0 ? '−' : prefix}
        {fmt(display)}{suffix}
      </div>

      <div className="text-xs text-slate-400 mt-0.5 font-medium">{label}</div>

      {sparkSVG}

      {/* Source */}
      <div className="mt-3 pt-2.5 border-t border-white/5 text-[10px] text-slate-500 leading-relaxed">
        <span className="text-slate-400 font-medium">Source: </span>
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors pointer-events-auto">
            {source}
          </a>
        ) : source}
        {' '}· {year}
      </div>
    </div>
  );
};
