import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EarthShaderMaterial } from './shaders/earthShader';
import { AtmosphereShaderMaterial } from './shaders/atmosphereShader';

interface EarthSphereProps {
  healProgress: number;   // 0 → polluted, 1 → healed
  scrollRotation?: number; // extra Y-rotation from scroll (radians)
  lowDetail?: boolean;
}

/**
 * EarthSphere
 *
 * Layer stack (back to front):
 *   1. Atmosphere halo  – back-face sphere, scale 1.14
 *   2. Earth surface    – custom ShaderMaterial (earthShader.ts)
 *   3. Cloud sphere     – semi-transparent, scale 1.013
 *      • opacity 0.7 when polluted (dark smog brown)
 *      • opacity 0.5 when healed  (white wispy clouds)
 *
 * Lighting: one directional "sun" from upper-left provided via
 * the `uSunDir` uniform so the same vector drives both the surface
 * and atmosphere shaders (keeps shadows consistent).
 *
 * Camera position is passed as `uCameraPos` so world-space Fresnel
 * and specular are computed correctly (view-space normals alone
 * break when the mesh rotates).
 */
export const EarthSphere: React.FC<EarthSphereProps> = ({
  healProgress,
  scrollRotation = 0,
  lowDetail = false,
}) => {
  const earthRef  = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);
  const atmoRef   = useRef<THREE.Mesh>(null!);
  const earthMat  = useRef<THREE.ShaderMaterial>(null!);
  const atmoMat   = useRef<THREE.ShaderMaterial>(null!);

  const { camera } = useThree();

  // ── Textures ───────────────────────────────────────────
  const [dayMap, specularMap, nightMap, cloudsMap] = useTexture([
    '/textures/earth_atmos_2048.jpg',
    '/textures/earth_specular_2048.jpg',
    '/textures/earth_lights_2048.png',
    '/textures/earth_clouds_1024.png',
  ]);

  // Anisotropic filtering sharpens the textures at oblique angles
  [dayMap, specularMap, nightMap, cloudsMap].forEach((t) => {
    t.anisotropy = 4;
  });

  // ── Earth shader uniforms (clone so each instance is independent) ──
  const earthUniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(EarthShaderMaterial.uniforms);
    u.uDayMap.value      = dayMap;
    u.uSpecularMap.value = specularMap;
    u.uNightMap.value    = nightMap;
    u.uCloudsMap.value   = cloudsMap;
    return u;
  }, [dayMap, specularMap, nightMap, cloudsMap]);

  // ── Atmosphere shader uniforms ─────────────────────────
  const atmoUniforms = useMemo(
    () => THREE.UniformsUtils.clone(AtmosphereShaderMaterial.uniforms),
    []
  );

  // ── Cloud material (plain MeshStandardMaterial, not custom) ──
  // We rely on Three.js built-in lighting for clouds so they respond
  // naturally to the same directional sun light added in EarthCanvas.
  const cloudsMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map:         cloudsMap,
      transparent: true,
      opacity:     0.6,
      blending:    THREE.NormalBlending,
      depthWrite:  false,
    });
    return m;
  }, [cloudsMap]);

  // ── Per-frame update ───────────────────────────────────
  useFrame((state) => {
    const t = state.clock.elapsedTime;

    /* Pass current camera world-position to shaders so world-space
       Fresnel and specular are always correct regardless of rotation. */
    const camPos = camera.position;

    if (earthMat.current) {
      const u = earthMat.current.uniforms;
      u.uTime.value      = t;
      u.uHeal.value      = THREE.MathUtils.lerp(u.uHeal.value, healProgress, 0.08);
      u.uCameraPos.value.copy(camPos);
    }
    if (atmoMat.current) {
      const u = atmoMat.current.uniforms;
      u.uHeal.value      = THREE.MathUtils.lerp(u.uHeal.value, healProgress, 0.08);
      u.uCameraPos.value.copy(camPos);
    }

    // Idle Y rotation (slow spin) + scroll-driven offset
    const yRot = t * 0.045 + scrollRotation;
    // Slight axial tilt (Earth's real tilt is 23.4° ≈ 0.41 rad)
    const tiltX = 0.18, tiltZ = 0.0;

    if (earthRef.current) {
      earthRef.current.rotation.set(tiltX, yRot, tiltZ);
    }
    if (cloudsRef.current) {
      // Clouds rotate ~8 % faster for parallax depth
      cloudsRef.current.rotation.set(tiltX, yRot * 1.08, tiltZ);
      // Cloud opacity: thick brown smog when polluted, wispy white when healed
      const h = earthMat.current?.uniforms.uHeal.value ?? healProgress;
      cloudsMat.opacity = THREE.MathUtils.lerp(cloudsMat.opacity,
        0.72 - h * 0.28, // 0.72 → 0.44 (smog→clouds)
        0.06);
      cloudsMat.color.lerpColors(
        new THREE.Color(0.28, 0.22, 0.14), // smog brown
        new THREE.Color(1.0,  1.0,  1.0),  // white cloud
        h
      );
    }
    if (atmoRef.current) {
      atmoRef.current.rotation.set(tiltX, yRot, tiltZ);
    }
  });

  const seg = lowDetail ? 36 : 64;

  return (
    <group>
      {/* ── 1. Atmosphere halo (back-face, slightly larger) ── */}
      <mesh ref={atmoRef} scale={1.14}>
        <sphereGeometry args={[1, seg, seg]} />
        <shaderMaterial
          ref={atmoMat}
          uniforms={atmoUniforms}
          vertexShader={AtmosphereShaderMaterial.vertexShader}
          fragmentShader={AtmosphereShaderMaterial.fragmentShader}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── 2. Earth surface ── */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, seg, seg]} />
        <shaderMaterial
          ref={earthMat}
          uniforms={earthUniforms}
          vertexShader={EarthShaderMaterial.vertexShader}
          fragmentShader={EarthShaderMaterial.fragmentShader}
        />
      </mesh>

      {/* ── 3. Cloud / smog sphere ── */}
      <mesh ref={cloudsRef} scale={1.013}>
        <sphereGeometry args={[1, seg, seg]} />
        <primitive object={cloudsMat} attach="material" />
      </mesh>
    </group>
  );
};
