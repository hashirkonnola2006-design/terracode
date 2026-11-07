import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceBackground } from './SpaceBackground';
import { Sun } from './Sun';
import { Earth } from './Earth';
import { SurfaceClutter } from './SurfaceClutter';
import { Clouds } from './Clouds';
import { Atmosphere } from './Atmosphere';
import { FloatingDebris } from './FloatingDebris';
import { Effects } from './Effects';
import { useHealProgress, HEAL_DAMPING } from './useHealProgress';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Hero 3D Scene Controller)
// ═══════════════════════════════════════════════════════════════
export const CAMERA_FOV = 40;                 // Perspective camera field of view
export const CAMERA_START_Z = 3.65;           // Push-in animation start distance
export const CAMERA_BASE_Z = 3.20;            // Normal viewing distance (~60% Earth height)
export const EARTH_BASE_SCALE = 0.70;         // Produces ~60% viewport height coverage
export const MOUSE_PARALLAX_X = 0.14;         // Horizontal parallax sensitivity
export const MOUSE_PARALLAX_Y = 0.09;         // Vertical parallax sensitivity
export const SCROLL_ZOOM_FACTOR = 0.18;       // Gentle scale-up as user scrolls

const WorldController = ({
  scrollProgress = 0,
  healProgress = 0,
  mousePos = { x: 0, y: 0 },
  reducedMotion = false,
  isLowEnd = false
}) => {
  const earthGroupRef = useRef(null);
  const introProgress = useRef(0);

  useFrame((state, delta) => {
    // 1. Initial on-load camera push-in
    if (introProgress.current < 1.0) {
      introProgress.current = Math.min(1.0, introProgress.current + delta * 0.85);
    }
    const smoothIntro = THREE.MathUtils.smoothstep(introProgress.current, 0, 1);
    const targetZ = THREE.MathUtils.lerp(CAMERA_START_Z, CAMERA_BASE_Z, smoothIntro);

    // 2. Subtle mouse parallax camera offset
    const targetCamX = reducedMotion ? 0 : mousePos.x * MOUSE_PARALLAX_X;
    const targetCamY = reducedMotion ? 0 : mousePos.y * MOUSE_PARALLAX_Y;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, 0.08);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, 0.08);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.08);
    state.camera.lookAt(0, 0, 0);

    // 3. Gentle scroll-linked zoom
    if (earthGroupRef.current) {
      const scaleMultiplier = 1.0 + scrollProgress * SCROLL_ZOOM_FACTOR;
      const targetScale = EARTH_BASE_SCALE * scaleMultiplier;
      const s = THREE.MathUtils.lerp(earthGroupRef.current.scale.x, targetScale, 0.1);
      earthGroupRef.current.scale.set(s, s, s);
    }
  });

  return (
    <>
      <SpaceBackground mousePos={mousePos} reducedMotion={reducedMotion} />
      <Sun healProgress={healProgress} reducedMotion={reducedMotion} isLowEnd={isLowEnd} />

      <group ref={earthGroupRef} scale={EARTH_BASE_SCALE}>
        <Earth scrollRotation={scrollProgress * 1.5} healProgress={healProgress} />
        <SurfaceClutter
          scrollRotation={scrollProgress * 1.5}
          healProgress={healProgress}
          isLowEnd={isLowEnd}
        />
        <Clouds scrollRotation={scrollProgress * 1.5} healProgress={healProgress} />
        <Atmosphere healProgress={healProgress} />
      </group>

      <FloatingDebris mousePos={mousePos} healProgress={healProgress} />
    </>
  );
};

export const Scene = ({ scrollProgress = 0, scrollVelocity = 0, onTelemetry }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  // Heal Progress Manager (supports ?heal=0.5 URL param and scroll scrub)
  const { currentHealRef, targetHealRef, forcedHeal, setForcedHeal } = useHealProgress(scrollProgress);
  const [activeHeal, setActiveHeal] = useState(forcedHeal ?? 0);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__setHeal = (val) => {
        setForcedHeal(val);
        currentHealRef.current = val;
        setActiveHeal(val);
      };
    }
  }, [setForcedHeal, currentHealRef]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const lowThreads = typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    setIsLowEnd(isMobile || !!lowThreads);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    // Detect ?debug=1 or ?heal
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('debug') === '1' || p.get('heal') !== null) {
        setShowDebug(true);
      }
    }

    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    const timer = setTimeout(() => setCanvasReady(true), 100);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  // Frame tick to smooth healProgress with damping
  useEffect(() => {
    let animId;
    const tick = () => {
      if (forcedHeal !== null) {
        currentHealRef.current = forcedHeal;
      } else {
        // Slow & heavy damping
        currentHealRef.current = THREE.MathUtils.lerp(
          currentHealRef.current,
          targetHealRef.current,
          HEAL_DAMPING
        );
      }
      setActiveHeal(currentHealRef.current);
      if (onTelemetry) {
        onTelemetry({
          activeSection: 'Hero',
          scale: EARTH_BASE_SCALE,
          brightness: 1.0,
          uHeal: currentHealRef.current,
          fps: 60,
        });
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [forcedHeal, onTelemetry, targetHealRef, currentHealRef]);

  return (
    <>
      <div
        className={`fixed inset-0 z-0 pointer-events-none select-none overflow-hidden transition-opacity duration-1000 ${
          canvasReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Canvas
          shadows={{ type: THREE.PCFSoftShadowMap }}
          camera={{ position: [0, 0, CAMERA_START_Z], fov: CAMERA_FOV }}
          dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1.75, 1.75)]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <WorldController
              scrollProgress={scrollProgress}
              healProgress={activeHeal}
              mousePos={mousePos}
              reducedMotion={reducedMotion}
              isLowEnd={isLowEnd}
            />
            <Effects isLowEnd={isLowEnd} />
          </Suspense>
        </Canvas>
      </div>

      {/* ── Optional Dev-Only Debug Slider (?debug=1 or ?heal) ── */}
      {showDebug && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 shadow-2xl text-xs text-slate-200 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-emerald-400">Earth Heal Scrub</span>
            <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded">
              {(activeHeal * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={activeHeal}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setForcedHeal(val);
            }}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="grid grid-cols-5 gap-1 mt-2 text-[10px] text-center">
            {[0, 0.25, 0.5, 0.75, 1.0].map((step) => (
              <button
                key={step}
                onClick={() => setForcedHeal(step)}
                className={`py-1 rounded border transition-colors ${
                  Math.abs(activeHeal - step) < 0.03
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {step * 100}%
              </button>
            ))}
          </div>
          {forcedHeal !== null && (
            <button
              onClick={() => setForcedHeal(null)}
              className="w-full mt-2 text-[10px] text-slate-400 hover:text-white underline text-center"
            >
              Resume Scroll-Driven Mode
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default Scene;
