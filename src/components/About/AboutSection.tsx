import React from 'react';
import { SectionFade } from '../Common/SectionFade';

/**
 * AboutSection
 *
 * Minimal centered section explaining the problem.
 * Three-step "Reduce · Restore · Renew" row gives judges a
 * clear narrative hook that ties to the Earth healing animation.
 */
export const AboutSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Reduce',
      body: 'Cut fossil fuel consumption and industrial emissions across energy, transport, and manufacturing.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Restore',
      body: "Regenerate forests, wetlands and ocean ecosystems \u2014 nature's most powerful carbon sinks.",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-3A4.5 4.5 0 0 0 10.5 20c2.49 0 4.5-2.01 4.5-4.5 0-1.44-.68-2.72-1.73-3.56C15.77 11.41 17 8 17 8z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Renew',
      body: 'Build circular economies: renewable energy, zero-waste design, and sustainable cities for everyone.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="1 4 1 10 7 10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <section
      id="about"
      className="relative bg-transparent py-24 sm:py-32"
    >
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <SectionFade>
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold text-emerald-400 uppercase tracking-widest
              border border-emerald-500/30 bg-emerald-500/10 rounded-full px-4 py-1.5 mb-5">
              About
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-5 tracking-tight">
              The Planet Is&nbsp;
              <span className="text-[#4ADE80]">Asking for Help</span>
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              The last decade was the hottest in recorded history. CO₂ levels are at a 3-million-year peak.
              Forests shrink by 10 million hectares a year. The good news: every fraction of a degree we
              prevent matters, and the solutions already exist.
            </p>
          </div>
        </SectionFade>

        {/* Three-step row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {steps.map((step, i) => (
            <SectionFade key={step.num} delay={i * 120}>
              <div className="relative p-5 rounded-2xl border border-white/10
                bg-slate-900/50 backdrop-blur-xl hover:border-emerald-500/25
                transition-all duration-500 group overflow-hidden">
                {/* Background number watermark */}
                <span className="absolute top-3 right-4 font-display font-extrabold text-6xl
                  text-white/[0.03] select-none pointer-events-none leading-none">
                  {step.num}
                </span>

                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/25
                  flex items-center justify-center text-emerald-400 mb-4
                  group-hover:bg-emerald-500/25 transition-colors">
                  {step.icon}
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.body}</p>
              </div>
            </SectionFade>
          ))}
        </div>
      </div>
    </section>
  );
};
