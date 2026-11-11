import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { musicEngine } from '../../audio/musicEngine';
import { useGameStore } from '../../store/gameStore';

// ═══════════════════════════════════════════════════════════════
// TUNABLE CONSTANTS (Easily customized values)
// ═══════════════════════════════════════════════════════════════
export const HOVER_DELAY_MS = 120; // Hover debounce before tab switches on desktop
export const AUTO_ADVANCE_INTERVAL_MS = 8000; // Auto-advance duration before user interaction (8s)
export const TRANSITION_DURATION_MS = 220; // Panel crossfade + 8px slide duration
export const PANEL_MIN_HEIGHT = 'min-h-[440px] xl:min-h-[460px]'; // Fixed desktop panel min-height to prevent jumping

// ═══════════════════════════════════════════════════════════════
// VERIFIED SIX PILLARS DATA (Exact copy & sources preserved)
// ═══════════════════════════════════════════════════════════════
export const PILLARS_DATA = [
  {
    id: 'reduce',
    number: '01',
    title: 'Reduce',
    tagline: 'Prevention before production',
    desc: 'Stop excess consumption and single-use packaging at the source. Cutting waste before it exists prevents 100% of upstream extraction, transport, and manufacturing emissions.',
    action: 'Audit your personal trash for 3 days and eliminate the single most frequent disposable item you purchase.',
    whyItWorks:
      'Over 40% of all plastic produced is used once for packaging then discarded. Prevention avoids raw petroleum extraction and industrial refining altogether.',
    sourceNumber: 5,
    sourceName: 'UNEP "Turning off the Tap" (2023) & Ellen MacArthur Foundation',
    sourceUrl: 'https://www.unep.org/resources/turning-off-tap',
  },
  {
    id: 'reuse',
    number: '02',
    title: 'Reuse',
    tagline: 'Circulate items at peak utility',
    desc: 'Repair, refill, repurpose, and share everyday equipment and containers instead of discarding them. Shifting to reusable models keeps manufactured materials in productive loops for years.',
    action: 'Keep a clean stainless steel bottle and a durable canvas tote in your everyday bag every morning.',
    whyItWorks:
      'Shifting to reusable systems can cut annual ocean plastic leakage by 20% by 2040 and lowers lifecycle container carbon costs by over 70%.',
    sourceNumber: 6,
    sourceName: 'Ellen MacArthur Foundation: Reuse – Rethinking Packaging (2021)',
    sourceUrl: 'https://www.ellenmacarthurfoundation.org/reuse-rethinking-packaging',
  },
  {
    id: 'recycle',
    number: '03',
    title: 'Recycle',
    tagline: 'True closed-loop secondary smelting',
    desc: 'Rinse, recover, and reprocess infinite metals and glass into brand new products. High-grade recycling replaces virgin mining and preserves critical planetary materials.',
    action: 'Rinse food residue from aluminum drink cans and crush them before sorting so optical scanners register them.',
    whyItWorks:
      'Recycling aluminum saves 95% of the energy and 97% of the greenhouse emissions required to refine primary aluminium from bauxite ore.',
    sourceNumber: 7,
    sourceName: 'US EPA Lifecycle Assessment & International Aluminium Institute (2023)',
    sourceUrl: 'https://www.epa.gov/recycle',
  },
  {
    id: 'compost',
    number: '04',
    title: 'Compost',
    tagline: 'Return carbon to living soil',
    desc: 'Divert food scraps and plant waste from oxygen-deprived landfills into nutrient-dense humus. Restores degraded soil microbiology, retains moisture, and stops fugitive methane.',
    action: 'Collect fruit peels, coffee grounds, and vegetable ends in a sealed freezer tub for a weekly local drop-off.',
    whyItWorks:
      'Organic food waste rotting in oxygen-poor landfills generates 8–10% of global greenhouse gases, producing methane over 28 times more potent than CO₂.',
    sourceNumber: 8,
    sourceName: 'UNEP Food Waste Index Report (2024) & IPCC Climate and Land',
    sourceUrl: 'https://www.unep.org/resources/publication/food-waste-index-report-2024',
  },
  {
    id: 'clean-energy',
    number: '05',
    title: 'Clean Energy',
    tagline: 'Electrify everything with sun and wind',
    desc: 'Replace fossil generation with solar arrays, wind farms, and battery storage. Clean electricity powers transportation, heating, and appliances without releasing toxic smog.',
    action: 'Switch dorm power strips off before sleep to kill phantom electronics idle draw.',
    whyItWorks:
      'Renewable electricity reached a historic 30.3% share of global power generation in 2023, decoupling clean economic progress from fossil smokestacks.',
    sourceNumber: 9,
    sourceName: 'Ember Global Electricity Review (2024)',
    sourceUrl: 'https://ember-climate.org/insights/research/global-electricity-review-2024/',
  },
  {
    id: 'restore-nature',
    number: '06',
    title: 'Restore Nature',
    tagline: 'Rewild terrestrial and coastal biomes',
    desc: 'Replant indigenous tree species, protect living coastal mangrove buffers, and defend mature old-growth canopies. Intact ecological systems act as Earth’s primary life support.',
    action: 'Volunteer with a native tree planting or riparian watershed cleanup project in your local community.',
    whyItWorks:
      'Intact world forests sequester 7.6 billion metric tonnes of net CO₂ each year — absorbing roughly 1.5 times the total annual emissions of the entire United States.',
    sourceNumber: 10,
    sourceName: 'Harris et al., Nature Climate Change / FAO Forest Resources (2024)',
    sourceUrl: 'https://www.nature.com/articles/s41558-020-00976-6',
  },
];

