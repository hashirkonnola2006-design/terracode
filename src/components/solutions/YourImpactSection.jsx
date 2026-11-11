import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Check, RotateCcw, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { musicEngine } from '../../audio/musicEngine';

// 6 Questions mapped to the Six Pillars
export const IMPACT_QUESTIONS = [
  {
    id: 'travel',
    pillar: 'Clean Energy / Reduce',
    question: 'How do you usually get to school or work?',
    options: [
      { label: 'WALK / BIKE / SKATE', score: 100, tag: 'Zero Emission' },
      { label: 'BUS / METRO / TRAIN', score: 85, tag: 'Public Transit' },
      { label: 'CARPOOL / RIDESHARE', score: 55, tag: 'Shared Ride' },
      { label: 'SOLO GAS VEHICLE', score: 20, tag: 'Fossil Transit' },
    ],
  },
  {
    id: 'diet',
    pillar: 'Restore Nature / Compost',
    question: 'How frequently do you eat red meat?',
    options: [
      { label: 'RARELY / VEG / VEGAN', score: 100, tag: 'Low Impact' },
      { label: '1–2 TIMES A WEEK', score: 75, tag: 'Moderate' },
      { label: '3–5 TIMES A WEEK', score: 45, tag: 'Frequent' },
      { label: 'DAILY / EVERY MEAL', score: 20, tag: 'Heavy Impact' },
    ],
  },
  {
    id: 'reusable',
    pillar: 'Reuse / Reduce',
    question: 'Do you carry a reusable water bottle or cup?',
    options: [
      { label: 'ALWAYS IN MY BAG', score: 100, tag: 'Zero Single-Use' },
      { label: 'MOST DAYS', score: 75, tag: 'Regular Habit' },
      { label: 'OCCASIONALLY', score: 40, tag: 'Infrequent' },
      { label: 'RARELY / BUY PLASTIC', score: 15, tag: 'Single-Use' },
    ],
  },
  {
    id: 'foodwaste',
    pillar: 'Compost',
    question: 'What happens to your vegetable scraps and food leftovers?',
    options: [
      { label: 'COMPOSTED / GARDEN', score: 100, tag: 'Zero Landfill Methane' },
      { label: 'SHARED ORGANICS BIN', score: 85, tag: 'Municipal Compost' },
      { label: 'STANDARD TRASH BIN', score: 25, tag: 'Landfill Rot' },
    ],
  },
  {
    id: 'tech',
    pillar: 'Reuse / Recycle',
    question: 'How long do you use your smartphone and electronics?',
    options: [
      { label: '4+ YEARS / REFURBISHED', score: 100, tag: 'Extended Loop' },
      { label: '2–3 YEARS', score: 70, tag: 'Standard Cycle' },
      { label: '1–2 YEARS / UPGRADE FAST', score: 25, tag: 'High E-Waste' },
    ],
  },
  {
    id: 'power',
    pillar: 'Clean Energy',
    question: 'How do you manage dorm or home electrical appliances?',
    options: [
      { label: 'SURGE STRIP SHUTOFF & ECO TEMP', score: 100, tag: 'Zero Idle Power' },
      { label: 'CONSCIOUS SHUTDOWN EFFORT', score: 75, tag: 'Active Care' },
      { label: 'ALWAYS PLUGGED / HIGH HVAC', score: 30, tag: 'Continuous Load' },
    ],
  },
];

// Concrete 7-Day Challenge Actions
export const PLEDGE_OPTIONS = [
  {
    id: 'p1',
    pillar: 'Reduce & Reuse',
    text: 'Pack a reusable bottle and shopping tote for 7 straight days.',
  },
  {
    id: 'p2',
    pillar: 'Compost',
    text: 'Freeze food scraps and coffee grounds for weekly compost diversion.',
  },
  {
    id: 'p3',
    pillar: 'Clean Energy',
    text: 'Switch power strips completely off overnight to stop phantom draw.',
  },
  {
    id: 'p4',
    pillar: 'Clean Transit',
    text: 'Replace two solo drives with walking, cycling, or public transit.',
  },
  {
    id: 'p5',
    pillar: 'Recycle',
    text: 'Sort, wash, and crush 100% of cans and containers before binning.',
  },
];

