import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { navigateWithTransition } from '../../utils/navigation';
import { musicEngine } from '../../audio/musicEngine';
import { ArrowRight } from 'lucide-react';

export const PlaySection = () => {
  const navigate = useNavigate();
  const cleanup = useGameStore((s) => s.cleanup);
  const quiz = useGameStore((s) => s.quiz);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Games configuration following minimal design guidelines
  const games = [
    {
      id: 'clean',
      index: '01',
      name: 'Cleanup Mission',
      desc: 'Clear debris from orbit, ocean and land.',
      data: `${cleanup?.health || 0}%`,
      action: cleanup?.completed
        ? 'Play again'
        : (cleanup?.health || 0) > 0
        ? 'Continue'
        : 'Start mission',
      path: '/clean',
      locked: false,
    },
    {
      id: 'quiz',
      index: '02',
      name: 'Zero-Waste Quiz',
      desc: '10 questions on recycling, compost and waste.',
      data: quiz?.bestScore > 0 ? `${quiz.bestScore} / 10` : (quiz?.completed ? '10 / 10' : '0 / 10'),
      action: quiz?.completed
        ? 'Retake'
        : (quiz?.bestScore || 0) > 0
        ? 'Improve score'
        : 'Start quiz',
      path: '/quiz',
      locked: false,
    },
    {
      id: 'game3',
      index: '03',
      name: 'Circular City',
      desc: "Balance a city's energy and waste.",
      data: '—',
      action: 'In development',
      path: null,
      locked: true,
    },
  ];

  const handleLaunch = (game) => {
    if (game.locked || !game.path) return;
    musicEngine.playClick();
    navigateWithTransition(game.path, navigate);
  };

  return (
    <section
      id="play"
      className="relative z-10 w-full pt-28 sm:pt-36 pb-28 sm:pb-36 scroll-mt-20 overflow-hidden"
    >
      {/* Soft dark gradient behind content — guarantees text never sits directly on bright city lights or lava */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-r from-[#050505] via-[#050505]/95 to-transparent sm:w-3/4" />

      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="max-w-3xl">
          {/* Section Header: Minimal, left-aligned, display font + one quiet grey line */}
          <div className="space-y-3 mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#14e6c0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14e6c0]" />
              <span>03 • Interactive Simulations</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-[1.06]">
              Play to heal the planet.
            </h2>
            <p className="font-body font-light text-base text-white/60">
              Two games. Your progress shows up on the planet.
            </p>
          </div>

          {/* Minimal 3-Row List separated by Hairline Dividers */}
          <div className="w-full border-t border-white/10 divide-y divide-white/10">
            {games.map((game, idx) => {
              if (game.locked) {
                return (
                  <div
                    key={game.id}
                    className="w-full py-7 sm:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-8 opacity-40 select-none cursor-default"
                    aria-disabled="true"
                    style={
                      prefersReducedMotion
                        ? undefined
                        : {
                            animation: 'minimalRowReveal 400ms ease-out both',
                            animationDelay: `${idx * 80}ms`,
                          }
                    }
                  >
                    {/* Left / Middle: Index, Name, One-line Desc */}
                    <div className="flex items-start md:items-center gap-4 sm:gap-8 min-w-0">
                      <span className="font-pixel text-xs text-white/40 pt-1 md:pt-0 shrink-0">
                        {game.index}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight">
                          {game.name}
                        </h3>
                        <p className="font-body text-xs sm:text-sm text-white/50 mt-0.5">
                          {game.desc}
                        </p>
                      </div>
                    </div>

                    {/* Right: Data + Locked Text */}
                    <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-10 pl-8 md:pl-0 pt-2 md:pt-0 shrink-0">
                      <span className="font-pixel text-xs sm:text-sm text-white/50 tracking-wider">
                        {game.data}
                      </span>
                      <span className="font-label text-xs uppercase tracking-[0.16em] text-white/40">
                        {game.action}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => handleLaunch(game)}
                  onMouseEnter={() => musicEngine.playHover()}
                  className="group w-full py-7 sm:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-8 text-left transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#14e6c0] focus-visible:ring-offset-4 focus-visible:ring-offset-[#050505] rounded-none hover:border-white/25"
                  style={
                    prefersReducedMotion
                      ? undefined
                      : {
                          animation: 'minimalRowReveal 400ms ease-out both',
                          animationDelay: `${idx * 80}ms`,
                        }
                  }
                >
                  {/* Left / Middle: Index, Name, One-line Desc */}
                  <div className="flex items-start md:items-center gap-4 sm:gap-8 min-w-0 transition-transform duration-200 ease-out group-hover:translate-x-1.5 group-focus-visible:translate-x-1.5">
                    <span className="font-pixel text-xs text-white/40 group-hover:text-[#14e6c0] group-focus-visible:text-[#14e6c0] transition-colors pt-1 md:pt-0 shrink-0">
                      {game.index}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight group-hover:text-white transition-colors">
                        {game.name}
                      </h3>
                      <p className="font-body text-xs sm:text-sm text-white/50 mt-0.5">
                        {game.desc}
                      </p>
                    </div>
                  </div>

                  {/* Right: Data + Plain Text Action with Sliding Arrow */}
                  <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-10 pl-8 md:pl-0 pt-2 md:pt-0 shrink-0">
                    <span className="font-pixel text-xs sm:text-sm text-white/70 tracking-wider">
                      {game.data}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-label uppercase text-xs tracking-[0.16em] text-white/80 group-hover:text-[#14e6c0] group-focus-visible:text-[#14e6c0] group-hover:underline group-focus-visible:underline underline-offset-4 decoration-[#14e6c0] transition-colors">
                      <span>{game.action}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlaySection;

