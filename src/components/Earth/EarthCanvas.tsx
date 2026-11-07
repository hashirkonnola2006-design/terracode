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

interface StarfieldLayer {
  count:  number;
  spread: number;
  depth:  number;
  size:   number;
}

const STAR_LAYERS: StarfieldLayer[] = [
  { count: 1800, spread: 70, depth: -22, size: 0.055 }, // far stars
  { count: 1200, spread: 50, depth: -14, size: 0.085 }, // mid stars
  { count:  700, spread: 35, depth:  -7, size: 0.120 }, // bright foreground stars
];

const StarLayer: React.FC<StarfieldLayer & { mobile: boolean; mousePos: { x: number; y: number } }> = ({
  count, spread, depth, size, mobile, mousePos,
}) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const matRef = useRef<THREE.PointsMaterial>(null!);
  const realCount = mobile ? Math.round(count * 0.45) : count;

  const positions = useMemo(() => {
    const a = new Float32Array(realCount * 3);
    for (let i = 0; i < realCount; i++) {
      a[i * 3]     = (Math.random() - 0.5) * spread;
      a[i * 3 + 1] = (Math.random() - 0.5) * spread;
      a[i * 3 + 2] = depth - Math.random() * 5;
    }
    return a;
  }, [realCount, spread, depth]);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.opacity = 0.55 + 0.35 * Math.sin(clock.elapsedTime * 1.1 + depth);
    }
    if (pointsRef.current) {
      const parallaxFactor = 0.15 / Math.abs(depth);
      pointsRef.current.position.x = THREE.MathUtils.lerp(
        pointsRef.current.position.x,
        mousePos.x * parallaxFactor * 10,
        0.05
      );
      pointsRef.current.position.y = THREE.MathUtils.lerp(
        pointsRef.current.position.y,
        mousePos.y * parallaxFactor * 10,
        0.05
      );
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={size}
        color="#e2ecff"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

const NebulaGlow: React.FC = () => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.015, 0.055, 0.14),
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  return (
    <mesh position={[0, 0, -22]}>
      <planeGeometry args={[95, 70]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
};

interface Keyframe {
  progress:   number;
  x:          number; // fraction of visibleWidth (+0.22, -0.22)
  yOffset:    number; // fraction of visibleHeight
  scale:      number; // multiplier relative to base radius
  brightness: number; // 0 to 1
  heal:       number; // 0 to 1
  section:    string;
}

const KEYFRAMES: Keyframe[] = [
  { progress: 0.00, x:  0.00, yOffset:  0.00, scale: 1.00, brightness: 1.00, heal: 0.00, section: 'Hero' },
  { progress: 0.25, x:  0.00, yOffset:  0.02, scale: 0.70, brightness: 0.45, heal: 0.20, section: 'About / Stats' },
  { progress: 0.40, x:  0.22, yOffset:  0.03, scale: 0.85, brightness: 0.80, heal: 0.40, section: 'Impact 1 (Energy)' },
  { progress: 0.55, x: -0.22, yOffset:  0.03, scale: 0.85, brightness: 0.80, heal: 0.65, section: 'Impact 2 (Forests)' },
  { progress: 0.70, x:  0.22, yOffset:  0.03, scale: 0.85, brightness: 0.80, heal: 0.85, section: 'Impact 3 (Water)' },
  { progress: 0.85, x:  0.00, yOffset:  0.01, scale: 1.05, brightness: 1.00, heal: 1.00, section: 'Healed Moment' },
  { progress: 1.00, x:  0.00, yOffset: -0.01, scale: 0.80, brightness: 0.60, heal: 1.00, section: 'Get Involved / Footer' },
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

  // Directly check canvas width so mobile sizing applies immediately without state delay
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
    const nextBrightness = THREE.MathUtils.lerp(currentBrightness, kf.brightness, 0.08);
    const nextHeal = THREE.MathUtils.lerp(currentHealVal, kf.heal, 0.08);
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
        lowDetail={mobile}
        onEarthMeshReady={(m) => { earthMeshRef.current = m; }}
      />
      <LeafParticles
        healProgress={kf.heal}
        count={mobile ? 75 : 200}
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
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Deep space nebula */}
          <NebulaGlow />

          {/* 3-Depth Starfield */}
          {STAR_LAYERS.map((layer, i) => (
            <StarLayer
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
