import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { EarthBackground } from '../three/EarthBackground';
import { quizHealMask } from '../three/HealMask';
import {
  Leaf,
  ArrowLeft,
  Volume2,
  VolumeX,
  Zap,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Globe2,
  Share2,
} from 'lucide-react';

export const Quiz = () => {
  const navigate = useNavigate();

  const quiz = useGameStore((s) => s.quiz);
  const answerQuizQuestion = useGameStore((s) => s.answerQuizQuestion);
  const nextQuizQuestion = useGameStore((s) => s.nextQuizQuestion);
  const retakeQuiz = useGameStore((s) => s.retakeQuiz);

  const muted = useGameStore((s) => s.muted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const liteMode = useGameStore((s) => s.liteMode);
  const toggleLiteMode = useGameStore((s) => s.toggleLiteMode);

  // Restore quiz heal mask on mount
  useEffect(() => {
    if (quiz.healRegions && quiz.healRegions.length > 0) {
      quizHealMask.restoreRegions(quiz.healRegions);
    } else if (quiz.health >= 100) {
      quizHealMask.fill();
    } else {
      quizHealMask.clear();
    }
  }, []);

  // Screen state: 'intro' | 'question' | 'results'
  const [screen, setScreen] = useState(() => {
    if (quiz.completed) return 'results';
    if (Object.keys(quiz.answers || {}).length > 0) return 'question';
    return 'intro';
  });

  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [floatingBonus, setFloatingBonus] = useState(false);
  const [copied, setCopied] = useState(false);

  const questions = quiz.shuffledQuestions || [];
  const currentIndex = Math.min(quiz.currentQuestion, Math.max(0, questions.length - 1));
  const currentQ = questions[currentIndex] || questions[0];

  // If question was already answered in persisted state
  useEffect(() => {
    if (currentQ && quiz.answers && quiz.answers[currentQ.id]) {
      setSelectedOption(quiz.answers[currentQ.id].chosen);
      setIsAnswered(true);
    } else {
      setSelectedOption(null);
      setIsAnswered(false);
    }
  }, [currentIndex, currentQ, quiz.answers]);

  // Handle Option Click
  const handleSelectOption = (option) => {
    if (isAnswered) return;
    const isCorrect = option === currentQ.correct;
    setSelectedOption(option);
    setIsAnswered(true);

    if (isCorrect) {
      setFloatingBonus(true);
      setTimeout(() => setFloatingBonus(false), 1400);
    }

    answerQuizQuestion(currentQ.id, option, isCorrect, currentQ.region);
  };

  // Keyboard support: 1, 2, 3, 4 to select; Enter for Next
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (screen !== 'question' || !currentQ) return;

      if (!isAnswered) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (currentQ.options && currentQ.options[idx]) {
            handleSelectOption(currentQ.options[idx]);
          }
        }
      } else {
        if (e.key === 'Enter') {
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, isAnswered, currentQ, currentIndex]);

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      nextQuizQuestion();
      setScreen('results');
    } else {
      nextQuizQuestion();
      setIsAnswered(false);
      setSelectedOption(null);
    }
  };

  const handleRetake = () => {
    retakeQuiz();
    setScreen('question');
    setIsAnswered(false);
    setSelectedOption(null);
  };

  const handleShare = async () => {
    const text = `I scored ${quiz.score}/10 on the EcoFuture Zero-Waste Quiz and healed the Earth! Can you beat my score?`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'EcoFuture Zero-Waste Quiz', text, url: window.location.href });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-sky-500 selection:text-black">
      {/* ── Separate 3D Earth Driven ONLY by Quiz Health ── */}
      <EarthBackground
        health={quiz.health}
        healMaskManager={quizHealMask}
        liteMode={liteMode}
        enableOrbit={true}
        customCameraZ={3.2}
        spinRate={0.012}
      />

      {/* ── Soft Scrim Backdrop ── */}
      <div className="fixed inset-0 z-0 bg-radial from-transparent via-[#030712]/60 to-[#030712]/85 pointer-events-none" />

      {/* ── Fixed Top Bar ── */}
      <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 py-3 flex items-center justify-between backdrop-blur-md bg-slate-950/40 border-b border-white/5">
        {/* Left: Back to Hub + Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/solutions#play')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white font-label uppercase text-[11px] font-semibold tracking-wider transition-colors cursor-pointer"
            title="Return to Solutions Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </button>

          <div className="flex items-center gap-1.5 pl-1 sm:pl-2">
            <div className="w-7 h-7 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Leaf className="w-3.5 h-3.5 text-[#38bdf8]" />
            </div>
            <span className="font-display font-extrabold text-sm sm:text-base tracking-tight hidden md:inline">
              Zero-Waste Quiz
            </span>
          </div>
        </div>

        {/* Center: Quiz Earth Health Meter */}
        <div className="flex-1 max-w-xs sm:max-w-sm px-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-label uppercase text-[10px] tracking-wider text-sky-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              Quiz Earth Health
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {quiz.health}%
            </span>
          </div>
          <div className="relative w-full h-2 rounded-full bg-slate-900/80 border border-white/10 p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-500 ease-out"
              style={{ width: `${Math.max(quiz.health, 2)}%` }}
            />
          </div>
        </div>

        {/* Right: Audio & Lite Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className={`p-1.5 sm:p-2 rounded-lg backdrop-blur-md border text-xs transition-colors cursor-pointer ${
              muted
                ? 'bg-slate-900/80 border-white/10 text-slate-500'
                : 'bg-slate-900/80 border-white/20 text-sky-400 hover:bg-white/[0.08]'
            }`}
            title={muted ? 'Unmute' : 'Mute'}
            aria-label="Toggle Sound"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleLiteMode}
            className={`p-1.5 sm:p-2 rounded-lg backdrop-blur-md border text-xs transition-colors cursor-pointer ${
              liteMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08]'
            }`}
            title={liteMode ? 'Switch to Cinematic High-DPI' : 'Switch to Eco/Lite Mode'}
            aria-label="Toggle Lite Mode"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Screen Reader Live Announcement ── */}
      <div className="sr-only" aria-live="polite">
        {isAnswered && (
          selectedOption === currentQ.correct
            ? `Correct! ${currentQ.explanation}`
            : `Incorrect. The correct answer was ${currentQ.correct}. ${currentQ.explanation}`
        )}
      </div>

      {/* ── Floating +10% Healing Badge ── */}
      {floatingBonus && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
          <div className="px-4 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-display font-extrabold text-xs shadow-[0_0_20px_#10b981] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+10% Earth Restored!</span>
          </div>
        </div>
      )}

      {/* ── Main Centered Interactive Card ── */}
      <main className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-24 sm:pt-28 pb-12">
        <div className="w-full max-w-xl">
          {/* ── 1. INTRO SCREEN ── */}
          {screen === 'intro' && (
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/85 backdrop-blur-2xl border border-white/10 shadow-2xl text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 mx-auto flex items-center justify-center text-sky-400">
                <Sparkles className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <span className="font-label uppercase text-[11px] font-semibold tracking-[0.25em] text-sky-400">
                  Zero-Waste Environmental Challenge
                </span>
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                  Zero-Waste Quiz
                </h1>
                <p className="font-body font-light text-sm text-white/70 max-w-md mx-auto leading-relaxed">
                  10 questions on circular recycling, composting, and waste reduction. Every correct answer heals a region of the planet.
                </p>
              </div>

              {quiz.bestScore > 0 && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 max-w-xs mx-auto">
                  <span className="font-label uppercase text-[10px] tracking-wider text-white/50 block">Personal Best</span>
                  <span className="font-mono font-bold text-sky-400 text-base">{quiz.bestScore} / 10</span>
                </div>
              )}

              <button
                onClick={() => setScreen('question')}
                className="btn-aerospace-primary w-full text-xs py-3.5 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Start Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── 2. ACTIVE QUESTION SCREEN ── */}
          {screen === 'question' && currentQ && (
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/85 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-6">
              {/* Question Header & Micro-Progress */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
                <span className="font-label uppercase text-[11px] font-semibold tracking-wider text-sky-400">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="font-mono text-white/60 text-[11px]">
                  Region: {currentQ.region?.name}
                </span>
              </div>

              {/* Question Text */}
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-white leading-snug">
                {currentQ.question}
              </h2>

              {/* 4 Answer Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((option, optIdx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === currentQ.correct;

                  let btnStyle = 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/90';
                  let icon = null;

                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 ring-1 ring-emerald-400/50';
                      icon = <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0" />;
                    } else if (isSelected) {
                      btnStyle = 'bg-red-500/20 border-red-500/60 text-red-200 ring-1 ring-red-400/50';
                      icon = <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
                    } else {
                      btnStyle = 'bg-white/[0.02] border-white/5 text-white/40 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(option)}
                      disabled={isAnswered}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-body transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center font-mono text-[11px] font-semibold text-white/70 shrink-0">
                          {optIdx + 1}
                        </span>
                        <span>{option}</span>
                      </div>
                      {icon}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Card (Appears after answer) */}
              {isAnswered && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-1.5 font-label uppercase text-[10px] tracking-wider font-semibold">
                    {selectedOption === currentQ.correct ? (
                      <span className="text-[#4ade80] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct! Earth Healed +10%
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Correct Answer: {currentQ.correct}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-white/80 leading-relaxed">
                    {currentQ.explanation}
                  </p>

                  <button
                    onClick={handleNext}
                    className="btn-aerospace-primary w-full text-xs py-2.5 mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── 3. RESULTS SCREEN ── */}
          {screen === 'results' && (
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/85 backdrop-blur-2xl border border-white/10 shadow-2xl text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 mx-auto flex items-center justify-center text-sky-400">
                <Globe2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <span className="font-label uppercase text-[11px] font-semibold tracking-[0.25em] text-sky-400">
                  Quiz Completed
                </span>
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                  {quiz.score === 10
                    ? 'Planet Earth Fully Restored!'
                    : quiz.score >= 7
                    ? 'Exceptional Climate Knowledge'
                    : 'Good Effort for the Planet'}
                </h2>
                <p className="font-body font-light text-xs sm:text-sm text-white/70 max-w-md mx-auto leading-relaxed">
                  {quiz.score === 10
                    ? 'You achieved a perfect 10/10 score. Your deep understanding of circular zero-waste systems has fully restored the Earth.'
                    : quiz.score >= 7
                    ? `You scored ${quiz.score}/10, healing ${quiz.health}% of the planet. Your knowledge helps protect critical global ecosystems.`
                    : `You scored ${quiz.score}/10 and healed ${quiz.health}% of the Earth. Retake the quiz to master every zero-waste principle.`}
                </p>
              </div>

              {/* Score Metric Cards */}
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="font-label uppercase text-[10px] tracking-wider text-white/50 block mb-1">
                    Your Score
                  </span>
                  <span className="font-mono font-bold text-xl text-sky-400">
                    {quiz.score} / 10
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="font-label uppercase text-[10px] tracking-wider text-white/50 block mb-1">
                    Earth Restored
                  </span>
                  <span className="font-mono font-bold text-xl text-[#4ade80]">
                    {quiz.health}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleRetake}
                  className="btn-aerospace-primary w-full text-xs py-3 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Quiz (Shuffled)</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => navigate('/solutions#play')}
                    className="py-2.5 px-4 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-label text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Back to Hub
                  </button>
                  <button
                    onClick={() => navigate('/clean')}
                    className="py-2.5 px-4 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-label text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Play Cleanup
                  </button>
                </div>

                <button
                  onClick={handleShare}
                  className="w-full py-2 text-white/60 hover:text-white font-label text-[10px] uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3 h-3" />
                  <span>{copied ? 'Score Link Copied!' : 'Share Score'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Quiz;

