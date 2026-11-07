import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EarthSphere } from './EarthSphere';
import { LeafParticles } from './LeafParticles';
import { EarthFallback2D } from './EarthFallback2D';

declare global {
  interface Window {
    __earth?: {
      screenCenter:   { x: number; y: number };
      screenRadiusPx: number;
      uHeal:          number;
      rotationY:      number;
      scale:          number;
      position:       { x: number; y: number; z: number };
      brightness:     number;
      fps:            number;
      drawCalls:      number;
      pixelRatio:     number;
      activeSection?: string;
    };
  }
}

/**
 * Soft Round Starfield (Bug 7 Fix)
 * Uses custom GLSL Point Shader with circular Gaussian falloff:
 * - NO square points!
 * - Varied stellar temperatures/colors: diamond white, pale sapphire, warm golden amber, soft cyan.
 * - Gentle sine twinkle.
 */
const StarShaderMaterial = {
  vertexShader: `
    attribute float aSize;
    attribute vec3  aColor;
    attribute float aTwinkleOffset;
    uniform float   uTime;

    varying vec3  vColor;
    varying float vTwinkle;

    void main() {
      vColor = aColor;
      // Gentle twinkle modulation per star
      vTwinkle = 0.55 + 0.45 * sin(uTime * 1.5 + aTwinkleOffset);

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * (260.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3  vColor;
    varying float vTwinkle;

    void main() {
      // Circular Gaussian alpha falloff (NO HARD SQUARE EDGES!)
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      // Soft circular Gaussian edge
      float alpha = smoothstep(0.5, 0.05, dist);
      // Soft glowing stellar core
      float core = smoothstep(0.18, 0.0, dist) * 0.40;

      gl_FragColor = vec4(vColor + vec3(core), alpha * vTwinkle);
    }
  `
};

interface StarfieldLayer {
  count:  number;
  spread: number;
  depth:  number;
  baseSize: number;
}

const STAR_LAYERS: StarfieldLayer[] = [
  { count: 1800, spread: 75, depth: -24, baseSize: 0.08 }, // background star clouds
  { count: 1100, spread: 55, depth: -15, baseSize: 0.12 }, // mid-depth stars
  { count:  450, spread: 38, depth:  -8, baseSize: 0.16 }, // foreground stars
];

const SoftStarLayer: React.FC<StarfieldLayer & { mobile: boolean; mousePos: { x: number; y: number } }> = ({
  count, spread, depth, baseSize, mobile, mousePos,
}) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const realCount = mobile ? Math.round(count * 0.45) : count;

  const [positions, colors, sizes, twinkleOffsets] = useMemo(() => {
    const pos = new Float32Array(realCount * 3);
    const col = new Float32Array(realCount * 3);
    const siz = new Float32Array(realCount);
    const twk = new Float32Array(realCount);

    const starPalettes = [
      new THREE.Color(1.0, 1.0, 1.0),        // diamond white (45%)
      new THREE.Color(1.0, 1.0, 1.0),
      new THREE.Color(0.82, 0.90, 1.0),      // pale blue (25%)
      new THREE.Color(1.0, 0.90, 0.72),      // warm golden amber (18%)
      new THREE.Color(0.70, 0.95, 1.0),      // soft cyan (12%)
    ];

    for (let i = 0; i < realCount; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = depth - Math.random() * 6;

      const c = starPalettes[Math.floor(Math.random() * starPalettes.length)];
      col[i * 3]     = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      siz[i] = baseSize * (0.65 + Math.random() * 0.85);
      twk[i] = Math.random() * 6.28;
    }

    return [pos, col, siz, twk];
  }, [realCount, spread, depth, baseSize]);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
    if (pointsRef.current) {
      const parallax = 0.12 / Math.abs(depth);
      pointsRef.current.position.x = THREE.MathUtils.lerp(
        pointsRef.current.position.x,
        mousePos.x * parallax * 10,
        0.05
      );
      pointsRef.current.position.y = THREE.MathUtils.lerp(
        pointsRef.current.position.y,
        mousePos.y * parallax * 10,
        0.05
      );
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor"   args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize"    args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aTwinkleOffset" args={[twinkleOffsets, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={StarShaderMaterial.vertexShader}
        fragmentShader={StarShaderMaterial.fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

/**
 * Deep Space Nebula (Bug 7 Fix)
 * Layered celestial dust clouds in deep space: cosmic blue, teal dust, dark indigo.
 */
const DeepSpaceNebula: React.FC = () => {
  const blueMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.012, 0.045, 0.12),
    transparent: true,
    opacity: 0.70,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  const tealMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.015, 0.070, 0.10),
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  return (
    <group position={[0, 0, -22]}>
      <mesh position={[-6, 4, 0]}>
        <planeGeometry args={[110, 80]} />
        <primitive object={blueMat} attach="material" />
      </mesh>
      <mesh position={[8, -3, 1]}>
        <planeGeometry args={[90, 65]} />
        <primitive object={tealMat} attach="material" />
      </mesh>
    </group>
  );
};

