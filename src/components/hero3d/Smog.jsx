import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EARTH_RADIUS } from './Earth';
import { healMask } from '../../three/HealMask';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS (Desaturated Industrial Smog Shell & Emitters)
// ═══════════════════════════════════════════════════════════════
export const SMOG_SHELL_RADIUS = EARTH_RADIUS * 1.018;

// Ash gray color palette (roughly #4a4642 to #6b5f58, no bright orange or yellow)
export const COLOR_SMOG_ASH_DARK  = new THREE.Color('#4a4642'); // vec3(0.29, 0.27, 0.26)
export const COLOR_SMOG_ASH_LIGHT = new THREE.Color('#6b5f58'); // vec3(0.42, 0.37, 0.35)

// 7 Real Industrial Plume Emitter Coordinates on Earth Surface (normalized to unit sphere)
// Lat / Lon conversion with Earth's initial rotation and axial orientation
function latLonToVector3(lat, lon, radius = 1.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

export const INDUSTRIAL_EMITTERS = [
  { name: 'East Asia',      pos: latLonToVector3(35.0, 115.0), count: 32 }, // North China Plain / Yangtze
  { name: 'South Asia',     pos: latLonToVector3(24.5, 82.0),  count: 32 }, // Indo-Gangetic Plain / India
  { name: 'Central Europe', pos: latLonToVector3(50.5, 9.5),   count: 28 }, // Ruhr / Industrial Germany
  { name: 'Eastern US',     pos: latLonToVector3(41.0, -80.5), count: 32 }, // Rust Belt / Megalopolis
  { name: 'Western US',     pos: latLonToVector3(36.5, -119.5), count: 28 }, // California / West Coast
  { name: 'Middle East',    pos: latLonToVector3(27.0, 50.0),  count: 24 }, // Persian Gulf industrial
  { name: 'Southeast Asia', pos: latLonToVector3(-6.2, 106.8), count: 24 }, // Java / Jakarta corridor
  { name: 'South America',  pos: latLonToVector3(-23.5, -46.6), count: 22 }, // São Paulo industrial hub
  { name: 'Central Africa', pos: latLonToVector3(-1.5, 22.0),  count: 22 }, // Central Africa / Congo
];

export const TOTAL_PUFFS = INDUSTRIAL_EMITTERS.reduce((acc, e) => acc + e.count, 0); // 188 puffs

// ── 1. ATMOSPHERIC SMOG SHELL SHADER ──
const SmogShellShader = {
  uniforms: {
    uPollution:  { value: 1.0 },
    uEscalation: { value: 0.5 },
    uTime:       { value: 0.0 },
    uCameraPos:  { value: new THREE.Vector3(0, 0, 3.65) },
    uHealMask:   { value: null },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    varying vec3 vObjectPos;

    void main() {
      vUv          = uv;
      vObjectPos   = position;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPos    = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uPollution;
    uniform float uEscalation;
    uniform float uTime;
    uniform vec3  uCameraPos;
    uniform sampler2D uHealMask;

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    varying vec3 vObjectPos;

    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float noise3D(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
        f.z
      );
    }

    void main() {
      float localHeal = texture2D(uHealMask, vUv).r;
      float effPollution = clamp(uPollution * (1.0 - localHeal * 0.95), 0.0, 1.0);

      if (effPollution < 0.005) discard;

      vec3 wn = normalize(vWorldNormal);
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      float NdotV = clamp(dot(wn, viewDir), 0.0, 1.0);

      // Fresnel limb falloff
      float horizon = pow(1.0 - NdotV, 2.0);

      // Multi-octave organic turbulence (billowing atmospheric smog, NO diagonal zebra bands)
      vec3 p = vObjectPos * 3.8 + vec3(0.0, uTime * 0.02, 0.0);
      float n1 = noise3D(p);
      float n2 = noise3D(p * 2.2 + vec3(uTime * 0.015, 0.0, 0.0)) * 0.5;
      float n3 = noise3D(p * 4.4) * 0.25;
      float organicSmog = (n1 + n2 + n3) / 1.75;
      float densityMod = 0.70 + 0.55 * organicSmog;

      // Desaturated ash-gray with faint warm rust tint
      vec3 ashDark  = vec3(0.26, 0.23, 0.20);
      vec3 ashLight = vec3(0.44, 0.38, 0.32);
      vec3 shellCol = mix(ashDark, ashLight, horizon * 0.6 + organicSmog * 0.4);

      // Clearly visible over unhealed regions from all angles, fading to zero where healed
      float baseAlpha = mix(0.18, 0.60, horizon);
      float alpha = baseAlpha * densityMod * effPollution * mix(0.65, 1.0, uEscalation);

      gl_FragColor = vec4(shellCol, clamp(alpha, 0.0, 0.85));
    }
  `
};

// ── 2. INSTANCED SMOKE PUFF SHADER (GPU-driven rising plumes anchored to Earth) ──
const SmokePuffShader = {
  uniforms: {
    uPollution:  { value: 1.0 },
    uEscalation: { value: 0.5 },
    uTime:       { value: 0.0 },
  },

  vertexShader: `
    attribute vec3  aEmitterPos;
    attribute vec3  aNormal;
    attribute vec3  aDrift;
    attribute float aPhase;
    attribute float aSpeed;
    attribute float aScale;

    uniform float uTime;
    uniform float uPollution;
    uniform float uEscalation;

    varying vec2  vUv;
    varying float vAlpha;

    void main() {
      vUv = uv;

      // Particle lifecycle t in [0.0, 1.0]
      float t = fract(uTime * aSpeed + aPhase);

      // Rise along surface normal from surface (r=1.002) up to r=1.12
      float riseDist = t * 0.11;
      vec3 puffCenter = aEmitterPos + aNormal * riseDist + aDrift * (t * t * 0.04);

      // Billow expansion: puff grows from small initial burst to wider cloud
      float puffGrowth = mix(0.016, 0.052, sqrt(t)) * aScale;

      // Billboarding in object/model space
      vec3 right = normalize(cross(aNormal, vec3(0.0, 1.0, 0.001)));
      vec3 up    = normalize(cross(right, aNormal));

      vec3 displacedPos = puffCenter + (right * position.x + up * position.y) * puffGrowth;

      // Alpha envelope: quick fade-in, smooth dissipation
      float fadeIn  = smoothstep(0.0, 0.15, t);
      float fadeOut = smoothstep(1.0, 0.65, t);
      vAlpha = fadeIn * fadeOut * uPollution * mix(0.45, 1.0, uEscalation);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uPollution;
    uniform float uEscalation;

    varying vec2  vUv;
    varying float vAlpha;

    void main() {
      if (vAlpha < 0.004) discard;

      // Soft circular puff with feathered radial falloff
      vec2 center = vUv - vec2(0.5);
      float dist = length(center) * 2.0; // [0.0, 1.0]
      if (dist > 1.0) discard;

      float radialMask = smoothstep(1.0, 0.15, dist);

      // Desaturated ash-gray smoke (#4a4642 core to #5e544d edge)
      vec3 coreColor = vec3(0.27, 0.25, 0.24); // Sooty charcoal ash
      vec3 edgeColor = vec3(0.38, 0.34, 0.32); // Slightly softer ash edge
      vec3 puffColor = mix(edgeColor, coreColor, radialMask);

      float finalAlpha = radialMask * vAlpha * 0.42;

      gl_FragColor = vec4(puffColor, finalAlpha);
    }
  `
};

export const Smog = ({
  pollution = 1.0,
  escalation = 0.5,
  healMaskManager = null,
}) => {
  const { camera } = useThree();
  const shellMatRef = useRef(null);
  const puffsMatRef = useRef(null);
  const activeMask = healMaskManager || healMask;

  const { puffGeom, puffUniforms, shellUniforms } = useMemo(() => {
    // 1. Create base quad geometry for GPU smoke puffs
    const baseQuad = new THREE.PlaneGeometry(1, 1);
    const instGeom = new THREE.InstancedBufferGeometry();
    instGeom.index = baseQuad.index;
    instGeom.attributes.position = baseQuad.attributes.position;
    instGeom.attributes.uv = baseQuad.attributes.uv;

    // Attributes for all 188 puff instances
    const emitterPosArr = new Float32Array(TOTAL_PUFFS * 3);
    const normalArr     = new Float32Array(TOTAL_PUFFS * 3);
    const driftArr      = new Float32Array(TOTAL_PUFFS * 3);
    const phaseArr      = new Float32Array(TOTAL_PUFFS);
    const speedArr      = new Float32Array(TOTAL_PUFFS);
    const scaleArr      = new Float32Array(TOTAL_PUFFS);

    let idx = 0;
    INDUSTRIAL_EMITTERS.forEach((emitter) => {
      const normal = emitter.pos.clone().normalize();

      // Tangent coordinate frame on sphere for slight random positional scatter
      let tangent = new THREE.Vector3(0, 1, 0).cross(normal);
      if (tangent.lengthSq() < 0.001) tangent = new THREE.Vector3(1, 0, 0).cross(normal);
      tangent.normalize();
      const bitangent = normal.clone().cross(tangent).normalize();

      for (let i = 0; i < emitter.count; i++) {
        // Small scatter around industrial center (radius ~0.02)
        const scatterAngle = Math.random() * Math.PI * 2;
        const scatterDist  = Math.sqrt(Math.random()) * 0.028;
        const jitterR = Math.cos(scatterAngle) * scatterDist;
        const jitterT = Math.sin(scatterAngle) * scatterDist;

        const p = emitter.pos.clone()
          .addScaledVector(tangent, jitterR)
          .addScaledVector(bitangent, jitterT)
          .normalize()
          .multiplyScalar(EARTH_RADIUS * 1.002);

        emitterPosArr[idx * 3 + 0] = p.x;
        emitterPosArr[idx * 3 + 1] = p.y;
        emitterPosArr[idx * 3 + 2] = p.z;

        normalArr[idx * 3 + 0] = normal.x;
        normalArr[idx * 3 + 1] = normal.y;
        normalArr[idx * 3 + 2] = normal.z;

        // Tangential drift vector
        const driftAngle = Math.random() * Math.PI * 2;
        const driftVec = tangent.clone().multiplyScalar(Math.cos(driftAngle))
          .addScaledVector(bitangent, Math.sin(driftAngle))
          .multiplyScalar(0.8 + Math.random() * 0.6);

        driftArr[idx * 3 + 0] = driftVec.x;
        driftArr[idx * 3 + 1] = driftVec.y;
        driftArr[idx * 3 + 2] = driftVec.z;

        phaseArr[idx] = i / emitter.count + (Math.random() * 0.2);
        speedArr[idx] = 0.12 + Math.random() * 0.08;
        scaleArr[idx] = 0.85 + Math.random() * 0.35;

        idx++;
      }
    });

    instGeom.setAttribute('aEmitterPos', new THREE.InstancedBufferAttribute(emitterPosArr, 3));
    instGeom.setAttribute('aNormal',     new THREE.InstancedBufferAttribute(normalArr, 3));
    instGeom.setAttribute('aDrift',      new THREE.InstancedBufferAttribute(driftArr, 3));
    instGeom.setAttribute('aPhase',      new THREE.InstancedBufferAttribute(phaseArr, 1));
    instGeom.setAttribute('aSpeed',      new THREE.InstancedBufferAttribute(speedArr, 1));
    instGeom.setAttribute('aScale',      new THREE.InstancedBufferAttribute(scaleArr, 1));

    const pUniforms = THREE.UniformsUtils.clone(SmokePuffShader.uniforms);
    pUniforms.uPollution.value = pollution;
    pUniforms.uEscalation.value = escalation;

    const sUniforms = THREE.UniformsUtils.clone(SmogShellShader.uniforms);
    sUniforms.uPollution.value = pollution;
    sUniforms.uEscalation.value = escalation;
    sUniforms.uHealMask.value = activeMask.getTexture();

    return { puffGeom: instGeom, puffUniforms: pUniforms, shellUniforms: sUniforms };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (shellMatRef.current) {
      shellMatRef.current.uniforms.uCameraPos.value.copy(camera.position);
      shellMatRef.current.uniforms.uTime.value = t;
      shellMatRef.current.uniforms.uPollution.value = pollution;
      shellMatRef.current.uniforms.uHealMask.value = activeMask.getTexture();
      shellMatRef.current.uniforms.uEscalation.value = THREE.MathUtils.lerp(
        shellMatRef.current.uniforms.uEscalation.value,
        escalation,
        Math.min(delta * 4.0, 1.0)
      );
    }

    if (puffsMatRef.current) {
      puffsMatRef.current.uniforms.uTime.value = t;
      puffsMatRef.current.uniforms.uPollution.value = pollution;
      puffsMatRef.current.uniforms.uEscalation.value = THREE.MathUtils.lerp(
        puffsMatRef.current.uniforms.uEscalation.value,
        escalation,
        Math.min(delta * 4.0, 1.0)
      );
    }
  });

  return (
    <group>
      {/* 1. Atmospheric Smog Shell (Thin Fresnel envelope with low-frequency noise) */}
      <mesh scale={SMOG_SHELL_RADIUS}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={shellMatRef}
          uniforms={shellUniforms}
          vertexShader={SmogShellShader.vertexShader}
          fragmentShader={SmogShellShader.fragmentShader}
          side={THREE.FrontSide}
          transparent={true}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>

      {/* 2. Anchored Smoke Plumes (Instanced quads rising from industrial centers) */}
      <mesh geometry={puffGeom}>
        <shaderMaterial
          ref={puffsMatRef}
          uniforms={puffUniforms}
          vertexShader={SmokePuffShader.vertexShader}
          fragmentShader={SmokePuffShader.fragmentShader}
          side={THREE.DoubleSide}
          transparent={true}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
    </group>
  );
};

export default Smog;
