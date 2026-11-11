import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import INTRO_CONFIG from '../../config/intro';
import { checkShouldPlayIntro } from './useIntroStatus';
import introSvgRaw from '../../assets/logo/terraheal-logo-intro.svg?raw';

/**
 * PixelIntroLoader — Continuous, Butter-Smooth Pixel Loading & Page Transition Engine
 *
 * Designed for 60-120 FPS performance with zero frame drops, zero black screen breaks,
 * and seamless route transitions.
 *
 * Modes:
 * 1. Initial Site Load (isInitial === true):
 *    Brief black hold (80ms) -> Pixel static wave fills to teal -> Logo sharpens -> Hold -> Dissolve.
 * 2. Route Transition (isInitial === false):
 *    NO black flash! Transparent overlay -> Teal pixels swarm directly over current page ->
 *    Solid teal cover -> Background route navigation & render -> Logo sharpens ->
 *    Seamless reverse dissolve revealing the pre-rendered destination scene!
 */
export const PixelIntroLoader = () => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

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
        queueMicrotask(() => {
          window.dispatchEvent(new CustomEvent('terraheal:intro-start'));
        });
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

    const isInitial = !!activeSession.isInitial;
    const cfg = isInitial ? INTRO_CONFIG.timing.initial : INTRO_CONFIG.timing.transition;

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
      }, 180);

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

    // 1. Lock scroll
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // 2. Setup 2D Canvas with fixed 1.0 DPR for max throughput & authentic retro block styling
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    let isMobile = width < 768 || width / Math.max(1, height) < 1.05;
    let blockSize = 24;
    let cols = 0;
    let rows = 0;
    let totalBlocks = 0;
    let order = new Uint32Array(0);
    let shades = new Uint8Array(0);
    let blockX = new Int32Array(0);
    let blockY = new Int32Array(0);

    const recomputeGrid = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      isMobile = width < 768 || width / Math.max(1, height) < 1.05;

      canvas.width = width;
      canvas.height = height;
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

      order = new Uint32Array(totalBlocks);
      shades = new Uint8Array(totalBlocks);
      blockX = new Int32Array(totalBlocks);
      blockY = new Int32Array(totalBlocks);

      for (let i = 0; i < totalBlocks; i++) {
        order[i] = i;
        shades[i] = Math.floor(Math.random() * 4);
        blockX[i] = (i % cols) * blockSize;
        blockY[i] = Math.floor(i / cols) * blockSize;
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

    const stepWidths = [16, 32, 64, 128, 580];
    const stepCanvases = stepWidths.map(() => document.createElement('canvas'));
    let logoReady = false;

    const prepareLogoSteps = () => {
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

    // 5. Destination Readiness Synchronization
    let isSceneReady = !activeSession.to; // If not navigating, ready immediately
    const handleSceneReady = () => {
      isSceneReady = true;
    };
    window.addEventListener('terraheal:scene-ready', handleSceneReady);

    // 6. Sequence Execution with Clamped Delta Timing
    let lastFrameTime = performance.now();
    let virtualElapsed = 0;
    let hasNavigated = false;
    let hasDispatchedExit = false;
    let exitStartTime = 0;

    const renderFrame = (now) => {
      const rawDelta = now - lastFrameTime;
      lastFrameTime = now;
      // Clamp delta to at most 34ms (~30fps step) to avoid sudden frame drops or skipping
      const delta = Math.min(Math.max(rawDelta, 0), 34);
      virtualElapsed += delta;

      // Base logo layout dimensions
      const baseLogoW = Math.round(
        width * (isMobile ? INTRO_CONFIG.logo.mobileWidthRatio : INTRO_CONFIG.logo.desktopWidthRatio)
      );
      const baseLogoH = Math.round(baseLogoW * INTRO_CONFIG.logo.aspectRatio);

      // Trigger navigation as soon as screen is 100% covered in solid teal
      if (virtualElapsed >= cfg.fillEnd && !hasNavigated && activeSession.to) {
        hasNavigated = true;
        requestAnimationFrame(() => {
          if (navigateRef.current) {
            navigateRef.current(activeSession.to);
          }
          window.scrollTo(0, 0);
        });
      }

      // Check if ready to begin exit dissolve
      if (virtualElapsed >= cfg.holdEnd && !hasDispatchedExit) {
        const extraWaited = virtualElapsed - cfg.holdEnd;
        // Exit when the destination scene is painted, or if maxWaitExtra timeout reached
        if (isSceneReady || extraWaited >= cfg.maxWaitExtra) {
          hasDispatchedExit = true;
          exitStartTime = virtualElapsed;
          window.dispatchEvent(new CustomEvent('terraheal:intro-exit'));
        }
      }

      // ─────────────────────────────────────────────────────────────
      // PHASE 1: Black hold (Only for initial cold load, never on transitions)
      // ─────────────────────────────────────────────────────────────
      if (isInitial && virtualElapsed < cfg.blackHold) {
        ctx.fillStyle = COLOR_BG;
        ctx.fillRect(0, 0, width, height);
      }

      // ─────────────────────────────────────────────────────────────
      // PHASE 2, 3, 4: Pixel Fill, Logo Sharpening, and Hold
      // ─────────────────────────────────────────────────────────────
      else if (!hasDispatchedExit) {
        const fillP = Math.min(
          Math.max(
            (virtualElapsed - cfg.fillStart) / Math.max(1, cfg.fillEnd - cfg.fillStart),
            0
          ),
          1.0
        );

        if (fillP < 1.0) {
          if (isInitial) {
            ctx.fillStyle = COLOR_BG;
            ctx.fillRect(0, 0, width, height);
          } else {
            // For route transitions: clear so previous page is visible while blocks multiply
            ctx.clearRect(0, 0, width, height);
          }

          const activeCount = Math.floor(fillP * totalBlocks);
          const frontier = Math.max(0, activeCount - Math.floor(totalBlocks * 0.12));

          // Draw solid brand blocks in one batch
          ctx.fillStyle = COLOR_BRAND;
          for (let i = 0; i < frontier; i++) {
            const idx = order[i];
            ctx.fillRect(blockX[idx], blockY[idx], blockSize, blockSize);
          }

          // Draw trailing frontier blocks with variation
          for (let i = frontier; i < activeCount; i++) {
            ctx.fillStyle = SHADE_PALETTE[shades[i]];
            const idx = order[i];
            ctx.fillRect(blockX[idx], blockY[idx], blockSize, blockSize);
          }
        } else {
          // 100% filled: single solid teal rect
          ctx.fillStyle = COLOR_BRAND;
          ctx.fillRect(0, 0, width, height);
        }

        // Stepped Logo Appearance & Sharpening
        if (virtualElapsed >= cfg.sharpenStart && logoReady) {
          const sharpenP = Math.min(
            Math.max(
              (virtualElapsed - cfg.sharpenStart) / Math.max(1, cfg.sharpenEnd - cfg.sharpenStart),
              0
            ),
            1.0
          );

          let stepIdx = 4;
          for (let s = 0; s < INTRO_CONFIG.logoSteps.length; s++) {
            if (sharpenP <= INTRO_CONFIG.logoSteps[s].progress) {
              stepIdx = s;
              break;
            }
          }

          // While holding for scene readiness, add a subtle breathing pulse
          const isHolding = virtualElapsed >= cfg.holdEnd && !isSceneReady;
          const breatheScale = isHolding
            ? 1.0 + Math.sin(virtualElapsed * 0.005) * 0.015
            : 1.0;

          const logoW = Math.round(baseLogoW * breatheScale);
          const logoH = Math.round(baseLogoH * breatheScale);
          const logoX = Math.round((width - logoW) / 2);
          const logoY = Math.round((height - logoH) / 2);

          const currentStep = stepCanvases[stepIdx];
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(currentStep, logoX, logoY, logoW, logoH);
          ctx.restore();
        }
      }

      // ─────────────────────────────────────────────────────────────
      // PHASE 5: Reverse Pixel Dissolve (Revealing already-rendered scene)
      // ─────────────────────────────────────────────────────────────
      else if (hasDispatchedExit) {
        const exitElapsed = virtualElapsed - exitStartTime;
        const exitP = Math.min(Math.max(exitElapsed / cfg.exitDuration, 0), 1.0);

        if (exitP < 1.0) {
          const remainingFraction = 1.0 - exitP;
          const remainingBlocks = Math.floor(remainingFraction * totalBlocks);

          ctx.clearRect(0, 0, width, height);

          // Draw remaining pixel blocks in single batch
          ctx.fillStyle = COLOR_BRAND;
          for (let i = 0; i < remainingBlocks; i++) {
            const idx = order[i];
            ctx.fillRect(blockX[idx], blockY[idx], blockSize, blockSize);
          }

          // Dissolve logo synchronously with blocks using source-atop
          if (logoReady) {
            const logoX = Math.round((width - baseLogoW) / 2);
            const logoY = Math.round((height - baseLogoH) / 2);
            ctx.save();
            ctx.globalCompositeOperation = 'source-atop';
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(stepCanvases[4], logoX, logoY, baseLogoW, baseLogoH);
            ctx.restore();
          }
        } else {
          // Sequence Complete!
          document.body.style.overflow = prevBodyOverflow;
          document.documentElement.style.overflow = prevHtmlOverflow;
          URL.revokeObjectURL(svgUrl);
          window.removeEventListener('terraheal:scene-ready', handleSceneReady);
          window.dispatchEvent(new CustomEvent('terraheal:intro-complete'));
          setActiveSession(null);
          return;
        }
      }

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
      window.removeEventListener('terraheal:scene-ready', handleSceneReady);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      URL.revokeObjectURL(svgUrl);
    };
  }, [activeSession?.id]);

  if (!activeSession) return null;

  // Reduced motion accessible fallback
  if (isReducedMotion) {
    const encodedSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent(introSvgRaw);
    return (
      <div
        className={`fixed inset-0 z-[99999] flex items-center justify-center bg-[#0becc2] transition-opacity duration-350 pointer-events-auto ${
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