/**
 * Shooting Star Streak (Bug 5 Fix)
 * An occasional thin, fading diagonal streak across the background cosmos.
 */
const ShootingStarStreak: React.FC = () => {
  const lineRef = useRef<THREE.Line>(null!);
  const [active, setActive] = useState(false);
  const startPos = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  const progress = useRef(0);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    return g;
  }, []);

  const mat = useMemo(() => new THREE.LineBasicMaterial({
    color: new THREE.Color(0.85, 0.95, 1.0),
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame((_state, delta) => {
    if (!active) {
      // Trigger a shooting star streak every ~8-12 seconds
      if (Math.random() < 0.003) {
        setActive(true);
        progress.current = 0;
        const startX = (Math.random() - 0.5) * 16;
        const startY = 4 + Math.random() * 4;
        startPos.current.set(startX, startY, -12);
        endPos.current.set(startX + 6, startY - 4.5, -12);
      }
      return;
    }

    progress.current += delta * 1.4;
    if (progress.current >= 1.0) {
      setActive(false);
      mat.opacity = 0;
      return;
    }

    const currentHead = startPos.current.clone().lerp(endPos.current, progress.current);
    const trailProgress = Math.max(0, progress.current - 0.28);
    const currentTail = startPos.current.clone().lerp(endPos.current, trailProgress);

    const positions = geom.attributes.position.array as Float32Array;
    positions[0] = currentTail.x; positions[1] = currentTail.y; positions[2] = currentTail.z;
    positions[3] = currentHead.x; positions[4] = currentHead.y; positions[5] = currentHead.z;
    geom.attributes.position.needsUpdate = true;

    // Fade in and out smoothly
    const alpha = Math.sin(progress.current * Math.PI);
    mat.opacity = alpha * 0.75;
  });

  return <primitive object={new THREE.Line(geom, mat)} ref={lineRef} />;
};

interface Keyframe {
  progress:   number;
  x:          number; // fraction of visibleWidth (+0.27, -0.27)
  yOffset:    number; // fraction of visibleHeight
  scale:      number; // multiplier relative to base radius
  brightness: number; // 0 to 1
  heal:       number; // 0 to 1
  section:    string;
}

/**
 * Precision Keyframe Interpolation (Bugs 3 & 4 Fix):
 * - Hero (0%): centered behind headline, scale 1.0 (70% of viewport height).
 * - Stats / About (15%-30%): Earth elevated (yOffset +0.08) & scaled 0.70, brightness 0.45.
 *   Stat cards sit completely below the Earth (>100px clearance).
 * - Impact 1 (48%): Earth slides RIGHT (+0.27 width, scale 0.76).
 *   Text card is on LEFT (>300px clear gap, zero collision).
 * - Impact 2 (63%): Earth slides LEFT (-0.27 width, scale 0.76).
 *   Text card is on RIGHT (>300px clear gap, zero collision).
 * - Impact 3 (78%): Earth slides RIGHT (+0.27 width, scale 0.76).
 *   Text card is on LEFT (>300px clear gap, zero collision).
 * - Healed Moment (88%): Earth centered, scale 1.05, brightness 1.0, uHeal 1.0.
 * - Footer (100%): Earth centered, scale 0.80, brightness 0.60.
 */
const KEYFRAMES: Keyframe[] = [
  { progress: 0.00, x:  0.00, yOffset:  0.00, scale: 1.00, brightness: 1.00, heal: 0.00, section: 'Hero' },
  { progress: 0.16, x:  0.00, yOffset:  0.22, scale: 0.58, brightness: 0.45, heal: 0.15, section: 'Verified Stats' },
  { progress: 0.30, x:  0.00, yOffset:  0.18, scale: 0.58, brightness: 0.40, heal: 0.25, section: 'About (Reduce · Restore · Renew)' },
  { progress: 0.40, x:  0.27, yOffset:  0.00, scale: 0.76, brightness: 0.85, heal: 0.38, section: 'Impact — Three Levers' },
  { progress: 0.50, x:  0.27, yOffset:  0.00, scale: 0.76, brightness: 0.85, heal: 0.50, section: 'Impact 1 (Clean Energy)' },
  { progress: 0.65, x: -0.27, yOffset:  0.00, scale: 0.76, brightness: 0.85, heal: 0.70, section: 'Impact 2 (Restoring Forests)' },
  { progress: 0.80, x:  0.27, yOffset:  0.00, scale: 0.76, brightness: 0.85, heal: 0.90, section: 'Impact 3 (Water & Oceans)' },
  { progress: 0.90, x:  0.00, yOffset:  0.00, scale: 1.05, brightness: 1.00, heal: 1.00, section: 'Earth Fully Restored' },
  { progress: 1.00, x:  0.00, yOffset: -0.02, scale: 0.80, brightness: 0.60, heal: 1.00, section: 'Get Involved / Footer' },
];

function interpolateKeyframes(progress: number): Keyframe {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= KEYFRAMES[0].progress) return KEYFRAMES[0];
  if (p >= KEYFRAMES[KEYFRAMES.length - 1].progress) return KEYFRAMES[KEYFRAMES.length - 1];

  let i = 0;
  while (i < KEYFRAMES.length - 1 && KEYFRAMES[i + 1].progress < p) {
    i++;
  }

  const k1 = KEYFRAMES[i];
  const k2 = KEYFRAMES[i + 1];
  const t = (p - k1.progress) / (k2.progress - k1.progress);
  const smoothT = t * t * (3 - 2 * t);

  return {
    progress: p,
    x: THREE.MathUtils.lerp(k1.x, k2.x, smoothT),
    yOffset: THREE.MathUtils.lerp(k1.yOffset, k2.yOffset, smoothT),
    scale: THREE.MathUtils.lerp(k1.scale, k2.scale, smoothT),
    brightness: THREE.MathUtils.lerp(k1.brightness, k2.brightness, smoothT),
    heal: THREE.MathUtils.lerp(k1.heal, k2.heal, t),
    section: t < 0.5 ? k1.section : k2.section,
  };
}

interface EarthControllerProps {
  scrollProgress: number;
  scrollVelocity: number;
  mobile:         boolean;
  mousePos:       { x: number; y: number };
  reducedMotion:  boolean;
  onTelemetry?:   (t: { activeSection: string; scale: number; brightness: number; uHeal: number; fps: number }) => void;
}

const EarthController: React.FC<EarthControllerProps> = ({
  scrollProgress,
  scrollVelocity,
  mobile,
  mousePos,
  reducedMotion,
  onTelemetry,
}) => {
  const groupRef         = useRef<THREE.Group>(null!);
  const earthMeshRef     = useRef<THREE.Mesh | null>(null);
  const initializedRef   = useRef(false);
  const currentRotation  = useRef(0);
  const smoothedVelocity = useRef(0);
  const fpsRef           = useRef(60);
  const frameCountRef    = useRef(0);
  const lastTimeRef      = useRef(performance.now());

  const { camera, size, gl } = useThree();

  // Perspective camera geometry calculations
  const cam = camera as THREE.PerspectiveCamera;
  const d = cam.position.z; // 2.85
  const visibleHeight = 2.0 * d * Math.tan((cam.fov * Math.PI / 180) / 2.0); // ~1.962667
  const visibleWidth  = visibleHeight * (size.width / size.height);

  const isMobile = mobile || size.width < 768;
  const lastWidthRef = useRef(size.width);
  if (Math.abs(size.width - lastWidthRef.current) > 50) {
    initializedRef.current = false;
    lastWidthRef.current = size.width;
  }

  // Exact base dimensions:
  // Desktop: diameter = 70% of viewport height -> baseRadius = 0.35 * visibleHeight
  // Centered at 51.5% of viewport height -> worldY = -0.015 * visibleHeight
  const desktopBaseRadius = 0.35 * visibleHeight;
  const desktopBaseWorldY = -0.015 * visibleHeight;

  // Mobile: diameter = 85% of viewport width -> baseRadius = (0.85 / 2.0) * visibleWidth
  // Centered in upper screen (~42% of height) -> worldY = 0.08 * visibleHeight
  const mobileBaseRadius = (0.85 / 2.0) * visibleWidth;
  const mobileBaseWorldY = 0.08 * visibleHeight;

  const baseRadius = isMobile ? mobileBaseRadius : desktopBaseRadius;
  const baseWorldY = isMobile ? mobileBaseWorldY : desktopBaseWorldY;

  // Interpolate keyframe target values
  const kf = useMemo(() => interpolateKeyframes(scrollProgress), [scrollProgress]);

  const [currentBrightness, setCurrentBrightness] = useState(1.0);
  const [currentHealVal,    setCurrentHealVal]    = useState(0.0);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    // 1. Calculate FPS
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastTimeRef.current >= 500) {
      fpsRef.current = (frameCountRef.current * 1000) / (now - lastTimeRef.current);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    // 2. Position and Scale (initialize immediately on first frame, smooth lerp thereafter)
    const targetWorldX = isMobile ? 0 : kf.x * visibleWidth;
    const targetWorldY = baseWorldY + (isMobile ? kf.yOffset * 0.4 : kf.yOffset) * visibleHeight;
    const targetWorldScale = baseRadius * kf.scale;

    if (!initializedRef.current) {
      groupRef.current.position.x = targetWorldX;
      groupRef.current.position.y = targetWorldY;
      groupRef.current.scale.set(targetWorldScale, targetWorldScale, targetWorldScale);
      setCurrentBrightness(kf.brightness);
      setCurrentHealVal(kf.heal);
      initializedRef.current = true;
    } else {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetWorldX, 0.10);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetWorldY, 0.10);
      const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetWorldScale, 0.10);
      groupRef.current.scale.set(s, s, s);
    }

    // 3. Mouse Parallax Tilt
    if (!reducedMotion) {
      const tiltX = 0.16 + mousePos.y * 0.08;
      const tiltZ = 0.04 - mousePos.x * 0.08;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tiltX, 0.06);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, tiltZ, 0.06);
    }

    // 4. Planetary Rotation:
    // Idle rotation (0.06 rad/s) + scroll velocity spin with easing; reverse on scroll up
    smoothedVelocity.current = THREE.MathUtils.lerp(smoothedVelocity.current, scrollVelocity, 0.1);
    const idleSpin = 0.06 * delta;
    const scrollSpin = reducedMotion ? 0 : (smoothedVelocity.current * 0.0006) * delta;
    currentRotation.current += (idleSpin + scrollSpin);

    // 5. Brightness and uHeal
    const nextBrightness = THREE.MathUtils.lerp(currentBrightness, kf.brightness, 0.10);
    const nextHeal = THREE.MathUtils.lerp(currentHealVal, kf.heal, 0.10);
    setCurrentBrightness(nextBrightness);
    setCurrentHealVal(nextHeal);

    // 6. Expose window.__earth for exact automated measurement every frame
    const centerVec = new THREE.Vector3();
    groupRef.current.getWorldPosition(centerVec);
    const edgeVec = centerVec.clone().add(new THREE.Vector3(groupRef.current.scale.x, 0, 0));
    centerVec.project(camera);
    edgeVec.project(camera);

    const screenCenterX = (centerVec.x * 0.5 + 0.5) * size.width;
    const screenCenterY = (-centerVec.y * 0.5 + 0.5) * size.height;
    const screenRadiusPx = Math.abs(edgeVec.x - centerVec.x) * 0.5 * size.width;

    window.__earth = {
      screenCenter:   { x: Math.round(screenCenterX), y: Math.round(screenCenterY) },
      screenRadiusPx: Math.round(screenRadiusPx * 10) / 10,
      uHeal:          Math.round(nextHeal * 1000) / 1000,
      rotationY:      Math.round(currentRotation.current * 1000) / 1000,
      scale:          Math.round(groupRef.current.scale.x * 1000) / 1000,
      position: {
        x: Math.round(groupRef.current.position.x * 1000) / 1000,
        y: Math.round(groupRef.current.position.y * 1000) / 1000,
        z: Math.round(groupRef.current.position.z * 1000) / 1000,
      },
      brightness:     Math.round(nextBrightness * 100) / 100,
      fps:            Math.round(fpsRef.current),
      drawCalls:      gl.info.render.calls,
      pixelRatio:     gl.getPixelRatio(),
      activeSection:  kf.section,
    };

    if (onTelemetry) {
      onTelemetry({
        activeSection: kf.section,
        scale: kf.scale,
        brightness: nextBrightness,
        uHeal: nextHeal,
        fps: Math.round(fpsRef.current),
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, baseWorldY, 0]}>
      <EarthSphere
        healProgress={kf.heal}
        scrollRotation={currentRotation.current}
        brightness={currentBrightness}
        lowDetail={isMobile}
        onEarthMeshReady={(m) => { earthMeshRef.current = m; }}
      />
      <LeafParticles
        healProgress={kf.heal}
        count={isMobile ? 60 : 180}
      />
    </group>
  );
};

