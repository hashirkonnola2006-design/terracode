import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../config/game';
import { navigateWithTransition } from '../utils/navigation';
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
  Camera,
  Trash2,
  SunMedium,
  Trees,
  Droplets,
  Heart,
} from 'lucide-react';

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
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3800);
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

  // Toggle pledge
  const handleTogglePledge = (id) => {
    addPledge(id);
    showToast('Pledge recorded');
  };

  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <>
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-xl bg-slate-900/95 border border-[#0becc2]/40 text-[#0becc2] text-xs font-mono font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-2"
        >
          <Check className="w-3.5 h-3.5 text-[#0becc2]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Side-by-Side Results Viewport (Earth on Right, Card on Left) ── */}
      <main className="fixed inset-0 pt-14 sm:pt-16 z-20 flex flex-col md:flex-row pointer-events-none select-none">
        
        {/* ── Mobile Top / Desktop Right: Healed Earth Area ── */}
        <div className="order-1 md:order-2 flex-1 relative flex flex-col justify-start items-end p-3 sm:p-6 pointer-events-none h-[42vh] sm:h-[48vh] md:h-full">
          {/* Top-Right Earth 100% Status Widget */}
          <div className="flex items-center gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto mt-1 mr-1 animate-in fade-in duration-700">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
              <svg className="w-10 h-10 sm:w-11 sm:h-11 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="19" stroke="rgba(255,255,255,0.12)" strokeWidth="3.2" fill="none" />
                <circle cx="24" cy="24" r="19" stroke="#0becc2" strokeWidth="3.5" fill="none" />
              </svg>
              <Check className="w-5 h-5 text-[#0becc2] absolute" />
            </div>
            <div className="text-left">
              <span className="font-label uppercase text-[9px] sm:text-[10px] tracking-wider text-[#0becc2] font-semibold block">
                Planetary Status
              </span>
              <span className="font-body text-[11px] sm:text-xs text-white/90 font-medium">
                100% Fully Restored
              </span>
            </div>
          </div>

          {/* Earth Drag Hint Badge */}
          <div className="mt-auto mb-2 mr-1 hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-white/50 text-[10px] font-label uppercase tracking-wider">
            <span>Drag Earth to rotate</span>
          </div>
        </div>

        {/* ── Mobile Bottom / Desktop Left: Minimal, Clean Results Card ── */}
        <div className="order-2 md:order-1 w-full md:w-[410px] lg:w-[440px] xl:w-[460px] h-[58vh] sm:h-[52vh] md:h-full p-2 sm:p-5 md:p-8 flex flex-col justify-end md:justify-center z-30 pointer-events-auto">
          <div className="w-full max-h-full overflow-y-auto p-4 sm:p-6 md:p-7 rounded-2xl md:rounded-3xl bg-slate-950/90 backdrop-blur-2xl border border-white/10 shadow-2xl text-center space-y-3 sm:space-y-4 animate-in slide-in-from-bottom md:slide-in-from-left duration-500 custom-scrollbar">
            
            {/* Top Badge & Icon */}
            <div className="space-y-2">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#0becc2]/10 border border-[#0becc2]/30 mx-auto flex items-center justify-center text-[#0becc2] shrink-0">
                <Globe2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="font-label uppercase text-[9px] sm:text-[10px] font-semibold tracking-[0.25em] text-[#0becc2] block">
                  Mission Accomplished
                </span>
                <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white leading-tight">
                  Earth Restored to 100%
                </h2>
                <p className="font-body font-light text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
                  Orbital debris cleared, renewable grids deployed, native biomes reforested, and oceans cleansed.
                </p>
              </div>
            </div>

            {/* ── 4 Mission Impact Metric Tiles ── */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 max-w-sm mx-auto w-full pt-1">
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                <Trash2 className="w-3.5 h-3.5 text-[#0becc2] mx-auto mb-1 opacity-80" />
                <span className="font-label uppercase text-[7px] sm:text-[8px] tracking-wider text-white/50 block">Debris</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-white">{m1Count}/{m1Target}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                <SunMedium className="w-3.5 h-3.5 text-[#0becc2] mx-auto mb-1 opacity-80" />
                <span className="font-label uppercase text-[7px] sm:text-[8px] tracking-wider text-white/50 block">Energy</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-white">{m2Count}/{m2Target}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                <Trees className="w-3.5 h-3.5 text-[#0becc2] mx-auto mb-1 opacity-80" />
                <span className="font-label uppercase text-[7px] sm:text-[8px] tracking-wider text-white/50 block">Forests</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-white">{m3Count}/{m3Target}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                <Droplets className="w-3.5 h-3.5 text-[#0becc2] mx-auto mb-1 opacity-80" />
                <span className="font-label uppercase text-[7px] sm:text-[8px] tracking-wider text-white/50 block">Oceans</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-[#0becc2]">{m4Percent}%</span>
              </div>
            </div>

            {/* ── Certificate Name Input ── */}
            <div className="w-full text-left pt-1">
              <label
                htmlFor="clean-cert-name-input"
                className="block text-[10px] font-label uppercase tracking-wider text-white/50 mb-1"
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
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#0becc2] transition-colors"
              />
            </div>

            {/* ── Primary Action Buttons: Download Certificate & Share ── */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCert}
                  disabled={isGeneratingCert}
                  className="btn-aerospace-secondary flex-1 py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
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
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Back to Hub (Full-width) */}
              <button
                onClick={() => navigateWithTransition('/solutions#play', navigate)}
                className="btn-aerospace-primary w-full py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Hub</span>
              </button>

              {/* Secondary links: Play Again & Wallpaper */}
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

            {/* ── Sleek Compact Real-World Pledges ── */}
            <div className="pt-2 border-t border-white/10 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-label uppercase text-[9px] sm:text-[10px] tracking-wider text-white/50 font-semibold">
                  Take Real-World Action
                </span>
                <span className="font-mono text-[10px] text-[#0becc2]">
                  {pledgeList.length}/3 Pledged
                </span>
              </div>

              <div className="space-y-1.5">
                {GAME_CONFIG.PLEDGES.map((item) => {
                  const isPledged = pledgeList.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTogglePledge(item.id)}
                      disabled={isPledged}
                      className={`w-full p-2 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                        isPledged
                          ? 'bg-[#0becc2]/10 border-[#0becc2]/40 text-white'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-white/70 hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-white truncate">
                            {item.action}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/40 block truncate">
                          {item.impact}
                        </span>
                      </div>

                      <div className="shrink-0">
                        {isPledged ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#0becc2]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pledged
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-white/50 hover:text-white">
                            <Heart className="w-3 h-3" /> Pledge
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </main>
    </>
  );
};

export default EndingScreen;
