import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MousePointerClick, Move, CheckSquare, X, ArrowRight } from 'lucide-react';

export const Tutorial = () => {
  const tutorialDismissed = useGameStore((s) => s.tutorialDismissed);
  const dismissTutorial = useGameStore((s) => s.dismissTutorial);

  const [step, setStep] = useState(0);

  if (tutorialDismissed) return null;

  const steps = [
    {
      title: 'Tap to Clean Orbital Debris',
      desc: 'Tap or click floating bottles, cans, bags and crates orbiting Earth. Collect quickly to build your score combo.',
      icon: MousePointerClick,
    },
    {
      title: 'Drag to Rotate the Globe',
      desc: 'Drag anywhere on screen to spin the planet and locate hidden smog sources, dry forests, and ocean plastic patches.',
      icon: Move,
    },
    {
      title: 'Complete All 4 Missions',
      desc: 'Track your global cleanliness meter in the top bar. Restore clean energy, forests, and oceans to reach 100% healing.',
      icon: CheckSquare,
    },
  ];

  const current = steps[step];
  const Icon = current.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      dismissTutorial();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none pointer-events-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm p-6 rounded-3xl bg-slate-900/95 border border-slate-700/70 shadow-2xl text-center">
        {/* Dismiss Button */}
        <button
          onClick={dismissTutorial}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Skip tutorial"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Indicator */}
        <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase block mb-3">
          How to Play ({step + 1} of 3)
        </span>

        {/* Step Icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-md">
          <Icon className="w-7 h-7" />
        </div>

        <h3 className="text-base font-bold text-white mb-2">
          {current.title}
        </h3>

        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          {current.desc}
        </p>

        {/* Step Dots */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === step ? 'w-6 bg-emerald-400' : 'w-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-1.5"
        >
          {step < steps.length - 1 ? (
            <>
              Next Step <ArrowRight className="w-3.5 h-3.5" />
            </>
          ) : (
            'Start Cleaning'
          )}
        </button>
      </div>
    </div>
  );
};

export default Tutorial;

