import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import INTRO_CONFIG from '../../config/intro';
import { checkShouldPlayIntro } from './useIntroStatus';
import introSvgRaw from '../../assets/logo/terraheal-logo-intro.svg?raw';

/**
 * PixelIntroLoader — Fast Pixel-Style Intro & Page Transition Loader for TerraHeal
 *
 * Sequence (total ~1.95s, driven by requestAnimationFrame & performance.now()):
 * 1. 0.00 - 0.15s: Solid black (#050505)
 * 2. 0.15 - 0.80s: Randomized pixel static wave filling to brand teal with intermediate shades
 * 3. 0.60 - 1.30s: Stepped pixel sharpening of TerraHeal logo across 5 resolution stages
 *    * At 0.80 - 0.85s (solid teal cover): Route navigate(to) is called if navigating between pages
 * 4. 1.30 - 1.45s: Solid teal hold with full crisp resolution logo
 * 5. 1.45 - 1.95s: Reverse pixel dissolve revealing new page; logo dissolves with blocks
 * 6. 1.95s: Overlay removed from DOM, scroll restored, completion events dispatched
 */
export const PixelIntroLoader = () => {
  const navigate = useNavigate();

  // Active transition session: null when inactive, or { id, to, isInitial }
  const [activeSession, setActiveSession] = useState(() => {
    return checkShouldPlayIntro() ? { id: 1, to: null, isInitial: true } : null;
  });

  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [reducedFadeOut, setReducedFadeOut] = useState(false);

  const canvasRef = useRef(null);
  const animFrameId = useRef(null);

  // Register global transition listener and direct trigger
  useEffect(() => {
    window.__TERRAHEAL_LOADER_ACTIVE__ = true;

    window.__TERRAHEAL_TRIGGER_TRANSITION__ = (to) => {
      setActiveSession((curr) => {
        // If already transitioning to this exact target, don't restart
        if (curr && curr.to === to) return curr;
        window.dispatchEvent(new CustomEvent('terraheal:intro-start'));
        return { id: Date.now(), to, isInitial: false };
      });
    };

    const handleTransitionEvent = (e) => {
      const to = e.detail?.to;
      if (!to) return;
      window.dispatchEvent(new CustomEvent('terraheal:transition-handled'));
      if (typeof window.__TERRAHEAL_TRIGGER_TRANSITION__ === 'function') {
        window.__TERRAHEAL_TRIGGER_TRANSITION__(to);
      }
    };

    window.addEventListener('terraheal:transition-to', handleTransitionEvent);

    return () => {
      window.__TERRAHEAL_LOADER_ACTIVE__ = false;
      delete window.__TERRAHEAL_TRIGGER_TRANSITION__;
      window.removeEventListener('terraheal:transition-to', handleTransitionEvent);
    };
  }, []);

  // Run intro / transition sequence whenever activeSession is set
  useEffect(() => {
    if (!activeSession) return;

    // ── Accessibility: prefers-reduced-motion fallback ──
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotionQuery.matches) {
      setIsReducedMotion(true);
      const prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        if (activeSession.to) {
          navigate(activeSession.to);
          window.scrollTo(0, 0);
        }
        setReducedFadeOut(true);
        window.dispatchEvent(new CustomEvent('terraheal:intro-exit'));

        setTimeout(() => {
          document.body.style.overflow = prevBodyOverflow;
          window.dispatchEvent(new CustomEvent('terraheal:intro-complete'));
          setActiveSession(null);
          try {
            sessionStorage.setItem(INTRO_CONFIG.storage.key, 'true');
          } catch {
            // ignore
          }
        }, INTRO_CONFIG.timing.reducedMotionDuration);
      }, 200);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = prevBodyOverflow;
      };
    }

    // Mark as played in sessionStorage
    try {
      sessionStorage.setItem(INTRO_CONFIG.storage.key, 'true');
    } catch {
      // ignore
    }

    // 1. Lock scroll and pointer interactions
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // 2. Setup 2D Canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, INTRO_CONFIG.maxDpr);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    let isMobile = width < 768 || width / Math.max(1, height) < 1.05;
    let blockSize = 24;
    let cols = 0;
    let rows = 0;
    let totalBlocks = 0;
    let order = new Uint32Array(0);
    let shades = new Uint8Array(0);

    const recomputeGrid = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      isMobile = width < 768 || width / Math.max(1, height) < 1.05;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const divs = isMobile
        ? INTRO_CONFIG.grid.mobileShortSideDivisions
        : INTRO_CONFIG.grid.desktopShortSideDivisions;
      const shortSide = Math.min(width, height);
      blockSize = Math.max(
        INTRO_CONFIG.grid.minBlockSize,
        Math.round(shortSide / divs)
      );

      cols = Math.ceil(width / blockSize);
      rows = Math.ceil(height / blockSize);
      totalBlocks = cols * rows;

      // Seeded / precomputed shuffled index array for block order
      order = new Uint32Array(totalBlocks);
      shades = new Uint8Array(totalBlocks);

      for (let i = 0; i < totalBlocks; i++) {
        order[i] = i;
        shades[i] = Math.floor(Math.random() * 4);
      }

      // True uniform Fisher-Yates shuffle
      for (let i = totalBlocks - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = order[i];
        order[i] = order[j];
        order[j] = temp;
      }
    };

    recomputeGrid();

    // 3. Instant In-Memory SVG Logo Steps
    const logoImg = new Image();
    const svgBlob = new Blob([introSvgRaw], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    logoImg.src = svgUrl;

    const stepCanvases = [
      document.createElement('canvas'),
      document.createElement('canvas'),
      document.createElement('canvas'),
      document.createElement('canvas'),
      document.createElement('canvas'),
    ];
    let logoReady = false;

    const prepareLogoSteps = () => {
      const stepWidths = [16, 32, 64, 128, 580];
      const aspect = INTRO_CONFIG.logo.aspectRatio;

      stepWidths.forEach((sw, idx) => {
        const sc = stepCanvases[idx];
        const sh = Math.max(1, Math.round(sw * aspect));
        sc.width = sw;
        sc.height = sh;
        const sCtx = sc.getContext('2d');
        if (sCtx) {
          sCtx.imageSmoothingEnabled = false;
          sCtx.drawImage(logoImg, 0, 0, sw, sh);
        }
      });
      logoReady = true;
    };

    if (logoImg.complete) {
      prepareLogoSteps();
    } else {
      logoImg.onload = prepareLogoSteps;
    }

    // 4. Color Palette
    const COLOR_BRAND = INTRO_CONFIG.colors.brand;
    const COLOR_DARKER = INTRO_CONFIG.colors.brandDarker;
    const COLOR_LIGHTER = INTRO_CONFIG.colors.brandLighter;
    const COLOR_BG = INTRO_CONFIG.colors.bgDark;
    const SHADE_PALETTE = [COLOR_BRAND, COLOR_DARKER, COLOR_LIGHTER, COLOR_BRAND];

    // 5. Sequence Execution
    const startTime = performance.now();
    let hasDispatchedExit = false;
    let hasNavigated = false;
    let actualExitStartTime = INTRO_CONFIG.timing.phase5_pixelExitStart;
    let actualEndTime = INTRO_CONFIG.timing.totalDuration;

    const renderFrame = (now) => {
      const elapsed = now - startTime;

      // When the screen is 100% filled with solid teal, trigger navigation underneath
      if (elapsed >= INTRO_CONFIG.timing.phase2_pixelFillEnd && !hasNavigated && activeSession.to) {
        hasNavigated = true;
        navigate(activeSession.to);
        window.scrollTo(0, 0);
      }

      // Check Readiness at 1450ms (or up to +300ms extra hold if assets still pending)
      if (elapsed >= INTRO_CONFIG.timing.phase4_logoHoldEnd && !hasDispatchedExit) {
        const isAppReady = document.readyState === 'complete' || document.readyState === 'interactive';
        const extraWaited = elapsed - INTRO_CONFIG.timing.phase4_logoHoldEnd;

        if (isAppReady || extraWaited >= INTRO_CONFIG.timing.maxWaitExtra) {
          hasDispatchedExit = true;
          actualExitStartTime = elapsed;
          actualEndTime = actualExitStartTime + (INTRO_CONFIG.timing.phase5_pixelExitEnd - INTRO_CONFIG.timing.phase5_pixelExitStart);
          window.dispatchEvent(new CustomEvent('terraheal:intro-exit'));
        }
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const logoW = Math.round(
        width * (isMobile ? INTRO_CONFIG.logo.mobileWidthRatio : INTRO_CONFIG.logo.desktopWidthRatio)
      );
      const logoH = Math.round(logoW * INTRO_CONFIG.logo.aspectRatio);
      const logoX = Math.round((width - logoW) / 2);
      const logoY = Math.round((height - logoH) / 2);

      // ── PHASE 1: 0.00s - 0.15s (Pure Black) ──
      if (elapsed < INTRO_CONFIG.timing.phase1_blackHold) {
        ctx.fillStyle = COLOR_BG;
        ctx.fillRect(0, 0, width, height);
      }

      // ── PHASE 2, 3, 4: 0.15s - 1.45s (Pixel Fill & Stepped Logo Sharpening) ──
      else if (!hasDispatchedExit) {
        const fillP = Math.min(
          Math.max(
            (elapsed - INTRO_CONFIG.timing.phase2_pixelFillStart) /
              (INTRO_CONFIG.timing.phase2_pixelFillEnd - INTRO_CONFIG.timing.phase2_pixelFillStart),
            0
          ),
          1.0
        );

        if (fillP < 1.0) {
          ctx.fillStyle = COLOR_BG;
          ctx.fillRect(0, 0, width, height);

          const activeCount = Math.floor(fillP * totalBlocks);
          const frontier = Math.max(0, activeCount - Math.floor(totalBlocks * 0.14));

          for (let i = 0; i < activeCount; i++) {
            const idx = order[i];
            const bx = (idx % cols) * blockSize;
            const by = Math.floor(idx / cols) * blockSize;

            if (i < frontier) {
              ctx.fillStyle = COLOR_BRAND;
            } else {
              ctx.fillStyle = SHADE_PALETTE[shades[i]];
            }
            ctx.fillRect(bx, by, blockSize, blockSize);
          }
        } else {
          ctx.fillStyle = COLOR_BRAND;
          ctx.fillRect(0, 0, width, height);
        }

        // Stepped Logo Appearance (0.60s - 1.30s) and Hold (1.30s - 1.45s)
        if (elapsed >= INTRO_CONFIG.timing.phase3_logoSharpenStart && logoReady) {
          let stepIdx = 4;
          for (let s = 0; s < INTRO_CONFIG.logoSteps.length; s++) {
            if (elapsed < INTRO_CONFIG.logoSteps[s].endTime) {
              stepIdx = s;
              break;
            }
          }

          const currentStep = stepCanvases[stepIdx];
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(currentStep, logoX, logoY, logoW, logoH);
          ctx.restore();
        }
      }

      // ── PHASE 5: Exit Dissolve (~1.45s - 1.95s) ──
      else if (hasDispatchedExit && elapsed < actualEndTime) {
        const exitDuration = actualEndTime - actualExitStartTime;
        const exitP = Math.min(Math.max((elapsed - actualExitStartTime) / exitDuration, 0), 1.0);
        const remainingFraction = 1.0 - exitP;
        const remainingBlocks = Math.floor(remainingFraction * totalBlocks);

        ctx.clearRect(0, 0, width, height);

        // Draw remaining blocks
        ctx.fillStyle = COLOR_BRAND;
        for (let i = 0; i < remainingBlocks; i++) {
          const idx = order[i];
          const bx = (idx % cols) * blockSize;
          const by = Math.floor(idx / cols) * blockSize;
          ctx.fillRect(bx, by, blockSize, blockSize);
        }

        // Dissolve logo synchronously with blocks using source-atop
        if (logoReady) {
          ctx.save();
          ctx.globalCompositeOperation = 'source-atop';
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(stepCanvases[4], logoX, logoY, logoW, logoH);
          ctx.restore();
        }
      }

      // ── SEQUENCE COMPLETE: (1.95s normal, <= 2.3s max) ──
      else if (elapsed >= actualEndTime) {
        ctx.restore();
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        URL.revokeObjectURL(svgUrl);
        window.dispatchEvent(new CustomEvent('terraheal:intro-complete'));
        setActiveSession(null);
        return;
      }

      ctx.restore();
      animFrameId.current = requestAnimationFrame(renderFrame);
    };

    animFrameId.current = requestAnimationFrame(renderFrame);

    const handleResize = () => {
      recomputeGrid();
    };
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      URL.revokeObjectURL(svgUrl);
    };
  }, [activeSession, navigate]);

  if (!activeSession) return null;

  // Reduced motion accessible fallback
  if (isReducedMotion) {
    const encodedSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent(introSvgRaw);
    return (
      <div
        className={`fixed inset-0 z-[99999] flex items-center justify-center bg-[#0becc2] transition-opacity duration-400 pointer-events-auto ${
          reducedFadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ minHeight: '100dvh' }}
      >
        <div role="status" aria-label="Loading TerraHeal" className="sr-only">
          Loading TerraHeal...
        </div>
        <img
          src={encodedSvg}
          alt="TerraHeal Logo"
          className="w-[70%] sm:w-[40%] max-w-[620px] select-none"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    );
  }

  return (
    <>
      <div role="status" aria-label="Loading TerraHeal" className="sr-only">
        Loading TerraHeal...
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 z-[99999] pointer-events-auto select-none"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          zIndex: 99999,
          touchAction: 'none',
        }}
      />
    </>
  );
};

export default PixelIntroLoader;
