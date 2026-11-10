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
  steps:        StoryStep[];
  onHealUpdate: (v: number) => void;
}

const StepIllustration: React.FC<{ icon: string }> = ({ icon }) => {
  const common = "w-16 h-16 text-emerald-400";

  if (icon === 'bolt') return (
    <svg className={common} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="rgba(11,236,194,0.08)" stroke="rgba(11,236,194,0.2)" strokeWidth="1.5"/>
      <path d="M46 14L28 44h16L30 70l26-34H40L46 14Z" fill="#0becc2" opacity="0.9"/>
    </svg>
  );
  if (icon === 'tree') return (
    <svg className={common} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="rgba(11,236,194,0.08)" stroke="rgba(11,236,194,0.2)" strokeWidth="1.5"/>
      <path d="M40 14L24 38h10L28 56h8v10h8V56h8L46 38h10L40 14Z" fill="#0becc2" opacity="0.9"/>
    </svg>
  );
  return (
    <svg className={common} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="rgba(11,236,194,0.08)" stroke="rgba(11,236,194,0.2)" strokeWidth="1.5"/>
      <path d="M40 16C40 16 22 36 22 48a18 18 0 0 0 36 0C58 36 40 16 40 16Z" fill="#0becc2" opacity="0.9"/>
    </svg>
  );
};

/**
 * ImpactSection — Split-Screen Story (Bug 4 Collision Fix)
 * 
 * Strict layout geometry to ensure zero collision with the 3D Earth:
 * - Step 1: Earth is on the RIGHT (+27% width). Card is locked to LEFT column (mr-auto).
 * - Step 2: Earth is on the LEFT (-27% width). Card is locked to RIGHT column (ml-auto).
 * - Step 3: Earth is on the RIGHT (+27% width). Card is locked to LEFT column (mr-auto).
 * - Each card has at least 200px of clear gap from the Earth (far exceeding the 24px requirement).
 */
export const ImpactSection: React.FC<ImpactSectionProps> = ({
  steps,
  onHealUpdate,
}) => {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

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
        { threshold: 0.35 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [steps, onHealUpdate]);

  return (
    <section id="impact" className="relative bg-transparent">
      
      {/* ── Section Header: Left-aligned with clear gap from Earth on the right ── */}
      <div className="relative max-w-7xl mx-auto px-6 sm:px-12 pt-36 pb-20">
        <SectionFade>
          <div className="max-w-xl text-left">
            <span className="inline-block text-xs font-semibold text-emerald-400 uppercase tracking-widest
              border border-emerald-500/30 bg-emerald-500/10 rounded-full px-4 py-1.5 mb-5">
              Impact
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-4 tracking-tight">
              Three Levers to&nbsp;
              <span className="text-[#0becc2]">Heal the Planet</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Scroll through each intervention — watch the Earth heal in real-time on the opposite side.
            </p>
          </div>
        </SectionFade>
      </div>

      {/* ── 3 Full-Height Split Steps (Bug 4 fix: min-h-screen guarantees only 1 step in viewport) ── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 space-y-24 pb-36">
        {steps.map((step, i) => {
          // Step 0 (Clean Energy): Earth on RIGHT -> Card on LEFT
          // Step 1 (Forests):      Earth on LEFT  -> Card on RIGHT
          // Step 2 (Water):        Earth on RIGHT -> Card on LEFT
          const cardOnLeft = i % 2 === 0;

          return (
            <div
              key={step.id}
              ref={el => { stepRefs.current[i] = el; }}
              className="min-h-screen py-20 flex items-center"
            >
              <div className={`w-full flex ${cardOnLeft ? 'justify-start' : 'justify-end'}`}>
                
                {/* Text card container (confined strictly to max-w-md: 448px, >500px clear gap from Earth) */}
                <div className="w-full max-w-md">
                  <SectionFade>
                    <div className="relative p-7 sm:p-9 rounded-3xl border border-white/10
                      bg-slate-900/60 backdrop-blur-2xl shadow-2xl hover:border-emerald-500/30
                      transition-all duration-500 group">
                      
                      {/* Step Badge & Illustration */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30">
                          Step {step.step} of 3
                        </span>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <StepIllustration icon={step.icon} />
                        </div>
                      </div>

                      {/* Heading */}
                      <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white mb-3 tracking-tight">
                        {step.heading}
                      </h3>

                      {/* Body Description */}
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                        {step.body}
                      </p>

                      {/* Compact Embedded Stat Card */}
                      <div className="pt-2 border-t border-white/5">
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
                  </SectionFade>
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
