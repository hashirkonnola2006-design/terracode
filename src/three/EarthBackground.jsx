import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SpaceBackground } from '../components/hero3d/SpaceBackground';
import { Sun } from '../components/hero3d/Sun';
import { Earth, AXIAL_TILT_X, AXIAL_TILT_Z, INITIAL_ROTATION_Y } from '../components/hero3d/Earth';
import { Clouds } from '../components/hero3d/Clouds';
import { Atmosphere } from '../components/hero3d/Atmosphere';
import { Smog } from '../components/hero3d/Smog';
import { Effects } from '../components/hero3d/Effects';

const BackgroundSceneController = ({
  health = 0,
  healMaskManager = null,
  liteMode = false,
  enableOrbit = false,
  customCameraZ = 3.2,
  spinRate = 0.012,
  isResults = false,
}) => {
  const planetGroupRef = useRef(null);
  const controlsRef = useRef(null);
  const isDragging = useRef(false);
  const smoothHealth = useRef(health / 100);

  const currentEarthPos = useRef(new THREE.Vector3(0, 0, 0));
  const currentCameraZ = useRef(customCameraZ);
  const currentScale = useRef(1.0);
  const transitionActive = useRef(true);
  const prevIsResults = useRef(isResults);

  useEffect(() => {
    if (prevIsResults.current !== isResults) {
      prevIsResults.current = isResults;
      transitionActive.current = true;
    }
  }, [isResults]);

  const { size, camera } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const isPortrait = aspect < 1.05;
  const isMobile = size.width < 768 || isPortrait;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (isResults && isMobile) {
      // Shift viewport so Earth appears centered in top half above the bottom sheet
      camera.setViewOffset(
        size.width,
        size.height,
        0,
        Math.round(size.height * 0.14),
        size.width,
        size.height
      );
    } else {
      camera.clearViewOffset();
    }
  }, [isResults, isMobile, size.width, size.height, camera]);

  useEffect(() => {
    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.y = INITIAL_ROTATION_Y;
    }
  }, []);

  const hasSignaledReady = useRef(false);

  useFrame((_, delta) => {
    if (!hasSignaledReady.current) {
      hasSignaledReady.current = true;
      window.dispatchEvent(new CustomEvent('terraheal:scene-ready'));
    }

    const targetHealth = health / 100;
    smoothHealth.current = THREE.MathUtils.lerp(
      smoothHealth.current,
      targetHealth,
      Math.min(delta * 3.5, 1.0)
    );

    // Calculate target position, camera pullback, and scale based on screen state
    let targetEarthX = 0;
    let targetEarthY = 0;
    let targetCamZ = customCameraZ;
    let targetScale = 1.0;

    if (isResults) {
      if (isMobile) {
        // Mobile: Earth in top half (prominent, fully visible above bottom sheet)
        targetEarthX = 0.0;
        targetEarthY = 0.0;
        targetCamZ = 3.1;
        targetScale = 0.74;
      } else {
        // Desktop: Results card on left (~420px), Earth prominent and centered in remaining space with slight zoom out
        targetEarthX = Math.min(1.08, Math.max(0.85, 0.58 * aspect));
        targetEarthY = 0.0;
        targetCamZ = 3.05; // Balanced "little zoom out" keeping globe prominent and clear
        targetScale = 1.0;
      }
    } else {
      if (isPortrait) {
        targetEarthX = 0;
        targetEarthY = 0;
        targetCamZ = Math.min(4.4, customCameraZ / Math.max(0.65, aspect * 1.1));
        targetScale = 1.0;
      } else {
        targetEarthX = 0;
        targetEarthY = 0;
        targetCamZ = customCameraZ;
        targetScale = 1.0;
      }
    }

    // Smooth transition over ~1.2s ease-out (snaps instantly if reduced motion)
    const lerpSpeed = prefersReducedMotion ? 1.0 : Math.min(delta * 2.8, 1.0);
    currentEarthPos.current.x = THREE.MathUtils.lerp(currentEarthPos.current.x, targetEarthX, lerpSpeed);
    currentEarthPos.current.y = THREE.MathUtils.lerp(currentEarthPos.current.y, targetEarthY, lerpSpeed);
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, lerpSpeed);

    if (transitionActive.current) {
      currentCameraZ.current = THREE.MathUtils.lerp(currentCameraZ.current, targetCamZ, lerpSpeed);
      camera.position.z = currentCameraZ.current;
      if (Math.abs(currentCameraZ.current - targetCamZ) < 0.02) {
        transitionActive.current = false;
      }
    }

    if (planetGroupRef.current) {
      planetGroupRef.current.position.set(
        currentEarthPos.current.x,
        currentEarthPos.current.y,
        0
      );
      planetGroupRef.current.scale.set(
        currentScale.current,
        currentScale.current,
        currentScale.current
      );

      // Auto-rotate Earth slowly so all sides can be seen; PAUSE while user drags
      if (!isDragging.current) {
        planetGroupRef.current.rotation.y += delta * spinRate;
      }
    }

    if (controlsRef.current) {
      controlsRef.current.target.set(
        currentEarthPos.current.x,
        currentEarthPos.current.y,
        0
      );
    }
  });

  const pollution = 1.0 - smoothHealth.current;

  return (
    <>
      {enableOrbit && (
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={2.4}
          maxDistance={3.5}
          rotateSpeed={0.55}
          dampingFactor={0.06}
          enableDamping
          onStart={() => {
            isDragging.current = true;
          }}
          onEnd={() => {
            isDragging.current = false;
          }}
        />
      )}

      <SpaceBackground reducedMotion={prefersReducedMotion} qualityOverride={liteMode ? 'LOW' : 'HIGH'} />
      <Sun healProgress={smoothHealth.current} isLowEnd={liteMode} />

      <group
        ref={planetGroupRef}
        rotation={[AXIAL_TILT_X, 0, AXIAL_TILT_Z]}
        scale={1.0}
      >
        <Earth
          autoRotate={false}
          noGroupTilt={true}
          healProgress={smoothHealth.current}
          pollution={pollution}
          healMaskManager={healMaskManager}
          isLowEnd={liteMode}
        />
        <Clouds
          autoRotate={false}
          noGroupTilt={true}
          healProgress={smoothHealth.current}
          pollution={pollution}
          healMaskManager={healMaskManager}
        />
        <Atmosphere
          healProgress={smoothHealth.current}
          pollution={pollution}
        />
        <Smog
          pollution={pollution}
          escalation={0.5}
          healMaskManager={healMaskManager}
        />
      </group>
    </>
  );
};

export const EarthBackground = ({
  health = 0,
  healMaskManager = null,
  liteMode = false,
  enableOrbit = false,
  customCameraZ = 3.2,
  spinRate = 0.012,
  isResults = false,
}) => {
  return (
    <div
      className={`fixed inset-0 z-0 bg-[#030712] select-none ${
        enableOrbit ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <Canvas
        gl={{
          preserveDrawingBuffer: false,
          antialias: !liteMode,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        camera={{ position: [0, 0, customCameraZ], fov: 42 }}
        dpr={[1, liteMode ? 1 : Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 2)]}
      >
        <Suspense fallback={null}>
          <BackgroundSceneController
            health={health}
            healMaskManager={healMaskManager}
            liteMode={liteMode}
            enableOrbit={enableOrbit}
            customCameraZ={customCameraZ}
            spinRate={spinRate}
            isResults={isResults}
          />
          {!liteMode && <Effects isLowEnd={liteMode} />}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default EarthBackground;
