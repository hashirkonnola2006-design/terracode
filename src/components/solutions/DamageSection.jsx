import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { musicEngine } from '../../audio/musicEngine';

// Verified Statistics from Primary Authoritative Sources (UNEP, OECD, Global Carbon Project, FAO)
export const DAMAGE_STATS = [
  {
    id: 'ocean-plastic',
    numberValue: 11,
    suffix: '–14M',
    unit: 'tonnes / year',
    highlight: '11–14 million tonnes',
    label: 'Plastic entering the oceans annually',
    meaning:
      'Over 11 million metric tonnes of plastics escape into our seas every year — roughly equivalent to dumping an entire refuse truck of plastic into the ocean every minute.',
    sourceNumber: 1,
    sourceName: 'UNEP "Turning off the Tap" (2023) & Pew Charitable Trusts (2020)',
    sourceUrl: 'https://www.unep.org/resources/turning-off-tap',
    indentClass: 'ml-0',
  },
  {
    id: 'recycled-share',
    numberValue: 9,
    suffix: '%',
    unit: 'globally',
    highlight: '9% recycled',
    label: 'Share of plastic waste actually recycled',
    meaning:
      'Only 9% of all plastic waste produced worldwide is successfully recycled. 19% is incinerated, nearly 50% sits in landfills, and 22% evades waste systems entirely.',
    sourceNumber: 2,
    sourceName: 'OECD Global Plastics Outlook: Policy Scenarios to 2060 (2022)',
    sourceUrl: 'https://www.oecd.org/environment/plastics/',
    indentClass: 'sm:ml-12 lg:ml-16',
  },
  {
    id: 'per-capita-co2',
    numberValue: 4.7,
    isFloat: true,
    suffix: '',
    unit: 'tonnes CO₂ / person',
    highlight: '4.7 tonnes CO₂',
    label: 'Global carbon emissions per person each year',
    meaning:
      'Global average greenhouse emissions sit at 4.7 tonnes per human annually — more than double the sustainable 2.0-tonne threshold needed to stabilize planetary warming.',
    sourceNumber: 3,
    sourceName: 'Global Carbon Project, Global Carbon Budget 2023 & IEA (2023)',
    sourceUrl: 'https://globalcarbonbudget.org/',
    indentClass: 'sm:ml-6 lg:ml-8',
  },
  {
    id: 'forest-lost',
    numberValue: 10,
    suffix: 'M',
    unit: 'hectares / year',
    highlight: '10 million hectares',
    label: 'Forest canopy destroyed every twelve months',
    meaning:
      'Ten million hectares of planetary forest are cleared every year — wiping out an area roughly equal to the entire landmass of Iceland every twelve months.',
    sourceNumber: 4,
    sourceName: 'FAO Global Forest Resources Assessment & State of the World Forests (2024)',
    sourceUrl: 'https://www.fao.org/forest-resources-assessment/en/',
    indentClass: 'sm:ml-20 lg:ml-24',
  },
];

