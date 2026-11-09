import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS (Maintained for full backward compatibility)
// ═══════════════════════════════════════════════════════════════
export const SUN_CORE_RADIUS        = 0.08;
export const SUN_GLOW_SIZE_POLLUTED = 1.65;
export const SUN_GLOW_SIZE_HEALED   = 1.45;
export const RAY_COUNT              = 10;
export const RAY_LENGTH             = 2.4;
export const RAY_WIDTH              = 0.085;
export const ANAMORPHIC_WIDTH       = 2.4;
export const ANAMORPHIC_HEIGHT      = 0.035;

export const SUN_ANCHOR_X_DESKTOP   = 0.46;
export const SUN_ANCHOR_Y_DESKTOP   = 0.38;
export const SUN_ANCHOR_X_MOBILE    = 0.38;
export const SUN_ANCHOR_Y_MOBILE    = 0.42;
export const SUN_POSITION           = [-1.95, 1.10, 0.15];

export const LIGHT_DISTANCE         = 8.5;
export const SUN_LIGHT_INTENSITY_POLLUTED = 3.2;
export const SUN_LIGHT_INTENSITY_HEALED   = 3.8;
export const SUN_LIGHT_COLOR_POLLUTED     = '#fff3e0';
export const SUN_LIGHT_COLOR_HEALED       = '#ffffff';

export const SHADOW_MAP_SIZE_HIGH   = 2048;
export const SHADOW_MAP_SIZE_LOW    = 1024;
export const SHADOW_FRUSTUM_SIZE    = 3.4;
export const SHADOW_BIAS            = -0.0005;
export const SHADOW_NORMAL_BIAS     = 0.04;
export const SHADOW_RADIUS          = 3.5;
export const SHADOW_NEAR            = 0.1;
export const SHADOW_FAR             = 28.0;

export const AMBIENT_COLOR          = '#0b1329';
export const AMBIENT_INTENSITY      = 0.40;
export const RIM_LIGHT_COLOR        = '#93c5fd';
export const RIM_LIGHT_INTENSITY    = 0.50;

export const PULSE_SPEED            = 0.8;
export const PULSE_AMPLITUDE        = 0.015;
export const CORONA_SCALE_POLLUTED  = SUN_GLOW_SIZE_POLLUTED;
export const CORONA_SCALE_HEALED    = SUN_GLOW_SIZE_HEALED;
export const STREAK_WIDTH_POLLUTED  = ANAMORPHIC_WIDTH;
export const STREAK_WIDTH_HEALED    = ANAMORPHIC_WIDTH;
export const STREAK_HEIGHT          = ANAMORPHIC_HEIGHT;

/**
 * Lighting Rig: Fully illuminates the visible Earth hemisphere.
 * The key directional light is tethered to the camera, offset slightly up and left,
 * so the visible hemisphere stays fully lit with gentle form definition and no black shadow side.
 * Sun meshes, flares, and bloom sources have been removed (archived in ArchivedSun.jsx).
 */
export const Sun = ({ healProgress = 0, isLowEnd = false }) => {
  const dirLightRef    = useRef(null);
  const lightTargetRef = useRef(null);

  // Pre-allocated vectors & colors to avoid GC in useFrame
  const lightPosVec    = useRef(new THREE.Vector3());
  const camRightVec    = useRef(new THREE.Vector3());
  const camUpVec       = useRef(new THREE.Vector3());
  const camForwardVec  = useRef(new THREE.Vector3());
  const lightColorLerp = useRef(new THREE.Color());

  const colPolluted = useMemo(() => new THREE.Color(SUN_LIGHT_COLOR_POLLUTED), []);
  const colHealed   = useMemo(() => new THREE.Color(SUN_LIGHT_COLOR_HEALED), []);

  useLayoutEffect(() => {
    if (dirLightRef.current && lightTargetRef.current) {
      dirLightRef.current.target = lightTargetRef.current;
    }
  }, []);

  useFrame(({ camera }) => {
    if (dirLightRef.current) {
      // Key directional light attached to camera, offset slightly up and left
      camRightVec.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
      camUpVec.current.set(0, 1, 0).applyQuaternion(camera.quaternion);
      camForwardVec.current.set(0, 0, -1).applyQuaternion(camera.quaternion);

      lightPosVec.current
        .copy(camera.position)
        .addScaledVector(camRightVec.current, -1.35)
        .addScaledVector(camUpVec.current, 1.65)
        .addScaledVector(camForwardVec.current, -0.6);

      dirLightRef.current.position.copy(lightPosVec.current);

      if (lightTargetRef.current) {
        lightTargetRef.current.position.set(0, 0, 0);
      }

      lightColorLerp.current.copy(colPolluted).lerp(colHealed, healProgress);
      dirLightRef.current.color.copy(lightColorLerp.current);

      const targetIntensity = THREE.MathUtils.lerp(
        SUN_LIGHT_INTENSITY_POLLUTED,
        SUN_LIGHT_INTENSITY_HEALED,
        healProgress
      );
      dirLightRef.current.intensity = targetIntensity;
    }
  });

  const shadowMapSize = isLowEnd ? SHADOW_MAP_SIZE_LOW : SHADOW_MAP_SIZE_HIGH;

  return (
    <group>
      {/* Target for directional light (Earth center) */}
      <object3D ref={lightTargetRef} position={[0, 0, 0]} />

      {/* Primary Key Directional Light (Camera Tethered, Offset Up-Left) */}
      <directionalLight
        ref={dirLightRef}
        position={[-1.5, 2.0, 3.5]}
        intensity={SUN_LIGHT_INTENSITY_POLLUTED}
        castShadow={!isLowEnd}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-left={-SHADOW_FRUSTUM_SIZE}
        shadow-camera-right={SHADOW_FRUSTUM_SIZE}
        shadow-camera-top={SHADOW_FRUSTUM_SIZE}
        shadow-camera-bottom={-SHADOW_FRUSTUM_SIZE}
        shadow-camera-near={SHADOW_NEAR}
        shadow-camera-far={SHADOW_FAR}
        shadow-bias={SHADOW_BIAS}
        shadow-normalBias={SHADOW_NORMAL_BIAS}
        shadow-radius={SHADOW_RADIUS}
      />

      {/* Hemisphere Light: Daylight sky fill + slate ground bounce so nothing goes black */}
      <hemisphereLight
        args={['#e0f2fe', '#1e293b', 0.95]}
      />

      {/* Ambient Fill Light */}
      <ambientLight
        intensity={AMBIENT_INTENSITY}
        color={AMBIENT_COLOR}
      />

      {/* Soft cool rim light from opposite quadrant for crisp edge definition */}
      <directionalLight
        position={[2.0, -1.5, -2.0]}
        color={RIM_LIGHT_COLOR}
        intensity={RIM_LIGHT_INTENSITY}
        castShadow={false}
      />
    </group>
  );
};

export default Sun;
