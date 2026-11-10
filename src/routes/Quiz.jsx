import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { EarthBackground } from '../three/EarthBackground';
import { quizHealMask } from '../three/HealMask';
import { sound } from '../utils/audio';
import {
  getQuizResultQuote,
  getQuizProgressLine,
  QUIZ_RESULT_THRESHOLDS,
} from '../config/quizResults';
import {
  downloadQuizCertificate,
  shareQuizCertificate,
} from '../utils/quizCertificate';
import { TerraHealLogo } from '../components/brand/TerraHealLogo';
import {
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
  Download,
  Loader2,
  Check,
} from 'lucide-react';

export const Quiz = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'TerraHeal | Zero-Waste Quiz';
  }, []);

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

  // Keep screen synchronized if quiz rehydrates completed
  useEffect(() => {
    if (quiz.completed) {
      setScreen('results');
    }
  }, [quiz.completed]);

  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [floatingBonus, setFloatingBonus] = useState(false);

  // Certificate generation & sharing state
  const [certName, setCertName] = useState(() => {
    try {
      return localStorage.getItem('terraheal_cert_name') || '';
    } catch (_) {
      return '';
    }
  });
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3800);
  };

  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  // Results screen quotes and progress line
  const [resultQuote, setResultQuote] = useState('');
  const [progressLine, setProgressLine] = useState('');

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

  // Update quotes on entering results
  useEffect(() => {
    if (screen === 'results') {
      const quote = getQuizResultQuote(quiz.health);
      const line = getQuizProgressLine(quiz.health);
      setResultQuote(quote);
      setProgressLine(line);
    }
  }, [screen, quiz.health]);

  // On entering results screen: replay a short healing recap over ~2 seconds
  useEffect(() => {
    if (screen === 'results') {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const regions = quiz.healRegions || [];

      if (prefersReducedMotion || regions.length === 0) {
        if (quiz.health >= 100) {
          quizHealMask.fill();
        } else {
          quizHealMask.restoreRegions(regions);
        }
        return;
      }

      // Replay recap: clear first, then paint each region sequentially
      quizHealMask.clear();
      const delayPerRegion = Math.max(120, Math.min(260, 2000 / Math.max(1, regions.length)));

      const timeouts = regions.map((region, idx) => {
        return setTimeout(() => {
          quizHealMask.paintRegion(region.lat, region.lon, region.radius || 0.15, 1.0);
          if (!muted) {
            sound.playPop(1.0 + idx * 0.08);
          }
          if (idx === regions.length - 1) {
            if (quiz.health >= 100) {
              quizHealMask.fill();
              if (!muted) sound.playMilestone();
            }
          }
        }, (idx + 1) * delayPerRegion);
      });

      return () => {
        timeouts.forEach(clearTimeout);
      };
    }
  }, [screen, quiz.healRegions, quiz.health, muted]);

  // Trigger celebration audio on 100%
  useEffect(() => {
    if (screen === 'results' && quiz.health >= 100) {
      if (!muted) {
        sound.playMilestone();
      }
    }
  }, [screen, quiz.health, muted]);

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

  const handleDownloadCert = async () => {
    if (isGeneratingCert) return;
    setIsGeneratingCert(true);
    try {
      await downloadQuizCertificate({
        score: quiz.score,
        health: quiz.health,
        playerName: certName,
        quote: resultQuote,
        onToast: showToast,
      });
    } catch (err) {
      console.error('Download certificate error:', err);
      showToast('Could not generate certificate. Please try again.');
    } finally {
      setIsGeneratingCert(false);
    }
  };

  const handleShareCert = async () => {
    if (isGeneratingCert) return;
    setIsGeneratingCert(true);
    try {
      await shareQuizCertificate({
        score: quiz.score,
        health: quiz.health,
        playerName: certName,
        quote: resultQuote,
        onToast: showToast,
      });
    } catch (err) {
      console.error('Share certificate error:', err);
      showToast('Could not share certificate. Please try again.');
    } finally {
      setIsGeneratingCert(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-[#0becc2] selection:text-black">
      {/* ── Separate 3D Earth Driven ONLY by Quiz Health (Full Globe View in Results) ── */}
      <EarthBackground
        health={quiz.health}
        healMaskManager={quizHealMask}
        liteMode={liteMode}
        enableOrbit={true}
        customCameraZ={3.2}
        spinRate={0.012}
        isResults={screen === 'results'}
      />

      {/* ── Soft Scrim Backdrop (Fades lighter on results to showcase the Earth) ── */}
      <div
        className={`fixed inset-0 z-0 bg-radial from-transparent via-[#050505]/50 to-[#050505]/80 pointer-events-none transition-opacity duration-700 ${
          screen === 'results' ? 'opacity-40' : 'opacity-100'
        }`}
      />

      {/* ── 100% Celebration Radiant Glow ── */}
      {screen === 'results' && quiz.health >= 100 && (
        <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-radial from-[#0becc2]/15 via-transparent to-transparent animate-pulse" />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border border-[#0becc2]/20"
              style={{
                width: `${340 + i * 160}px`,
                height: `${340 + i * 160}px`,
                animation: `ping ${2.5 + i * 0.8}s cubic-bezier(0, 0, 0.2, 1) infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Fixed Top Bar ── */}
      <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 py-3 flex items-center justify-between backdrop-blur-md bg-slate-950/40 border-b border-white/5 pointer-events-auto">
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

          <TerraHealLogo markSize={26} textClass="text-sm sm:text-base font-bold hidden md:inline" to="/solutions#play" />
        </div>

        {/* Center: Quiz Earth Health Meter */}
        <div className="flex-1 max-w-xs sm:max-w-sm px-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-label uppercase text-[10px] tracking-wider text-[#0becc2] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#0becc2]" />
              Quiz Earth Health
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {quiz.health}%
            </span>
          </div>
          <div className="relative w-full h-2 rounded-full bg-slate-900/80 border border-white/10 p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0becc2] via-[#0ad0ab] to-[#5df7d9] shadow-[0_0_10px_rgba(11,236,194,0.5)] transition-all duration-500 ease-out"
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
        {screen === 'results'
          ? `Quiz Results: You scored ${quiz.score} out of 10. Earth healed: ${quiz.health}%. ${resultQuote}. ${progressLine || ''}`
          : isAnswered
          ? selectedOption === currentQ.correct
            ? `Correct! ${currentQ.explanation}`
            : `Incorrect. The correct answer was ${currentQ.correct}. ${currentQ.explanation}`
          : null}
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

      {/* ═══════════════════════════════════════════════════════════════
          SCREEN LAYOUTS
         ═══════════════════════════════════════════════════════════════ */}

      {/* ── SCREENS 1 & 2: INTRO & ACTIVE QUESTION (Centered Overlay) ── */}
      {screen !== 'results' && (
        <main className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-24 sm:pt-28 pb-12 pointer-events-none">
          <div className="w-full max-w-xl pointer-events-auto">
            {/* 1. INTRO SCREEN */}
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

            {/* 2. ACTIVE QUESTION SCREEN */}
            {screen === 'question' && currentQ && (
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/85 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-6">
                {/* Question Header & Micro-Progress */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
                  <span className="font-label uppercase text-[11px] font-semibold tracking-wider text-[#0becc2]">
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
                        btnStyle = 'bg-[#0becc2]/20 border-[#0becc2] text-white ring-1 ring-[#0becc2]/50';
                        icon = <CheckCircle2 className="w-4 h-4 text-[#0becc2] shrink-0" />;
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
                        className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-body transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0becc2] ${btnStyle}`}
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

                {/* Explanation Card */}
                {isAnswered && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-1.5 font-label uppercase text-[10px] tracking-wider font-semibold">
                      {selectedOption === currentQ.correct ? (
                        <span className="text-[#0becc2] flex items-center gap-1">
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
          </div>
        </main>
      )}

      {/* ── SCREEN 3: RESULTS SCREEN (Side-by-Side on Desktop, Top-Bottom on Mobile — Full Earth Visible) ── */}
      {screen === 'results' && (
        <main className="fixed inset-0 pt-14 sm:pt-16 z-20 flex flex-col md:flex-row pointer-events-none">
          {/* ── Mobile Top / Desktop Right: Earth Area with "Earth healed: X%" Circular Ring HUD ── */}
          <div className="order-1 md:order-2 flex-1 relative flex flex-col justify-start items-end p-3 sm:p-6 pointer-events-none h-[50vh] md:h-full">
            {/* Circular Progress Ring Widget next to Earth */}
            <div className="flex items-center gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-950/75 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto mt-1 mr-1 animate-in fade-in duration-700">
              {/* Circular Progress Ring */}
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 -rotate-90" viewBox="0 0 48 48">
                  {/* Background track */}
                  <circle
                    cx="24"
                    cy="24"
                    r="19"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="3.2"
                    fill="none"
                  />
                  {/* Animated gradient progress stroke */}
                  <circle
                    cx="24"
                    cy="24"
                    r="19"
                    stroke="url(#quizHealRingGradient)"
                    strokeWidth="3.5"
                    strokeDasharray={2 * Math.PI * 19}
                    strokeDashoffset={2 * Math.PI * 19 * (1 - quiz.health / 100)}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="quizHealRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0becc2" />
                      <stop offset="50%" stopColor="#0ad0ab" />
                      <stop offset="100%" stopColor="#5df7d9" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute font-mono font-bold text-[10px] sm:text-xs text-white">
                  {quiz.health}%
                </span>
              </div>

              {/* Label */}
              <div className="text-left">
                <span className="font-label uppercase text-[9px] sm:text-[10px] tracking-wider text-[#0becc2] font-semibold block">
                  Earth Healed
                </span>
                <span className="font-body text-[11px] sm:text-xs text-white/80">
                  {quiz.health === 100 ? '100% Fully Restored' : `${quiz.health}% Restored`}
                </span>
              </div>
            </div>

            {/* Earth Drag Hint Badge (shows player they can drag to rotate) */}
            <div className="mt-auto mb-2 mr-1 hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-white/50 text-[10px] font-label uppercase tracking-wider">
              <span>Drag Earth to rotate</span>
            </div>
          </div>

          {/* ── Mobile Bottom Sheet / Desktop Left Column: Results Card (Never Overlaps Earth) ── */}
          <div className="order-2 md:order-1 w-full md:w-[380px] lg:w-[420px] xl:w-[440px] h-[58vh] sm:h-[54vh] md:h-full p-2 sm:p-5 md:p-8 flex flex-col justify-end md:justify-center z-30 pointer-events-auto">
            <div className="w-full max-h-full overflow-y-auto p-3.5 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl bg-slate-950/90 backdrop-blur-2xl border border-white/10 shadow-2xl text-center space-y-2.5 sm:space-y-4 animate-in slide-in-from-bottom md:slide-in-from-left duration-500">
              {/* Icon */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-[#0becc2]/10 border border-[#0becc2]/30 mx-auto flex items-center justify-center text-[#0becc2] shrink-0">
                <Globe2 className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>

              {/* Title & Tier Quote */}
              <div className="space-y-1 sm:space-y-1.5">
                <span className="font-label uppercase text-[9px] sm:text-[11px] font-semibold tracking-[0.25em] text-[#0becc2]">
                  Quiz Completed
                </span>
                <h2 className="font-display font-extrabold text-lg sm:text-2xl text-white leading-tight">
                  {quiz.score === 10
                    ? 'Planet Earth Fully Restored!'
                    : quiz.health >= QUIZ_RESULT_THRESHOLDS.GOOD
                    ? 'Exceptional Climate Knowledge'
                    : quiz.health >= QUIZ_RESULT_THRESHOLDS.LOW
                    ? 'Good Effort for the Planet'
                    : 'The Planet Needs You'}
                </h2>

                {/* Motivating Quote Message */}
                <p className="font-body font-light text-xs sm:text-sm text-white/80 max-w-md mx-auto leading-relaxed pt-0.5 sm:pt-1">
                  "{resultQuote}"
                </p>

                {/* Sub-line: X% more to fully heal the Earth (when below 100%) */}
                {progressLine && (
                  <p className="text-[11px] sm:text-xs font-mono font-medium text-amber-400/90 pt-0.5">
                    {progressLine}
                  </p>
                )}
              </div>

              {/* Score Metric Cards */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-sm mx-auto w-full">
                <div className="p-2 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="font-label uppercase text-[8px] sm:text-[10px] tracking-wider text-white/50 block mb-0.5 sm:mb-1">
                    Your Score
                  </span>
                  <span className="font-mono font-bold text-base sm:text-xl text-[#0becc2]">
                    {quiz.score} / 10
                  </span>
                </div>
                <div className="p-2 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="font-label uppercase text-[8px] sm:text-[10px] tracking-wider text-white/50 block mb-0.5 sm:mb-1">
                    Earth Restored
                  </span>
                  <span className="font-mono font-bold text-base sm:text-xl text-[#0becc2]">
                    {quiz.health}%
                  </span>
                </div>
              </div>


              {/* Optional Name Input for Certificate */}
              <div className="w-full text-left pt-1">
                <label
                  htmlFor="cert-name-input"
                  className="block text-[10px] font-label uppercase tracking-wider text-white/50 mb-1"
                >
                  Your name (for the certificate)
                </label>
                <input
                  id="cert-name-input"
                  type="text"
                  maxLength={30}
                  value={certName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCertName(val);
                    try {
                      localStorage.setItem('terraheal_cert_name', val);
                    } catch (_) {}
                  }}
                  placeholder="Your name (optional)"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#0becc2]/60 focus:bg-white/[0.07] transition-all font-body"
                />
              </div>

              {/* Action Buttons (NO Play Cleanup button) */}
              <div className="space-y-2 pt-1">
                {/* When below 10/10: Retake Quiz is Primary */}
                {quiz.score < 10 ? (
                  <>
                    <button
                      onClick={handleRetake}
                      className="btn-aerospace-primary w-full text-xs py-3 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Quiz (Shuffled)</span>
                    </button>

                    <button
                      onClick={() => navigate('/solutions#play')}
                      className="w-full py-2.5 px-4 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-label text-[11px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Hub</span>
                    </button>
                  </>
                ) : (
                  /* When 10/10 Perfect Score: Hide Retake, Back to Hub is Primary */
                  <button
                    onClick={() => navigate('/solutions#play')}
                    className="btn-aerospace-primary w-full text-xs py-3.5 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Hub</span>
                  </button>
                )}

                {/* Download Certificate (Full-width secondary) + Share Icon Button */}
                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={handleDownloadCert}
                    disabled={isGeneratingCert}
                    className="flex-1 py-2.5 px-4 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-label text-[11px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingCert ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0becc2]" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{isGeneratingCert ? 'Generating...' : 'Download Certificate'}</span>
                  </button>

                  {canShare && (
                    <button
                      onClick={handleShareCert}
                      disabled={isGeneratingCert}
                      aria-label="Share certificate"
                      title="Share certificate"
                      className="w-10 h-10 shrink-0 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white hover:text-[#0becc2] transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900/95 border border-[#0becc2]/40 text-[#0becc2] text-xs font-label uppercase tracking-wider shadow-2xl flex items-center gap-2 pointer-events-auto backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Check className="w-4 h-4 text-[#0becc2] shrink-0" />
          <span className="text-white/90 normal-case font-body font-normal text-xs">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Quiz;
