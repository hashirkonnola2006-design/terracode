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
  customCameraZ = 3.3,
  spinRate = 0.014,
}) => {
  const planetGroupRef = useRef(null);
  const controlsRef = useRef(null);
  const smoothHealth = useRef(health / 100);
  const { size, camera } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const isPortrait = aspect < 1.05;

  useEffect(() => {
    if (isPortrait) {
      camera.position.z = Math.min(6.2, customCameraZ / Math.max(0.50, aspect * 1.15));
    } else {
      camera.position.z = customCameraZ;
    }
    camera.lookAt(0, 0, 0);
  }, [isPortrait, aspect, camera, customCameraZ]);

  useEffect(() => {
    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.y = INITIAL_ROTATION_Y;
    }
  }, []);

  useFrame((state, delta) => {
    const target = health / 100;
    smoothHealth.current = THREE.MathUtils.lerp(smoothHealth.current, target, Math.min(delta * 3.5, 1.0));

    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.y += delta * spinRate;
    }
  });

  const pollution = 1.0 - smoothHealth.current;

  return (
    <>
      {enableOrbit && (
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={false}
          rotateSpeed={0.5}
          dampingFactor={0.06}
          enableDamping
        />
      )}

      <SpaceBackground reducedMotion={false} qualityOverride={liteMode ? 'LOW' : 'HIGH'} />
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
  customCameraZ = 3.3,
  spinRate = 0.014,
}) => {
  return (
    <div className="fixed inset-0 z-0 bg-[#030712] pointer-events-none select-none">
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
          />
          {!liteMode && <Effects isLowEnd={liteMode} />}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default EarthBackground;

