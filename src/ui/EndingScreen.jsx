import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../config/game';
import { navigateWithTransition } from '../utils/navigation';
import { musicEngine } from '../audio/musicEngine';
import {
  downloadCleanCertificate,
  shareCleanCertificate,
} from '../utils/cleanCertificate';
import {
  Download,
  Share2,
  RotateCcw,
  Check,
  CheckCircle2,
  Globe2,
  ArrowLeft,
  ArrowRight,
  Camera,
  Trash2,
  SunMedium,
  Trees,
  Droplets,
  Heart,
  Sparkles,
  Zap,
  Award,
  ChevronRight,
} from 'lucide-react';

const PLEDGE_DECK = [
  {
    id: 'pledge_trees',
    tag: 'PLEDGE 01 OF 03 • BIODIVERSITY & FORESTS',
    title: 'Plant Native Trees & Protect Forests',
    subtitle: 'Restore Earth’s Living Lungs',
    category: 'Plant & Restore',
    impactStat: '7.6 Gt CO2',
    impactLabel: 'Global Annual Sequestration Potential',
    description: 'Commit to planting local native trees, volunteering in habitat restoration, or contributing to verified forest biodiversity conservation.',
    actionLabel: 'Take Pledge: Support Native Forests',
    color: '#10b981',
    icon: Trees,
  },
  {
    id: 'pledge_energy',
    tag: 'PLEDGE 02 OF 03 • ENERGY & CLIMATE',
    title: 'Cut Fossil Energy & Power Down Carbon',
    subtitle: 'Accelerate the Clean Energy Transition',
    category: 'Save Clean Energy',
    impactStat: '1.4 Tonnes CO2',
    impactLabel: 'Average Saved Annually Per Household',
    description: 'Switch home appliances to high-efficiency ratings, opt into community solar, eliminate phantom standby load, and choose clean electrified transit.',
    actionLabel: 'Take Pledge: Cut Carbon Usage',
    color: '#f59e0b',
    icon: SunMedium,
  },
  {
    id: 'pledge_waste',
    tag: 'PLEDGE 03 OF 03 • ZERO WASTE & OCEANS',
    title: 'Eliminate Single-Use Plastics',
    subtitle: 'Stop Ocean Drift at the Source',
    category: 'Zero Plastic Waste',
    impactStat: '80% Reduction',
    impactLabel: 'Halts Catastrophic Ocean Leakage by 2040',
    description: 'Refuse disposable single-use plastic bottles, bags, and cups. Choose durable reusables, buy packaging-free goods, and support circular recycling.',
    actionLabel: 'Take Pledge: Eliminate Single-Use',
    color: '#06b6d4',
    icon: Droplets,
  },
];

