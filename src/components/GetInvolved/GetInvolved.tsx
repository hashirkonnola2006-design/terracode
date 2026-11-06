import React, { useState } from 'react';
import { SectionFade } from '../Common/SectionFade';

interface ActionCard {
  id:    string;
  icon:  string;
  title: string;
  body:  string;
  cta:   string;
  link:  string;
}

interface GetInvolvedProps {
  cards: ActionCard[];
}

// Icon components (inline SVG, flat line style)
const ActionIcon: React.FC<{ name: string }> = ({ name }) => {
  const cls = "w-6 h-6";
  if (name === 'leaf') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-3A4.5 4.5 0 0 0 10.5 20c2.49 0 4.5-2.01 4.5-4.5 0-1.44-.68-2.72-1.73-3.56C15.77 11.41 17 8 17 8z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (name === 'bolt') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return ( // recycle
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12V9a4 4 0 0 1 4-4h8M20 12v3a4 4 0 0 1-4 4H8M1 9l3-3 3 3M23 15l-3 3-3-3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

/**
 * GetInvolved
 *
 * Three action cards with a "Take Action" button each.
 * Frontend only: clicking shows an inline thank-you message.
 * No form submission or backend required.
 */
export const GetInvolved: React.FC<GetInvolvedProps> = ({ cards }) => {
  const [thanked, setThanked] = useState<Record<string, boolean>>({});

  const handleAction = (id: string, link: string) => {
    if (link !== '#') {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      setThanked(prev => ({ ...prev, [id]: true }));
    }
  };

  return (
    <section
      id="get-involved"
      className="relative bg-gradient-to-b from-[#030712] to-[#02070e]
        border-t border-white/5 py-24 sm:py-32"
    >
      {/* Soft top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-32
        bg-emerald-900/15 rounded-full filter blur-[90px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 sm:px-8">
        <SectionFade>
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold text-emerald-400 uppercase
              tracking-widest border border-emerald-500/30 bg-emerald-500/10
              rounded-full px-4 py-1.5 mb-5">
              Get Involved
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-4 tracking-tight">
              Your Action&nbsp;
              <span className="text-[#4ADE80]">Matters</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              You don't need to do everything — just one thing, consistently, is enough to contribute to systemic change.
            </p>
          </div>
        </SectionFade>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <SectionFade key={card.id} delay={i * 100}>
              <div className="flex flex-col h-full p-6 rounded-2xl border border-white/10
                bg-slate-900/55 backdrop-blur-xl hover:border-emerald-500/25
                transition-all duration-500 group overflow-hidden">

                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/25
                  flex items-center justify-center text-emerald-400 mb-4
                  group-hover:bg-emerald-500/25 transition-colors">
                  <ActionIcon name={card.icon} />
                </div>

                <h3 className="font-display font-bold text-white text-lg mb-2">{card.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-5">{card.body}</p>

                {thanked[card.id] ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Thanks — every action counts!
                  </div>
                ) : (
                  <button
                    onClick={() => handleAction(card.id, card.link)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold
                      border border-emerald-500/35 text-emerald-300
                      bg-emerald-500/10 hover:bg-emerald-500/20
                      hover:border-emerald-400/60 hover:text-emerald-200
                      transition-all duration-300"
                  >
                    {card.cta}
                  </button>
                )}
              </div>
            </SectionFade>
          ))}
        </div>
      </div>
    </section>
  );
};

