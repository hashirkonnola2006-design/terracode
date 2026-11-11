import React, { useState, useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { musicEngine } from '../../audio/musicEngine';
import { refreshGlobeScrollTriggers } from '../../config/globeScrollManager';

// Verified Six Pillars Data according to waste hierarchy & primary sources
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
    accentPad: 'py-10 sm:py-12',
    indentClass: 'pl-0',
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
    accentPad: 'py-8 sm:py-10',
    indentClass: 'pl-0 sm:pl-3',
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
    accentPad: 'py-8 sm:py-10',
    indentClass: 'pl-0',
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
    accentPad: 'py-8 sm:py-10',
    indentClass: 'pl-0 sm:pl-3',
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
    accentPad: 'py-8 sm:py-10',
    indentClass: 'pl-0',
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
    accentPad: 'py-9 sm:py-11',
    indentClass: 'pl-0 sm:pl-3',
  },
];

export const SixPillarsSection = ({ onScrollToPlay }) => {
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const sectionRef = useRef(null);

  const handleRowHover = (id) => {
    setHoveredRowId(id);
    if (id) {
      musicEngine.playHover();
      refreshGlobeScrollTriggers();
    }
  };

  return (
    <section
      id="solutions"
      ref={sectionRef}
      className="relative z-10 w-full min-h-screen py-24 sm:py-32 scroll-mt-20 overflow-hidden"
    >
      {/* Soft Dark Scrim behind text column only — leaves left negative space open for the 3D globe */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-l from-[#050505]/95 via-[#050505]/80 to-transparent sm:to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        {/* Two-Column Editorial Layout: Sticky Left Heading, Stacked Hairline Rows on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* ── LEFT COLUMN (Sticky on Desktop, transparent so globe is prominent) ── */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#14e6c0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14e6c0]" />
              <span>02 • The Restoration Framework</span>
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.06]">
              Six things that actually move the needle.
            </h2>

            <p className="font-body font-light text-base sm:text-lg text-white/70 leading-relaxed">
              Project Drawdown and UNEP modeling confirm that circular reduction, organic composting,
              clean power grids, and habitat regeneration can collectively avoid over{' '}
              <span className="text-white font-medium">400 gigatonnes</span> of greenhouse gases by
              2050.
            </p>

            <div className="pt-2 text-xs font-mono text-white/40 border-l border-white/10 pl-3">
              Ordered by the waste hierarchy. Hover any pillar to see concrete mechanisms.
            </div>
          </div>

          {/* ── RIGHT COLUMN (Stacked Editorial Hairline Rows, No Boxes / No Cards) ── */}
          <div className="lg:col-span-7 space-y-0 divide-y divide-white/10 border-t border-b border-white/10">
            {PILLARS_DATA.map((pillar) => {
              const isHovered = hoveredRowId === pillar.id;

              return (
                <div
                  key={pillar.id}
                  className={`group transition-all duration-300 ${pillar.accentPad} ${pillar.indentClass} ${
                    isHovered ? 'bg-white/[0.02]' : ''
                  }`}
                  onMouseEnter={() => handleRowHover(pillar.id)}
                  onMouseLeave={() => handleRowHover(null)}
                  tabIndex={0}
                  onFocus={() => handleRowHover(pillar.id)}
                  onBlur={() => handleRowHover(null)}
                >
                  <div className="space-y-4">
                    {/* Top Row: Numeral + Title (Soft orange numeral, teal only on hover/focus) */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-baseline gap-4 sm:gap-6">
                        <span
                          className="font-pixel font-bold text-4xl sm:text-5xl lg:text-6xl transition-colors duration-300 leading-none text-[#f97316] group-hover:text-[#14e6c0] group-focus:text-[#14e6c0]"
                        >
                          {pillar.number}
                        </span>

                        <div>
                          <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight group-hover:text-white transition-colors">
                            {pillar.title}
                          </h3>
                          <span className="font-mono text-xs text-white/50 tracking-wider block mt-0.5">
                            {pillar.tagline}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description (1 to 2 short concrete sentences) */}
                    <p className="font-body font-light text-sm sm:text-base text-white/75 leading-relaxed max-w-xl">
                      {pillar.desc}
                    </p>

                    {/* Concrete Action Student Can Do */}
                    <div className="pt-2 flex items-start gap-2.5 text-xs sm:text-sm text-white/90">
                      <span className="font-label uppercase font-bold text-[10px] tracking-widest text-[#14e6c0] mt-0.5 shrink-0">
                        Try This Week:
                      </span>
                      <span className="font-body text-white/80">{pillar.action}</span>
                    </div>

                    {/* Expandable "Why it works" on Hover or Keyboard Focus */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isHovered ? 'max-h-36 opacity-100 pt-3' : 'max-h-0 opacity-0 pt-0'
                      }`}
                    >
                      <div className="p-3.5 rounded-lg border border-[#14e6c0]/20 bg-[#14e6c0]/5 text-xs text-white/80 leading-relaxed font-body">
                        <strong className="text-[#14e6c0] font-mono text-[11px] block mb-1">
                          WHY THIS MATTERS:
                        </strong>
                        {pillar.whyItWorks}
                      </div>
                    </div>

                    {/* Footnote Link */}
                    <div className="pt-2 flex items-center gap-2">
                      <span className="font-mono text-xs text-white/30">
                        [{pillar.sourceNumber}]
                      </span>
                      <a
                        href={pillar.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-white/40 hover:text-[#14e6c0] transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-[#14e6c0]"
                        onClick={() => musicEngine.playClick()}
                      >
                        {pillar.sourceName}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Handover to Section 3: Play Games */}
        <div className="mt-24 sm:mt-32 pt-12 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <p className="font-display font-semibold text-xl sm:text-2xl text-white tracking-tight">
            Knowledge is half the battle.{' '}
            <span className="text-[#14e6c0]">Now take action.</span>
          </p>

          <button
            onClick={() => {
              musicEngine.playClick();
              if (onScrollToPlay) onScrollToPlay();
            }}
            onMouseEnter={() => musicEngine.playHover()}
            className="inline-flex items-center gap-3 font-label uppercase text-xs tracking-[0.2em] text-[#14e6c0] hover:text-[#5df7d9] transition-colors group cursor-pointer"
          >
            <span>Play games</span>
            <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default SixPillarsSection;