export const SixPillarsSection = ({ onScrollToPlay }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);

  const sectionRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const liteMode = useGameStore((s) => s.liteMode);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const activePillar = PILLARS_DATA[activeIndex] || PILLARS_DATA[0];

  // Observe section visibility for auto-advance timer
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSectionVisible(entry.isIntersecting);
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-advance loop: advances every 8s while visible until user interacts
  useEffect(() => {
    if (userInteracted || prefersReducedMotion || liteMode || !isSectionVisible) {
      setAutoProgress(0);
      return;
    }

    const intervalTime = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      if (document.hidden) return; // Pause when tab is hidden
      elapsed += intervalTime;
      const pct = Math.min(elapsed / AUTO_ADVANCE_INTERVAL_MS, 1.0);
      setAutoProgress(pct);

      if (elapsed >= AUTO_ADVANCE_INTERVAL_MS) {
        elapsed = 0;
        setAutoProgress(0);
        setActiveIndex((prev) => (prev + 1) % PILLARS_DATA.length);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [userInteracted, prefersReducedMotion, liteMode, isSectionVisible, activeIndex]);

  // Handle immediate click selection
  const handlePillarSelect = useCallback((idx) => {
    setUserInteracted(true);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (idx !== activeIndex) {
      setActiveIndex(idx);
      musicEngine.playClick();
    }
  }, [activeIndex]);

  // Handle debounced hover on desktop (120ms to prevent flicker across rows)
  const handlePillarHover = useCallback((idx) => {
    setUserInteracted(true);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      if (idx !== activeIndex) {
        setActiveIndex(idx);
        musicEngine.playHover();
      }
    }, HOVER_DELAY_MS);
  }, [activeIndex]);

  const handlePillarLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  // Keyboard navigation for ARIA tabs pattern
  const handleKeyDown = useCallback((e, currentIdx) => {
    setUserInteracted(true);
    let nextIdx = null;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (currentIdx + 1) % PILLARS_DATA.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (currentIdx - 1 + PILLARS_DATA.length) % PILLARS_DATA.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIdx = PILLARS_DATA.length - 1;
    }

    if (nextIdx !== null) {
      setActiveIndex(nextIdx);
      musicEngine.playClick();
      const targetTab = document.getElementById(`pillar-tab-${PILLARS_DATA[nextIdx].id}`);
      if (targetTab) targetTab.focus();
    }
  }, []);

  return (
    <section
      id="solutions"
      ref={sectionRef}
      className="relative z-10 w-full bg-[#050505] scroll-mt-20 py-16 sm:py-20 lg:py-0 lg:h-[min(100vh,820px)] lg:min-h-[640px] flex items-center justify-center overflow-hidden"
    >
      {/* Embedded scoped animation for 8px upward slide crossfade */}
      <style>{`
        @keyframes pillarSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-pillar-slide {
          animation: pillarSlideIn ${TRANSITION_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
        {/* ═══════════════════════════════════════════════════════════════
            DESKTOP LAYOUT (1024px and up): Selector + Detail Panel
            ═══════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8 xl:gap-12 items-center w-full">
          {/* ── LEFT COLUMN (About 40% / 5 cols): Heading + Selector List ── */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-5">
            {/* Header copy */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#14e6c0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14e6c0]" />
                <span>02 · THE RESTORATION FRAMEWORK</span>
              </div>

              <h2 className="font-display font-extrabold text-3xl lg:text-[34px] xl:text-[38px] text-white tracking-tight leading-[1.08]">
                Six things that actually move the needle.
              </h2>

              <p className="font-body font-light text-xs lg:text-[13px] xl:text-sm text-white/70 leading-relaxed">
                Project Drawdown and UNEP modeling confirm that circular reduction, organic composting,
                clean power grids, and habitat regeneration can collectively avoid over{' '}
                <span className="text-white font-medium">400 gigatonnes</span> of greenhouse gases by
                2050.
              </p>

              <p className="text-[11px] font-mono text-[#8a8a8a] tracking-wide">
                Ordered by the waste hierarchy. Select any pillar to see concrete mechanisms.
              </p>
            </div>

            {/* Vertical Selector List: 6 rows separated by 1px dividers */}
            <div
              role="tablist"
              aria-orientation="vertical"
              aria-label="Restoration Framework Pillars"
              className="border-t border-b border-[#1f1f1f] divide-y divide-[#1f1f1f]"
            >
              {PILLARS_DATA.map((pillar, idx) => {
                const isActive = activeIndex === idx;

                return (
                  <button
                    key={pillar.id}
                    role="tab"
                    id={`pillar-tab-${pillar.id}`}
                    aria-selected={isActive}
                    aria-controls={`pillar-panel-${pillar.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => handlePillarSelect(idx)}
                    onMouseEnter={() => handlePillarHover(idx)}
                    onMouseLeave={handlePillarLeave}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className={`w-full py-2.5 px-3 flex items-center justify-between text-left transition-colors duration-150 relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14e6c0] rounded-[2px] ${
                      isActive
                        ? 'text-[#14e6c0] bg-white/[0.03]'
                        : 'text-white/70 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Active 3px indicator bar on the left edge */}
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#14e6c0]" />
                    )}

                    <div className="flex items-baseline gap-3 min-w-0">
                      <span
                        className={`font-pixel text-[20px] lg:text-[22px] font-bold leading-none shrink-0 transition-colors ${
                          isActive ? 'text-[#14e6c0]' : 'text-[#5a5a5a]'
                        }`}
                      >
                        {pillar.number}
                      </span>
                      <span
                        className={`font-display font-bold text-sm lg:text-[15px] truncate ${
                          isActive ? 'text-[#14e6c0]' : 'text-white/80'
                        }`}
                      >
                        {pillar.title}
                      </span>
                    </div>

                    {/* Small arrow on the right for active row */}
                    {isActive ? (
                      <ArrowRight className="w-3.5 h-3.5 text-[#14e6c0] shrink-0 ml-2" />
                    ) : (
                      <span className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT COLUMN (About 60% / 7 cols): ONE Flat Detail Panel ── */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div
              role="tabpanel"
              id={`pillar-panel-${activePillar.id}`}
              aria-labelledby={`pillar-tab-${activePillar.id}`}
              tabIndex={0}
              className={`border border-[#1f1f1f] rounded-[4px] bg-[#0b0b0b] p-6 lg:p-7 xl:p-8 relative ${PANEL_MIN_HEIGHT} flex flex-col justify-between overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14e6c0]`}
            >
              {/* Very large decorative outlined number in the top-right corner */}
              <span
                aria-hidden="true"
                className="font-pixel text-[110px] lg:text-[124px] xl:text-[136px] font-bold leading-none absolute top-1 right-4 select-none pointer-events-none"
                style={{
                  WebkitTextStroke: '1px rgba(255, 255, 255, 0.07)',
                  color: 'transparent',
                }}
              >
                {activePillar.number}
              </span>

              {/* Panel content wrapper: crossfades with 8px upward slide */}
              <div
                key={activePillar.id}
                className={prefersReducedMotion ? '' : 'animate-pillar-slide'}
              >
                {/* Title & Subtitle */}
                <div className="relative z-10 pr-24 mb-4">
                  <h3 className="font-display font-extrabold text-2xl lg:text-3xl text-white tracking-tight leading-tight">
                    {activePillar.title}
                  </h3>
                  <span className="font-mono text-xs text-[#8a8a8a] tracking-wider block mt-1 uppercase">
                    {activePillar.tagline}
                  </span>
                </div>

                {/* Description paragraph */}
                <p className="font-body text-xs lg:text-[13px] xl:text-sm text-white/80 leading-relaxed max-w-[58ch] mb-6 relative z-10">
                  {activePillar.desc}
                </p>

                {/* Two-column action & why row */}
                <div
                  className={`grid gap-5 relative z-10 mb-6 ${
                    activePillar.whyItWorks ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  {/* Left: TRY THIS WEEK */}
                  <div className="space-y-1.5">
                    <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#14e6c0] font-bold block">
                      Try This Week
                    </span>
                    <p className="font-body text-xs lg:text-[13px] text-white/85 leading-relaxed">
                      {activePillar.action}
                    </p>
                  </div>

                  {/* Right: WHY THIS MATTERS */}
                  {activePillar.whyItWorks && (
                    <div className="space-y-1.5">
                      <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#14e6c0] font-bold block">
                        Why This Matters
                      </span>
                      <p className="font-body text-xs lg:text-[13px] text-white/75 leading-relaxed">
                        {activePillar.whyItWorks}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Source Line at bottom */}
              <div className="pt-4 border-t border-[#1f1f1f] flex items-center gap-2 relative z-10 mt-auto">
                <span className="font-mono text-xs text-[#8a8a8a]">
                  [{activePillar.sourceNumber}]
                </span>
                <a
                  href={activePillar.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[#8a8a8a] hover:text-[#14e6c0] transition-colors underline underline-offset-4 decoration-[#8a8a8a]/30 hover:decoration-[#14e6c0]"
                  onClick={() => musicEngine.playClick()}
                >
                  {activePillar.sourceName}
                </a>
              </div>

              {/* Optional Auto-advance thin teal progress line along bottom edge */}
              {!userInteracted && !prefersReducedMotion && !liteMode && isSectionVisible && (
                <div
                  className="absolute bottom-0 left-0 h-[2px] bg-[#14e6c0] pointer-events-none"
                  style={{
                    width: `${autoProgress * 100}%`,
                    transition: 'width 100ms linear',
                  }}
                  role="progressbar"
                  aria-label="Pillar auto-advance progress"
                  aria-valuenow={Math.round(autoProgress * 100)}
                />
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MOBILE / TABLET LAYOUT (Below 1024px): Compact Single-Accordion
            ═══════════════════════════════════════════════════════════════ */}
        <div className="lg:hidden w-full max-w-2xl mx-auto">
          {/* Header & Intro */}
          <div className="space-y-3 mb-6">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#14e6c0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14e6c0]" />
              <span>02 · THE RESTORATION FRAMEWORK</span>
            </div>

            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
              Six things that actually move the needle.
            </h2>

            <p className="font-body font-light text-xs sm:text-sm text-white/70 leading-relaxed">
              Project Drawdown and UNEP modeling confirm that circular reduction, organic composting,
              clean power grids, and habitat regeneration can collectively avoid over{' '}
              <span className="text-white font-medium">400 gigatonnes</span> of greenhouse gases by
              2050.
            </p>

            <p className="text-[10px] sm:text-[11px] font-mono text-[#8a8a8a] tracking-wide">
              Ordered by the waste hierarchy. Tap any pillar to expand details.
            </p>
          </div>

          {/* Accordion Rows: Only ONE open at a time */}
          <div className="border-t border-b border-[#1f1f1f] divide-y divide-[#1f1f1f]">
            {PILLARS_DATA.map((pillar, idx) => {
              const isOpen = activeIndex === idx;

              return (
                <div key={pillar.id} className="transition-colors">
                  {/* Tap Target (Min 48px height) */}
                  <button
                    type="button"
                    onClick={() => {
                      musicEngine.playClick();
                      setUserInteracted(true);
                      setActiveIndex(idx);
                    }}
                    aria-expanded={isOpen}
                    aria-controls={`mobile-panel-${pillar.id}`}
                    className={`w-full min-h-[48px] py-3.5 px-3 flex items-center justify-between text-left transition-colors relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14e6c0] ${
                      isOpen
                        ? 'bg-white/[0.04] text-[#14e6c0]'
                        : 'text-white/80 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    {isOpen && (
                      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#14e6c0]" />
                    )}

                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`font-pixel text-[18px] sm:text-[20px] font-bold leading-none shrink-0 ${
                          isOpen ? 'text-[#14e6c0]' : 'text-[#5a5a5a]'
                        }`}
                      >
                        {pillar.number}
                      </span>
                      <span
                        className={`font-display font-bold text-sm sm:text-base truncate ${
                          isOpen ? 'text-[#14e6c0]' : 'text-white'
                        }`}
                      >
                        {pillar.title}
                      </span>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#14e6c0]' : 'text-[#8a8a8a]'
                      }`}
                    />
                  </button>

                  {/* Expanded Detail Panel */}
                  {isOpen && (
                    <div
                      id={`mobile-panel-${pillar.id}`}
                      className="px-4 py-4 sm:px-5 sm:py-5 bg-[#0b0b0b] border-t border-[#1f1f1f] space-y-4"
                    >
                      <div>
                        <span className="font-mono text-[11px] text-[#8a8a8a] uppercase tracking-wider block mb-1">
                          {pillar.tagline}
                        </span>
                        <p className="font-body text-xs sm:text-sm text-white/80 leading-relaxed">
                          {pillar.desc}
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#14e6c0] font-bold block">
                          Try This Week
                        </span>
                        <p className="font-body text-xs text-white/85 leading-relaxed">
                          {pillar.action}
                        </p>
                      </div>

                      {pillar.whyItWorks && (
                        <div className="space-y-1.5 pt-1">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[#14e6c0] font-bold block">
                            Why This Matters
                          </span>
                          <p className="font-body text-xs text-white/75 leading-relaxed">
                            {pillar.whyItWorks}
                          </p>
                        </div>
                      )}

                      <div className="pt-3 border-t border-[#1f1f1f] flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[#8a8a8a]">
                          [{pillar.sourceNumber}]
                        </span>
                        <a
                          href={pillar.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-[#8a8a8a] hover:text-[#14e6c0] underline underline-offset-4 decoration-[#8a8a8a]/30"
                          onClick={() => musicEngine.playClick()}
                        >
                          {pillar.sourceName}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SixPillarsSection;