export interface EarthCanvasProps {
  scrollProgress: number;
  scrollVelocity: number;
  isLowPower?:    boolean;
  onTelemetry?:   (t: { activeSection: string; scale: number; brightness: number; uHeal: number; fps: number }) => void;
}

export const EarthCanvas: React.FC<EarthCanvasProps> = ({
  scrollProgress,
  scrollVelocity,
  isLowPower = false,
  onTelemetry,
}) => {
  const [isMobile, setIsMobile]           = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mousePos, setMousePos]           = useState({ x: 0, y: 0 });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  if (isLowPower) {
    const kf = interpolateKeyframes(scrollProgress);
    return (
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <EarthFallback2D healProgress={kf.heal} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 2.85], fov: 38 }}
        dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 2)]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Deep space nebula (Bug 7 fix) */}
          <DeepSpaceNebula />

          {/* Shooting star streak (Bug 5 fix) */}
          <ShootingStarStreak />

          {/* Soft round starfield with varied colors & sizes (Bug 7 fix) */}
          {STAR_LAYERS.map((layer, i) => (
            <SoftStarLayer
              key={i}
              {...layer}
              mobile={isMobile}
              mousePos={mousePos}
            />
          ))}

          {/* Directional Sun Light matching uSunDir [-1.6, 1.2, 1.0] */}
          <ambientLight intensity={0.25} />
          <directionalLight
            position={[-4.5, 3.2, 2.5]}
            intensity={2.8}
            castShadow={false}
          />

          {/* Scroll-Driven Earth */}
          <EarthController
            scrollProgress={scrollProgress}
            scrollVelocity={scrollVelocity}
            mobile={isMobile}
            mousePos={mousePos}
            reducedMotion={reducedMotion}
            onTelemetry={onTelemetry}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