export const DamageSection = ({ onScrollToPillars }) => {
  const [inView, setInView] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasCounted, setHasCounted] = useState(false);
  const [animatedValues, setAnimatedValues] = useState([0, 0, 0, 0]);
  const sectionRef = useRef(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Viewport intersection observer to trigger count-up once
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scroll listener to update the thin vertical progress line
  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalDist = rect.height - windowHeight * 0.4;

      if (totalDist > 0) {
        const scrolled = -rect.top + windowHeight * 0.25;
        const ratio = Math.max(0, Math.min(1, scrolled / totalDist));
        setScrollProgress(ratio);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animated numeral count-up once on enter
  useEffect(() => {
    if (!inView || hasCounted) return;
    setHasCounted(true);

    if (prefersReducedMotion) {
      setAnimatedValues(DAMAGE_STATS.map((s) => s.numberValue));
      return;
    }

    const startTime = performance.now();
    const duration = 1400; // 1.4s smooth roll

    const frame = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedValues(
        DAMAGE_STATS.map((stat) => {
          if (stat.isFloat) {
            return parseFloat((stat.numberValue * eased).toFixed(1));
          }
          return Math.round(stat.numberValue * eased);
        })
      );

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setAnimatedValues(DAMAGE_STATS.map((s) => s.numberValue));
      }
    };

    requestAnimationFrame(frame);
  }, [inView, hasCounted, prefersReducedMotion]);

  return (
    <section
      id="damage"
      ref={sectionRef}
      className="relative z-10 w-full min-h-screen py-24 sm:py-32 scroll-mt-20 overflow-hidden"
    >
      {/* Soft Dark Scrim behind text column — ensures globe never clashes with reading */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-r from-[#050505] via-[#050505]/95 via-60% to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        {/* Section Header: Human headline, left-aligned */}
        <div className="max-w-2xl space-y-4 mb-20 sm:mb-28">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#f97316]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse" />
            <span>01 • Current Planetary State</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.08]">
            Here is what we are dealing with.
          </h2>

          <p className="font-body font-light text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">
            The scale of ecological loss is documented in hard, measured figures. These four
            numbers outline why existing waste habits and consumption systems cannot hold.
          </p>
        </div>

        {/* Left Vertical Progress Line + Staggered Stats Container */}
        <div className="relative pl-6 sm:pl-10">
          {/* Hairline Vertical Track on left edge */}
          <div className="absolute left-0 top-2 bottom-6 w-[1px] bg-white/10">
            {/* Active filled line tracking scroll progress */}
            <div
              className="w-[2px] -left-[0.5px] relative bg-gradient-to-b from-[#f97316] via-[#f97316] to-[#14e6c0] transition-all duration-150 ease-out"
              style={{ height: `${Math.max(4, scrollProgress * 100)}%` }}
            />
          </div>

          {/* Staggered Editorial Stats Stack */}
          <div className="space-y-16 sm:space-y-24 divide-y divide-white/10">
            {DAMAGE_STATS.map((stat, idx) => {
              const displayVal = animatedValues[idx] ?? stat.numberValue;
              const formattedVal = stat.isFloat
                ? displayVal.toFixed(1)
                : displayVal;

              return (
                <div
                  key={stat.id}
                  className={`pt-12 sm:pt-16 first:pt-0 transition-transform duration-500 ${stat.indentClass}`}
                >
                  <div className="max-w-xl space-y-4 group">
                    {/* Big Display Numeral + Suffix */}
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="font-display font-extrabold text-5xl sm:text-7xl lg:text-8xl text-white tracking-tighter leading-none group-hover:text-white transition-colors">
                        {formattedVal}
                        {stat.suffix}
                      </span>
                      <span className="font-mono text-sm sm:text-base text-white/50 tracking-wider">
                        {stat.unit}
                      </span>
                    </div>

                    {/* Stat Meaning / Human Prose */}
                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-lg sm:text-xl text-white/90">
                        {stat.label}
                      </h3>
                      <p className="font-body font-light text-sm sm:text-base text-white/70 leading-relaxed">
                        {stat.meaning}
                      </p>
                    </div>

                    {/* Numbered Source Footnote Link */}
                    <div className="pt-2 flex items-center gap-2">
                      <span className="font-mono text-xs text-[#f97316]">
                        [{stat.sourceNumber}]
                      </span>
                      <a
                        href={stat.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-white/40 hover:text-[#14e6c0] transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-[#14e6c0]"
                        onClick={() => musicEngine.playClick()}
                      >
                        {stat.sourceName}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Handover Line: Transition to Six Pillars */}
        <div className="mt-24 sm:mt-32 pt-12 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <p className="font-display font-semibold text-xl sm:text-2xl text-white tracking-tight">
            None of this is fixed by one thing.{' '}
            <span className="text-[#14e6c0]">Six things matter most.</span>
          </p>

          <button
            onClick={() => {
              musicEngine.playClick();
              if (onScrollToPillars) onScrollToPillars();
            }}
            onMouseEnter={() => musicEngine.playHover()}
            className="inline-flex items-center gap-3 font-label uppercase text-xs tracking-[0.2em] text-[#14e6c0] hover:text-[#5df7d9] transition-colors group cursor-pointer"
          >
            <span>See the six solutions</span>
            <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};
