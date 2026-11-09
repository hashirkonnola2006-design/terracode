import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { SpaceBackground } from '../components/hero3d/SpaceBackground';
import { Sun } from '../components/hero3d/Sun';
import { Earth } from '../components/hero3d/Earth';
import { Clouds } from '../components/hero3d/Clouds';
import { Atmosphere } from '../components/hero3d/Atmosphere';
import { Effects } from '../components/hero3d/Effects';
import { InteractiveOrbit } from './InteractiveOrbit';
import { InteractiveSmog } from './InteractiveSmog';
import { InteractiveForests } from './InteractiveForests';
import { InteractiveOceans } from './InteractiveOceans';

const SceneController = ({ cleanliness, liteMode, onCanvasRef }) => {
  const earthGroupRef = useRef(null);
  const controlsRef = useRef(null);
  const smoothCleanliness = useRef(cleanliness / 100);

  // Smoothly lerp visual cleanliness state (never snap)
  useFrame((state, delta) => {
    const target = cleanliness / 100;
    smoothCleanliness.current = THREE.MathUtils.lerp(smoothCleanliness.current, target, delta * 3.5);

    // Auto slow rotate when idle or at 100% finished
    if (earthGroupRef.current && cleanliness >= 100) {
      earthGroupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={1.8}
        maxDistance={4.5}
        rotateSpeed={0.65}
        dampingFactor={0.06}
        enableDamping
      />

      <SpaceBackground reducedMotion={false} />
      <Sun healProgress={cleanliness / 100} isLowEnd={liteMode} />

      <group ref={earthGroupRef} scale={1.0}>
        <Earth healProgress={cleanliness / 100} />
        <Clouds healProgress={cleanliness / 100} />
        <Atmosphere healProgress={cleanliness / 100} />

        {/* Mission 1: Floating Orbit Trash */}
        <InteractiveOrbit isInteractive={true} />

        {/* Mission 2: Smog Sources to Clean Energy */}
        <InteractiveSmog isInteractive={true} />

        {/* Mission 3: Continental Forest Reforestation */}
        <InteractiveForests isInteractive={true} />

        {/* Mission 4: Ocean Plastic Sweeper */}
        <InteractiveOceans isInteractive={true} />
      </group>
    </>
  );
};

export const CleaningScene = () => {
  const cleanliness = useGameStore((s) => s.cleanliness);
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
          preserveDrawingBuffer: true, // Needed for "Download my clean Earth" canvas screenshot
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
