import React, { useEffect, useRef } from 'react';
import { StatCard } from '../StatCard/StatCard';
import { SectionFade } from '../Common/SectionFade';

interface StoryStep {
  id:          string;
  step:        number;
  healTarget:  number;
  icon:        string;
  heading:     string;
  body:        string;
  statLabel:   string;
  value:       number;
  prefix:      string;
  suffix:      string;
  changeType:  string;
  source:      string;
  sourceUrl:   string;
  year:        string;
}

interface ImpactSectionProps {
  steps:            StoryStep[];
  onHealUpdate:     (v: number) => void; // notifies App to advance uHeal
}

/**
 * ImpactSection
 *
 * Three scroll steps, each driving the Earth's heal progress.
 * Uses a lightweight IntersectionObserver (no GSAP dependency)
 * to detect which step is in view, then calls onHealUpdate.
 *
 * Layout: alternating left-text / right-illustration for variety.
 */

// Inline SVG illustrations — simple, flat, one consistent style.
// No external images needed; zero bandwidth cost.
const StepIllustration: React.FC<{ icon: string }> = ({ icon }) => {
  const common = "w-20 h-20 text-emerald-400";

  if (icon === 'bolt') return (
    <svg className={common} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="rgba(74,222,128,0.08)" stroke="rgba(74,222,128,0.2)" strokeWidth="1.5"/>
      <path d="M46 14L28 44h16L30 70l26-34H40L46 14Z" fill="#4ADE80" opacity="0.9"/>
    </svg>
  );
  if (icon === 'tree') return (
    <svg className={common} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="rgba(74,222,128,0.08)" stroke="rgba(74,222,128,0.2)" strokeWidth="1.5"/>
      <path d="M40 14L24 38h10L28 56h8v10h8V56h8L46 38h10L40 14Z" fill="#4ADE80" opacity="0.9"/>
    </svg>
  );
  // droplet / water
  return (
    <svg className={common} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="rgba(74,222,128,0.08)" stroke="rgba(74,222,128,0.2)" strokeWidth="1.5"/>
      <path d="M40 16C40 16 22 36 22 48a18 18 0 0 0 36 0C58 36 40 16 40 16Z" fill="#4ADE80" opacity="0.9"/>
    </svg>
  );
};

export const ImpactSection: React.FC<ImpactSectionProps> = ({
  steps,
  onHealUpdate,
}) => {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  /*
   * IntersectionObserver drives the heal progress.
   * When a step enters view at 40% threshold, we advance uHeal
   * to that step's healTarget value.
   */
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    steps.forEach((step, i) => {
      const el = stepRefs.current[i];
      if (!el) return;
      const obs = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            onHealUpdate(step.healTarget);
          }
        },
        { threshold: 0.40 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [steps, onHealUpdate]);

  return (
    <section
      id="impact"
      className="relative bg-transparent"
    >
      {/* Soft radial glow centre */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px]
        bg-emerald-900/12 rounded-full filter blur-[90px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 sm:px-8">
        {/* Section header */}
        <SectionFade>
          <div className="text-center pt-24 pb-16">
            <span className="inline-block text-xs font-semibold text-emerald-400 uppercase tracking-widest
              border border-emerald-500/30 bg-emerald-500/10 rounded-full px-4 py-1.5 mb-5">
              Impact
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-4 tracking-tight">
              Three Levers to&nbsp;
              <span className="text-[#4ADE80]">Heal the Planet</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              Scroll through each domain — watch the Earth respond above.
            </p>
          </div>
        </SectionFade>

        {/* Step cards */}
        <div className="space-y-20 pb-28">
          {steps.map((step, i) => {
            const isEven = i % 2 === 0;
            return (
              <div
                key={step.id}
                ref={el => { stepRefs.current[i] = el; }}
              >
                <SectionFade>
                  <div className={`flex flex-col ${isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'} items-center gap-10`}>
                    {/* Illustration */}
                    <div className="flex-shrink-0 flex items-center justify-center
                      w-36 h-36 rounded-3xl border border-white/10
                      bg-slate-900/50 backdrop-blur-xl">
                      <StepIllustration icon={step.icon} />
                    </div>

                    {/* Text + stat */}
                    <div className="flex-1">
                      <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2 block">
                        Step {step.step} of 3
                      </span>
                      <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white mb-3 tracking-tight">
                        {step.heading}
                      </h3>
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                        {step.body}
                      </p>

                      {/* Compact stat card */}
                      <div className="max-w-xs">
                        <StatCard
                          title={step.statLabel}
                          value={step.value}
                          prefix={step.prefix}
                          suffix={step.suffix}
                          label={step.statLabel}
                          changeType={step.changeType as 'positive' | 'negative'}
                          source={step.source}
                          sourceUrl={step.sourceUrl}
                          year={step.year}
                          compact
                        />
                      </div>
                    </div>
                  </div>
                </SectionFade>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

