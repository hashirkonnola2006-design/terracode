import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { SpaceBackground } from '../components/hero3d/SpaceBackground';
import { Sun } from '../components/hero3d/Sun';
import { Earth, AXIAL_TILT_X, AXIAL_TILT_Z, INITIAL_ROTATION_Y } from '../components/hero3d/Earth';
import { Clouds } from '../components/hero3d/Clouds';
import { Atmosphere } from '../components/hero3d/Atmosphere';
import { Smog } from '../components/hero3d/Smog';
import { Effects } from '../components/hero3d/Effects';
import { InteractiveOrbit } from './InteractiveOrbit';
import { InteractiveSmog } from './InteractiveSmog';
import { InteractiveForests } from './InteractiveForests';
import { InteractiveOceans } from './InteractiveOceans';
import { healMask } from './HealMask';

const EMPTY_REGIONS = [];

const SceneController = ({ cleanliness, liteMode, onCanvasRef }) => {
  const planetGroupRef = useRef(null);
  const orbitGroupRef = useRef(null);
  const controlsRef = useRef(null);
  const smoothCleanliness = useRef(cleanliness / 100);
  const { size, camera } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const isPortrait = aspect < 1.05;
  const initialAdjusted = useRef(false);

  // Auto-rotation idle & drag state
  const isUserInteracting = useRef(false);
  const lastInteractionTime = useRef(performance.now());
  const currentSpinSpeed = useRef(0.014);
  const currentScale = useRef(1.0);
  const hasSignaledReady = useRef(false);

  // Heal mask persistence: restore saved regions on mount and synchronize on game resets
  const healRegions = useGameStore((s) => s.cleanup?.healRegions ?? s.healRegions ?? EMPTY_REGIONS);
  useEffect(() => {
    if (cleanliness === 0) {
      smoothCleanliness.current = 0.0;
      healMask.clear();
    } else if (cleanliness >= 100) {
      healMask.fill();
    } else if (healRegions && healRegions.length > 0) {
      healMask.restoreRegions(healRegions);
    } else {
      healMask.clear();
    }
  }, [cleanliness, healRegions]);

  // Responsive camera initial distance on mobile/portrait
  useEffect(() => {
    if (!initialAdjusted.current) {
      if (isPortrait) {
        const responsiveZ = Math.min(6.2, 3.2 / Math.max(0.50, aspect * 1.15));
        camera.position.z = responsiveZ;
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }
      initialAdjusted.current = true;
    }
  }, [isPortrait, aspect, camera]);

  // Set initial planet orientation
  useEffect(() => {
    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.y = INITIAL_ROTATION_Y;
    }
  }, []);

  // Listen to OrbitControls interaction events to pause/resume auto-rotation
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onStart = () => {
      isUserInteracting.current = true;
    };
    const onEnd = () => {
      isUserInteracting.current = false;
      lastInteractionTime.current = performance.now();
    };

    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);
    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
    };
  }, []);

  // Render loop: smooth pollution lerp, auto-rotation on planet group only
  useFrame((state, delta) => {
    if (!hasSignaledReady.current) {
      hasSignaledReady.current = true;
      window.dispatchEvent(new CustomEvent('terraheal:scene-ready'));
    }

    const target = cleanliness / 100;
    smoothCleanliness.current = THREE.MathUtils.lerp(smoothCleanliness.current, target, Math.min(delta * 3.5, 1.0));

    const now = performance.now();
    const isIdle = !isUserInteracting.current && (now - lastInteractionTime.current > 2000);

    // Target spin speed: 0.016 when polluted, slows to 0.010 when healed, 0.0 during user drag
    const baseTargetSpeed = THREE.MathUtils.lerp(0.016, 0.010, smoothCleanliness.current);
    const targetSpeed = isIdle ? baseTargetSpeed : 0.0;

    currentSpinSpeed.current = THREE.MathUtils.lerp(
      currentSpinSpeed.current,
      targetSpeed,
      Math.min(delta * 2.0, 1.0)
    );

    // ONE SINGLE PLANET GROUP ROTATION:
    // Earth, Clouds, Atmosphere, Smog, Forests, Smog sources, and Oceans all rotate together in lockstep!
    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.y += delta * currentSpinSpeed.current;

      // When 100% healed and on desktop, smoothly scale down slightly and frame in right viewport so it's not obscured
      const targetPosX = (!isPortrait && cleanliness >= 100) ? 0.48 : 0.0;
      const targetPosY = (isPortrait && cleanliness >= 100) ? 0.36 : 0.0;
      const targetScale = cleanliness >= 100 ? (isPortrait ? 0.70 : 0.80) : 1.0;

      currentScale.current = THREE.MathUtils.lerp(
        currentScale.current,
        targetScale,
        Math.min(delta * 2.2, 1.0)
      );
      planetGroupRef.current.scale.setScalar(currentScale.current);

      planetGroupRef.current.position.x = THREE.MathUtils.lerp(
        planetGroupRef.current.position.x,
        targetPosX,
        Math.min(delta * 2.5, 1.0)
      );
      planetGroupRef.current.position.y = THREE.MathUtils.lerp(
        planetGroupRef.current.position.y,
        targetPosY,
        Math.min(delta * 2.5, 1.0)
      );

      if (controlsRef.current) {
        controlsRef.current.target.x = THREE.MathUtils.lerp(controlsRef.current.target.x, targetPosX, Math.min(delta * 2.5, 1.0));
        controlsRef.current.target.y = THREE.MathUtils.lerp(controlsRef.current.target.y, targetPosY, Math.min(delta * 2.5, 1.0));
      }
    }

    // Free-floating orbit debris rotates at its own leisurely rate and tracks planet position
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.y += delta * 0.006;
      if (planetGroupRef.current) {
        orbitGroupRef.current.position.x = planetGroupRef.current.position.x;
        orbitGroupRef.current.position.y = planetGroupRef.current.position.y;
      }
    }
  });

  const currentClean = cleanliness === 0 ? 0.0 : smoothCleanliness.current;
  const pollutionVal = cleanliness === 0 ? 1.0 : (1.0 - smoothCleanliness.current);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={2.2}
        maxDistance={isPortrait ? 4.0 : 3.6}
        rotateSpeed={0.65}
        dampingFactor={0.06}
        enableDamping
      />

      <SpaceBackground reducedMotion={false} qualityOverride={liteMode ? 'LOW' : 'HIGH'} />
      <Sun healProgress={cleanliness / 100} isLowEnd={liteMode} />

      {/* ── ONE UNIFIED PLANET GROUP ──
          Earth, clouds, atmosphere, smog shell, industrial plumes, forests,
          smog/energy sources, and oceans are ALL children of this group.
          They inherit identical rotation and axial tilt with zero desync! ── */}
      <group
        ref={planetGroupRef}
        rotation={[AXIAL_TILT_X, 0, AXIAL_TILT_Z]}
        scale={1.0}
      >
        {/* Photorealistic Earth Mesh with NASA Maps & Local Heal Mask */}
        <Earth
          autoRotate={false}
          noGroupTilt={true}
          healProgress={currentClean}
          pollution={pollutionVal}
          healMaskManager={healMask}
          isLowEnd={liteMode}
        />

        {/* Cloud Atmosphere Envelope */}
        <Clouds
          autoRotate={false}
          noGroupTilt={true}
          healProgress={currentClean}
          pollution={pollutionVal}
          healMaskManager={healMask}
        />

        {/* Thin Atmospheric Rim Glow */}
        <Atmosphere
          healProgress={currentClean}
          pollution={pollutionVal}
        />

        {/* Smog Shell & Industrial Smoke Plumes (Anchored to Earth) */}
        <Smog
          pollution={pollutionVal}
          escalation={0.5}
        />

        {/* Mission 2: Smog Sources to Clean Energy (Industrial factory -> Wind / Solar) */}
        <InteractiveSmog isInteractive={true} />

        {/* Mission 3: Continental Forest Reforestation (Dead patches -> Lush canopy) */}
        <InteractiveForests isInteractive={true} />

        {/* Mission 4: Ocean Plastic Sweeper (Gyre waste & oily decals -> Pristine ocean) */}
        <InteractiveOceans isInteractive={true} />
      </group>

      {/* ── FREE-FLOATING ORBITAL DEBRIS ──
          Mission 1: Debris orbits freely in low Earth space */}
      <group ref={orbitGroupRef}>
        <InteractiveOrbit isInteractive={true} />
      </group>
    </>
  );
};