export const YourImpactSection = ({ onScrollToPlay }) => {
  // Pre-seed default answers for instant awareness feedback
  const [answers, setAnswers] = useState({
    travel: 1, // Public Transit (85)
    diet: 1,   // 1-2 times a week (75)
    reusable: 0, // Always (100)
    foodwaste: 2, // Standard trash (25)
    tech: 0,   // 4+ years (100)
    power: 1,  // Conscious effort (75)
  });

  // 7-day challenge streak state persisted to localStorage
  const [selectedPledges, setSelectedPledges] = useState(['p1', 'p2']);
  const [checkedDays, setCheckedDays] = useState([true, true, false, false, false, false, false]);

  const hasPlayedResultChime = useRef(false);

  // Load streak from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('terraheal_pledge_streak');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.days)) setCheckedDays(parsed.days);
        if (Array.isArray(parsed.pledges)) setSelectedPledges(parsed.pledges);
      }
    } catch (_) {}
  }, []);

  // Save streak to localStorage on change
  const saveStreak = (newDays, newPledges) => {
    try {
      localStorage.setItem(
        'terraheal_pledge_streak',
        JSON.stringify({ days: newDays, pledges: newPledges, updated: Date.now() })
      );
    } catch (_) {}
  };

  // Calculate awareness score (weighted equally across the 6 habit areas)
  const { score, gap1, gap2 } = useMemo(() => {
    const scores = IMPACT_QUESTIONS.map((q) => {
      const optIdx = answers[q.id] ?? 0;
      const opt = q.options[optIdx] || q.options[0];
      return { id: q.id, pillar: q.pillar, score: opt.score };
    });

    const total = scores.reduce((sum, item) => sum + item.score, 0);
    const avgScore = Math.round(total / scores.length);

    // Sort to find the two lowest scoring areas (highest leverage gaps)
    const sorted = [...scores].sort((a, b) => a.score - b.score);
    return {
      score: avgScore,
      gap1: sorted[0]?.pillar || 'Single-Use Reduction',
      gap2: sorted[1]?.pillar || 'Food Waste Composting',
    };
  }, [answers]);

  useEffect(() => {
    if (!hasPlayedResultChime.current) {
      hasPlayedResultChime.current = true;
    }
  }, [score]);

  const handleSelectOption = (questionId, optionIndex) => {
    musicEngine.playClick();
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const toggleDay = (dayIdx) => {
    musicEngine.playClick();
    const updated = [...checkedDays];
    updated[dayIdx] = !updated[dayIdx];
    setCheckedDays(updated);
    saveStreak(updated, selectedPledges);
  };

  const togglePledge = (pledgeId) => {
    musicEngine.playClick();
    let updated;
    if (selectedPledges.includes(pledgeId)) {
      if (selectedPledges.length === 1) return; // Keep at least one
      updated = selectedPledges.filter((id) => id !== pledgeId);
    } else {
      if (selectedPledges.length >= 3) return; // Max 3
      updated = [...selectedPledges, pledgeId];
    }
    setSelectedPledges(updated);
    saveStreak(checkedDays, updated);
  };

  const completedDaysCount = checkedDays.filter(Boolean).length;

  return (
    <section
      id="impact"
      className="relative z-10 w-full min-h-screen py-24 sm:py-32 scroll-mt-20 overflow-hidden"
    >
      {/* Soft Dark Scrim behind text column — ensures globe never clashes with reading */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-r from-[#050505] via-[#050505]/95 via-60% to-[#050505]/40" />

      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        {/* Section Header: Left-aligned editorial headline */}
        <div className="max-w-2xl space-y-4 mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#14e6c0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14e6c0] animate-pulse" />
            <span>03 • Personal Alignment Check</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.06]">
            How much of this is already you?
          </h2>

          <p className="font-body font-light text-base sm:text-lg text-white/70 leading-relaxed">
            Six quick questions across everyday habits. Check where your daily routine
            already protects the planet and where the highest-leverage gaps remain.
          </p>
        </div>

        {/* Question Stack with Hairline Dividers (Left Column / Editorial Flow) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* ── LEFT: 6 Questions (Segmented Controls) ── */}
          <div className="lg:col-span-7 space-y-10 divide-y divide-white/10 border-t border-b border-white/10 py-6">
            {IMPACT_QUESTIONS.map((q, qIdx) => {
              const selectedIdx = answers[q.id] ?? 0;

              return (
                <div key={q.id} className="pt-8 first:pt-0 space-y-4">
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs text-white/40 tracking-wider">
                      QUESTION 0{qIdx + 1} • {q.pillar.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg sm:text-xl text-white leading-snug">
                    {q.question}
                  </h3>

                  {/* Custom Segmented Control with Pixel Font Labels */}
                  <div
                    role="radiogroup"
                    aria-label={q.question}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1"
                  >
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedIdx === optIdx;

                      return (
                        <button
                          key={opt.label}
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          onMouseEnter={() => musicEngine.playHover()}
                          className={`p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-1 group ${
                            isSelected
                              ? 'border-[#14e6c0] bg-[#14e6c0]/10 shadow-[0_0_12px_rgba(20,230,192,0.15)]'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-pixel text-[11px] sm:text-xs tracking-wider uppercase transition-colors ${
                                isSelected ? 'text-[#14e6c0] font-bold' : 'text-white/80 group-hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#14e6c0] shrink-0" />
                            )}
                          </div>

                          <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                            {opt.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── RIGHT: Live Awareness Score & 7-Day Challenge Pledge ── */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-8">
            {/* Live Result Card */}
            <div className="p-6 rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl shadow-xl space-y-6">
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#14e6c0] block">
                  Your Current Alignment
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="font-display font-extrabold text-5xl sm:text-6xl text-white tracking-tight">
                    {score}%
                  </span>
                  <span className="font-mono text-xs text-white/50">
                    of the six pillars covered
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#f97316] via-[#14e6c0] to-[#5df7d9] transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(8, score)}%` }}
                />
              </div>

              {/* Plain-Language Findings */}
              <div className="space-y-2 pt-2 border-t border-white/10 text-xs sm:text-sm font-body text-white/80 leading-relaxed">
                <p>
                  Your habits strongly reinforce personal circularity. Your two biggest opportunities
                  to accelerate planetary healing:{' '}
                  <span className="text-[#14e6c0] font-medium">{gap1}</span> and{' '}
                  <span className="text-[#14e6c0] font-medium">{gap2}</span>.
                </p>
                <p className="font-mono text-[10px] text-white/40 pt-1">
                  Awareness score: Unweighted average of 6 habit areas. Not a certified carbon offset claim.
                </p>
              </div>
            </div>

            {/* 7-Day Challenge Pledge Box */}
            <div className="p-6 rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#14e6c0] block">
                    7-Day Action Challenge
                  </span>
                  <h4 className="font-display font-bold text-lg text-white">
                    Pick 1 to 3 micro-habits
                  </h4>
                </div>
                <span className="font-pixel text-xs text-[#14e6c0] border border-[#14e6c0]/30 px-2 py-0.5 rounded bg-[#14e6c0]/10">
                  DAY {completedDaysCount} / 7
                </span>
              </div>

              {/* Action Choices */}
              <div className="space-y-2">
                {PLEDGE_OPTIONS.map((item) => {
                  const isChecked = selectedPledges.includes(item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => togglePledge(item.id)}
                      onMouseEnter={() => musicEngine.playHover()}
                      className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors flex items-start gap-2.5 cursor-pointer ${
                        isChecked
                          ? 'border-[#14e6c0]/50 bg-[#14e6c0]/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border ${
                          isChecked ? 'border-[#14e6c0] bg-[#14e6c0] text-black' : 'border-white/30'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#14e6c0] block">
                          {item.pillar}
                        </span>
                        <span className="font-body leading-tight block">{item.text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 7-Day Streak Checkbox Tracker */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/60 uppercase">Check off your 7-day streak</span>
                  <button
                    onClick={() => {
                      musicEngine.playClick();
                      const reset = [false, false, false, false, false, false, false];
                      setCheckedDays(reset);
                      saveStreak(reset, selectedPledges);
                    }}
                    className="text-white/40 hover:text-white text-[10px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {checkedDays.map((isDone, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleDay(idx)}
                      onMouseEnter={() => musicEngine.playHover()}
                      className={`py-2 rounded border text-center transition-all cursor-pointer font-pixel text-xs ${
                        isDone
                          ? 'border-[#14e6c0] bg-[#14e6c0] text-black font-bold shadow-[0_0_8px_rgba(20,230,192,0.3)]'
                          : 'border-white/10 bg-white/5 text-white/50 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      D{idx + 1}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#14e6c0]" />
                  <span>Saved to your browser only. Nothing is sent anywhere.</span>
                </div>
              </div>

              {/* Primary Call to Action Button: Smooth scroll to Play Games */}
              <button
                onClick={() => {
                  musicEngine.playSuccess();
                  if (onScrollToPlay) onScrollToPlay();
                }}
                onMouseEnter={() => musicEngine.playHover()}
                className="w-full py-3.5 rounded-full bg-[#14e6c0] hover:bg-[#5df7d9] text-black font-display font-extrabold text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(20,230,192,0.35)] hover:shadow-[0_0_28px_rgba(20,230,192,0.55)] flex items-center justify-center gap-2 group"
              >
                <span>Now play it out</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
