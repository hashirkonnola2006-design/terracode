import React, { useEffect, useRef } from 'react';
import { SectionFade } from '../Common/SectionFade';

interface HealedMomentProps {
  onEnter?: () => void; // called when section enters view (sets heal=1.0)
}

/**
 * HealedMoment
 *
 * Full-screen section that fires when Earth reaches uHeal=1.
 * Clean, minimal celebration: headline, two lines, a soft glow.
 * The 3D Earth (pinned layer) is now fully green behind this.
 */
export const HealedMoment: React.FC<HealedMomentProps> = ({ onEnter }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onEnter) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) onEnter(); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onEnter]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center
        bg-transparent border-t border-emerald-500/10 overflow-hidden"
    >
      {/* Green radial glow — behind text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(74,222,128,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Animated ring pulses */}
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="absolute rounded-full border border-emerald-400/15 pointer-events-none"
          style={{
            width:  `${340 + i * 160}px`,
            height: `${340 + i * 160}px`,
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            animation: `ping ${2.4 + i * 0.8}s cubic-bezier(0, 0, 0.2, 1) infinite`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <SectionFade>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400
            uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10
            rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Earth Fully Restored
          </span>

          <h2
            className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl
              text-white tracking-tight leading-[1.08] mb-6"
            style={{ textShadow: '0 0 60px rgba(74,222,128,0.35)' }}
          >
            This is the Tomorrow <br />
            <span className="text-[#4ADE80]">We Can Build</span>
          </h2>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Clean oceans. Lush forests. Renewable energy powering every home.
            It isn't science fiction — it's what happens when we choose it.
          </p>

          <a
            href="#get-involved"
            onClick={e => {
              e.preventDefault();
              document.getElementById('get-involved')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full
              font-semibold text-sm text-[#030712]
              bg-[#4ADE80] hover:bg-[#3bce74]
              shadow-[0_0_28px_rgba(74,222,128,0.5)]
              hover:shadow-[0_0_44px_rgba(74,222,128,0.75)]
              transition-all duration-300 hover:-translate-y-0.5"
          >
            Join the Movement
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </SectionFade>
      </div>
    </section>
  );
};