export const CleaningScene = () => {
  const cleanliness = useGameStore((s) => s.cleanup?.health ?? s.cleanliness ?? 0);
  const liteMode = useGameStore((s) => s.liteMode);
  const setLiteMode = useGameStore((s) => s.setLiteMode);
  const canvasRef = useRef(null);

  // FPS monitor to auto-enable Lite Mode if performance dips below 30 for 3 seconds
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let lowFpsCount = 0;

    const checkFps = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;

        if (fps < 30) {
          lowFpsCount++;
          if (lowFpsCount >= 3 && !liteMode) {
            setLiteMode(true);
          }
        } else {
          lowFpsCount = 0;
        }
      }
      animId = requestAnimationFrame(checkFps);
    };

    let animId = requestAnimationFrame(checkFps);
    return () => cancelAnimationFrame(animId);
  }, [liteMode, setLiteMode]);

  return (
    <div className="fixed inset-0 z-0 bg-[#030712] select-none">
      <Canvas
        ref={canvasRef}
        gl={{
          preserveDrawingBuffer: true,
          antialias: !liteMode,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        camera={{ position: [0, 0, 3.2], fov: 42 }}
        dpr={[1, liteMode ? 1 : Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 2)]}
        shadows={!liteMode}
      >
        <Suspense fallback={null}>
          <SceneController cleanliness={cleanliness} liteMode={liteMode} onCanvasRef={canvasRef} />
          {!liteMode && <Effects isLowEnd={liteMode} />}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default CleaningScene;