export const EndingScreen = () => {
  const navigate = useNavigate();
  const cleanliness = useGameStore((s) => s.cleanup?.health ?? s.cleanliness ?? 0);
  const itemsCollected = useGameStore((s) => s.cleanup?.itemsCollected ?? s.itemsCollected ?? 0);
  const co2Absorbed = useGameStore((s) => s.cleanup?.co2Absorbed ?? s.co2Absorbed ?? 0);
  const cleanup = useGameStore((s) => s.cleanup);
  const pledges = useGameStore((s) => s.pledges);
  const pledgeList = Array.isArray(pledges) ? pledges : [];
  const addPledge = useGameStore((s) => s.addPledge);
  const restartGame = useGameStore((s) => s.restartGame);

  // 2-Phase Ending Flow:
  // Phase 1: Real-World Action Pledges (one by one in an immersive pop-up card)
  // Phase 2: Mission Accomplished & Certificate (spacious, zero scrolling)
  const [phase, setPhase] = useState('pledges'); // 'pledges' | 'victory'
  const [currentPledgeIdx, setCurrentPledgeIdx] = useState(0);

  // Certificate Name state (shared with quiz in localStorage)
  const [certName, setCertName] = useState(() => {
    try {
      return localStorage.getItem('terraheal_cert_name') || '';
    } catch (_) {
      return '';
    }
  });

  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  const handleNameChange = (e) => {
    const val = e.target.value.slice(0, 30);
    setCertName(val);
    try {
      localStorage.setItem('terraheal_cert_name', val);
    } catch (_) {}
  };

  // Only render when Earth has reached 100% cleanliness
  if (cleanliness < 100) return null;

  const m1Count = cleanup?.mission1?.count ?? GAME_CONFIG.MISSION_1_TARGET;
  const m1Target = GAME_CONFIG.MISSION_1_TARGET;
  const m2Count = cleanup?.mission2?.convertedSources?.length ?? GAME_CONFIG.MISSION_2_TARGET;
  const m2Target = GAME_CONFIG.MISSION_2_TARGET;
  const m3Count = cleanup?.mission3?.plantedPatches?.length ?? GAME_CONFIG.MISSION_3_TARGET;
  const m3Target = GAME_CONFIG.MISSION_3_TARGET;
  const m4Percent = cleanup?.mission4?.sweptPercent ?? 100;

  // 1. Download high-res Certificate
  const handleDownloadCert = async () => {
    if (isGeneratingCert) return;
    setIsGeneratingCert(true);
    try {
      await downloadCleanCertificate({
        playerName: certName,
        itemsCollected,
        co2Absorbed,
        onToast: showToast,
      });
    } catch (err) {
      console.error('Download certificate error:', err);
      showToast('Could not generate certificate. Please try again.');
    } finally {
      setIsGeneratingCert(false);
    }
  };

  // 2. Share Certificate
  const handleShareCert = async () => {
    if (isGeneratingCert) return;
    setIsGeneratingCert(true);
    try {
      await shareCleanCertificate({
        playerName: certName,
        itemsCollected,
        co2Absorbed,
        onToast: showToast,
      });
    } catch (err) {
      console.error('Share certificate error:', err);
      showToast('Could not share certificate. Please try again.');
    } finally {
      setIsGeneratingCert(false);
    }
  };

  // 3. Capture 3D Canvas Wallpaper
  const handleDownloadScreenshot = () => {
    setDownloadingImage(true);
    try {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `TerraHeal-Clean-Earth-${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Wallpaper image saved');
      }
    } catch (err) {
      console.warn('Screenshot capture failed:', err);
      showToast('Could not capture screenshot');
    } finally {
      setTimeout(() => setDownloadingImage(false), 800);
    }
  };

  // Pledge Actions
  const currentPledge = PLEDGE_DECK[currentPledgeIdx] || PLEDGE_DECK[0];
  const isCurrentPledged = pledgeList.includes(currentPledge.id);

  const handleTakePledge = () => {
    try {
      musicEngine.playSprout();
    } catch (_) {}
    addPledge(currentPledge.id);
    showToast(`Pledge committed: ${currentPledge.title}! 💚`);

    // Advance to next pledge, or transition to Victory card after 3rd pledge
    if (currentPledgeIdx < PLEDGE_DECK.length - 1) {
      setCurrentPledgeIdx((prev) => prev + 1);
    } else {
      setTimeout(() => {
        setPhase('victory');
      }, 400);
    }
  };

  const handleSkipPledge = () => {
    try {
      musicEngine.playClick();
    } catch (_) {}
    if (currentPledgeIdx < PLEDGE_DECK.length - 1) {
      setCurrentPledgeIdx((prev) => prev + 1);
    } else {
      setPhase('victory');
    }
  };

  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <>
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 rounded-xl bg-slate-900/95 border border-[#0becc2]/40 text-[#0becc2] text-xs font-mono font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-2"
        >
          <Check className="w-3.5 h-3.5 text-[#0becc2]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top-Right Earth 100% Status Widget ── */}
      <div className="fixed top-14 sm:top-16 right-3 sm:right-6 z-20 pointer-events-auto">
        <div className="flex items-center gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl animate-in fade-in duration-700">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
            <svg className="w-9 h-9 sm:w-10 sm:h-10 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="19" stroke="rgba(255,255,255,0.12)" strokeWidth="3.2" fill="none" />
              <circle cx="24" cy="24" r="19" stroke="#0becc2" strokeWidth="3.5" fill="none" />
            </svg>
            <Check className="w-4 h-4 text-[#0becc2] absolute" />
          </div>
          <div className="text-left">
            <span className="font-mono uppercase text-[9px] sm:text-[10px] tracking-wider text-[#0becc2] font-semibold block">
              Planetary Status
            </span>
            <span className="text-[11px] sm:text-xs text-white/90 font-medium">
              100% Restored
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Viewport Container ── */}
      <main className="fixed inset-0 pt-14 sm:pt-16 z-30 flex items-center justify-start p-3 sm:p-6 md:p-10 lg:p-12 pointer-events-none select-none">
        
        {/* ══════════════════════════════════════════════════════════════
            PHASE 1: REAL-WORLD ACTION PLEDGE POP-UP CARD (ONE BY ONE)
            ══════════════════════════════════════════════════════════════ */}
        {phase === 'pledges' && (
          <div className="w-full max-w-lg md:max-w-xl pointer-events-auto animate-in fade-in slide-in-from-left-4 duration-300">
            <div
              className="w-full rounded-2xl sm:rounded-3xl bg-[#050505]/92 backdrop-blur-2xl border border-white/15 p-5 sm:p-7 md:p-8 shadow-2xl text-left font-sans"
              style={{
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9), 0 0 40px rgba(11,236,194,0.08)',
              }}
            >
              {/* Header row: Progress pills + Step indicator */}
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: currentPledge.color }}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60 font-semibold">
                    {currentPledge.tag}
                  </span>
                </div>

                <button
                  onClick={() => {
                    try {
                      musicEngine.playClick();
                    } catch (_) {}
                    setPhase('victory');
                  }}
                  className="text-[11px] font-mono text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  Skip to Certificate →
                </button>
              </div>

              {/* 3 Segmented progress bar */}
              <div className="flex items-center gap-2 w-full my-3">
                {PLEDGE_DECK.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      idx < currentPledgeIdx || pledgeList.includes(p.id)
                        ? 'bg-[#0becc2]'
                        : idx === currentPledgeIdx
                        ? 'bg-[#0becc2] shadow-[0_0_10px_#0becc2]'
                        : 'bg-white/15'
                    }`}
                  />
                ))}
              </div>

              {/* Pledge Main Visual & Title */}
              <div className="flex items-start gap-3.5 sm:gap-4 my-4">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: `${currentPledge.color}15`,
                    borderColor: `${currentPledge.color}35`,
                    color: currentPledge.color,
                  }}
                >
                  <currentPledge.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold mb-1"
                    style={{
                      backgroundColor: `${currentPledge.color}20`,
                      color: currentPledge.color,
                    }}
                  >
                    {currentPledge.category}
                  </span>
                  <h3 className="text-base sm:text-xl font-bold text-white tracking-tight leading-snug">
                    {currentPledge.title}
                  </h3>
                  <p className="text-xs text-white/60 font-medium">
                    {currentPledge.subtitle}
                  </p>
                </div>
              </div>

              {/* Environmental Impact Highlight Box */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.04] border border-white/10 my-3.5">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#0becc2] font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#0becc2]" /> Verified Climate Impact
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                    {currentPledge.impactStat}
                  </span>
                  <span className="text-xs text-white/70 font-medium">
                    {currentPledge.impactLabel}
                  </span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed pt-1 border-t border-white/5">
                  {currentPledge.description}
                </p>
              </div>

              {/* Interactive Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleTakePledge}
                  className="w-full py-3 px-5 rounded-xl bg-[#0becc2] hover:bg-[#0ad0ab] active:scale-[0.99] text-[#050505] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(11,236,194,0.35)] transition-all cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>{isCurrentPledged ? 'Pledge Confirmed ✓ (Next)' : currentPledge.actionLabel}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <div className="flex items-center justify-between text-[11px] text-white/50 px-1 pt-1">
                  <span>Pledges Committed: <strong className="text-white font-mono">{pledgeList.length}/3</strong></span>
                  <button
                    onClick={handleSkipPledge}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-mono text-[11px]"
                  >
                    <span>{currentPledgeIdx < PLEDGE_DECK.length - 1 ? 'Skip this pledge →' : 'Continue to Certificate →'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PHASE 2: MISSION ACCOMPLISHED & CERTIFICATE CARD
            ══════════════════════════════════════════════════════════════ */}
        {phase === 'victory' && (
          <div className="w-full max-w-lg md:max-w-xl pointer-events-auto animate-in fade-in zoom-in-95 duration-400">
            <div
              className="w-full rounded-2xl sm:rounded-3xl bg-[#050505]/92 backdrop-blur-2xl border border-white/15 p-5 sm:p-7 md:p-8 shadow-2xl text-center space-y-3 sm:space-y-4 font-sans"
              style={{
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9), 0 0 40px rgba(11,236,194,0.08)',
              }}
            >
              {/* Top Badge & Header */}
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0becc2]/10 border border-[#0becc2]/30 text-[#0becc2] text-[10px] font-mono uppercase tracking-[0.2em] font-semibold">
                  <Award className="w-3.5 h-3.5" /> Mission Accomplished
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                  Earth Restored to 100%
                </h2>
                <p className="text-xs text-white/70 max-w-md mx-auto leading-relaxed">
                  Orbital debris cleared, renewable grids deployed, native biomes reforested, and oceans cleansed.
                </p>
              </div>

              {/* 4 Mission Impact Metric Tiles in Horizontal Grid */}
              <div className="grid grid-cols-4 gap-2 w-full pt-1">
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                  <Trash2 className="w-3.5 h-3.5 text-[#0becc2] mx-auto mb-1 opacity-80" />
                  <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-wider text-white/50 block">Debris</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-white">{m1Count}/{m1Target}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                  <SunMedium className="w-3.5 h-3.5 text-[#0becc2] mx-auto mb-1 opacity-80" />
                  <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-wider text-white/50 block">Energy</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-white">{m2Count}/{m2Target}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                  <Trees className="w-3.5 h-3.5 text-[#0becc2] mx-auto mb-1 opacity-80" />
                  <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-wider text-white/50 block">Forests</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-white">{m3Count}/{m3Target}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                  <Droplets className="w-3.5 h-3.5 text-[#0becc2] mx-auto mb-1 opacity-80" />
                  <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-wider text-white/50 block">Oceans</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-[#0becc2]">{m4Percent}%</span>
                </div>
              </div>

              {/* Real-World Action Committed Banner */}
              <div className="px-3 py-2 rounded-xl bg-[#0becc2]/10 border border-[#0becc2]/25 flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#0becc2] fill-current shrink-0" />
                  <span className="text-xs text-white/90 font-medium">
                    <strong className="text-[#0becc2] font-mono">{pledgeList.length}/3</strong> Real-World Pledges Committed!
                  </span>
                </div>
                <button
                  onClick={() => {
                    try {
                      musicEngine.playClick();
                    } catch (_) {}
                    setCurrentPledgeIdx(0);
                    setPhase('pledges');
                  }}
                  className="text-[11px] font-mono text-[#0becc2] hover:underline cursor-pointer shrink-0 ml-2"
                >
                  Review Pledges
                </button>
              </div>

              {/* Certificate Name Input */}
              <div className="w-full text-left pt-0.5">
                <label
                  htmlFor="clean-cert-name-input"
                  className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1"
                >
                  Your name (for the certificate)
                </label>
                <input
                  id="clean-cert-name-input"
                  type="text"
                  maxLength={30}
                  value={certName}
                  onChange={handleNameChange}
                  placeholder="Enter name to appear on certificate"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#0becc2] transition-colors"
                />
              </div>

              {/* Primary Action Buttons: Download Certificate & Share */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadCert}
                    disabled={isGeneratingCert}
                    className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#0becc2]" />
                    <span>{isGeneratingCert ? 'Generating...' : 'Download Certificate'}</span>
                  </button>

                  {canShare && (
                    <button
                      onClick={handleShareCert}
                      disabled={isGeneratingCert}
                      aria-label="Share certificate"
                      title="Share certificate"
                      className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Back to Hub (Full-width Glowing Button) */}
                <button
                  onClick={() => navigateWithTransition('/solutions#play', navigate)}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#0becc2] hover:bg-[#0ad0ab] active:scale-[0.99] text-[#050505] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(11,236,194,0.30)] transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Hub</span>
                </button>

                {/* Secondary links: Play Again & Save Wallpaper */}
                <div className="flex items-center justify-between text-[11px] text-white/50 px-1 pt-1">
                  <button
                    onClick={restartGame}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Play Again</span>
                  </button>

                  <button
                    onClick={handleDownloadScreenshot}
                    disabled={downloadingImage}
                    className="hover:text-[#0becc2] transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Save high-res PNG wallpaper of your cleaned Earth"
                  >
                    <Camera className="w-3 h-3" />
                    <span>{downloadingImage ? 'Saving...' : 'Save Wallpaper'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </>
  );
};

export default EndingScreen;
