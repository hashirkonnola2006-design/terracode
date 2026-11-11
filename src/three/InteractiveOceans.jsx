import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../config/game';
import { sound } from '../utils/audio';
import {
  createPlasticBottleGeometry,
  createSodaCanGeometry,
  createCrumpledBagGeometry,
  createMilkJugGeometry,
} from '../utils/wasteGeometries';

// Convert Lat/Lon (degrees) into 3D sphere coordinate
export function latLonToVector3(lat, lon, radius = 1.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// 4 Major Oceanic Plastic Gyres with cluster center, extent, and label
export const GYRE_CLUSTERS = [
  { id: 0, name: 'Great Pacific Garbage Patch', lat: 32.0,  lon: -145.0, radius: 0.16, label: 'PACIFIC' },
  { id: 1, name: 'North Atlantic Ocean Gyre',   lat: 28.0,  lon: -42.0,  radius: 0.15, label: 'ATLANTIC' },
  { id: 2, name: 'Indian Ocean Garbage Gyre',   lat: -16.0, lon: 78.0,   radius: 0.14, label: 'INDIAN' },
  { id: 3, name: 'South Pacific Ocean Gyre',    lat: -26.0, lon: -112.0, radius: 0.14, label: 'S. PACIFIC' },
];

const EMPTY_IDS = [];

export const InteractiveOceans = ({ isInteractive = true }) => {
  const updateOceanSweep = useGameStore((s) => s.updateOceanSweep);
  const sweptPercent = useGameStore((s) => s.cleanup?.mission4?.sweptPercent ?? s.mission4?.sweptPercent ?? 0);
  const storedSweptIds = useGameStore((s) => s.cleanup?.mission4?.sweptIds ?? s.mission4?.sweptIds ?? EMPTY_IDS);
  const cleanliness = useGameStore((s) => s.cleanup?.health ?? s.cleanliness ?? 0);
  const isFinished = useGameStore((s) => s.cleanup?.completed ?? s.finished ?? false);
  const mission4Completed = useGameStore((s) => s.cleanup?.mission4?.completed ?? s.mission4?.completed ?? false);
  const activeMissionId = useGameStore((s) => s.cleanup?.activeMissionId ?? s.activeMissionId ?? 1);
  const setActiveMission = useGameStore((s) => s.setActiveMission);
  const liteMode = useGameStore((s) => s.liteMode);

  const groupRef = useRef(null);
  const scoopGroupRef = useRef(null);
  const animatingSwept = useRef(new Map());

  // Generate low-poly floating plastic items clustered in real oceanic gyres
  const { items, clusterAnchors } = useMemo(() => {
    const list = [];
    let seed = 771122;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const types = ['bottle', 'bag', 'can', 'crate', 'net'];
    // 80 items total (20 per gyre) for high visibility, 48 in lite mode
    const totalItems = liteMode ? 48 : 80;
    const itemsPerGyre = Math.floor(totalItems / GYRE_CLUSTERS.length);

    const anchors = GYRE_CLUSTERS.map((gyre) => {
      const pos = latLonToVector3(gyre.lat, gyre.lon, 1.002);
      const normal = pos.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, normal);
      return { ...gyre, pos, normal, quat };
    });

    let id = 0;
    anchors.forEach((gyre, gIdx) => {
      for (let i = 0; i < itemsPerGyre; i++) {
        const type = types[Math.floor(rand() * types.length)];
        const angle = rand() * Math.PI * 2;
        const dist = Math.sqrt(rand()) * (gyre.radius * 0.90);
        const phase = rand() * Math.PI * 2;
        const driftSpeed = 0.2 + rand() * 0.3;
        // Crisp, visible scale: 0.018 - 0.026 (easily spotted on water)
        const scale = 0.018 + rand() * 0.008;

        const lx = Math.cos(angle) * dist;
        const lz = Math.sin(angle) * dist;

        const localVec = new THREE.Vector3(lx, 0, lz).applyQuaternion(gyre.quat);
        const pos = gyre.pos.clone().add(localVec).normalize().multiplyScalar(1.003);

        list.push({
          id: id++,
          gyreId: gIdx,
          type,
          lx,
          lz,
          angle,
          dist,
          phase,
          driftSpeed,
          scale,
          basePos: pos,
          currentPos: pos.clone(),
          displayScale: scale,
          isRemoved: false,
        });
      }
    });

    return { items: list, clusterAnchors: anchors };
  }, [liteMode]);

  const [sweptSet, setSweptSet] = useState(() => {
    const s = new Set(storedSweptIds);
    if (sweptPercent > 0 && s.size === 0) {
      const count = Math.round((sweptPercent / 100) * items.length);
      for (let i = 0; i < count; i++) s.add(i);
    }
    return s;
  });

  const [netPos, setNetPos] = useState(null);
  const [isSweeping, setIsSweeping] = useState(false);

  // Sync sweptSet when store resets (e.g. Restart Game)
  useEffect(() => {
    if (storedSweptIds.length === 0 && sweptPercent === 0) {
      setSweptSet(new Set());
      animatingSwept.current.clear();
      items.forEach((it) => {
        it.isRemoved = false;
        it.displayScale = it.scale;
        it.currentPos.copy(it.basePos);
      });
    } else if (storedSweptIds.length > sweptSet.size) {
      setSweptSet((prev) => {
        const next = new Set(prev);
        storedSweptIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [storedSweptIds, sweptPercent, items]);

  // Shared Geometries
  const bottleGeom = useMemo(() => createPlasticBottleGeometry(false), []);
  const bagGeom    = useMemo(() => createCrumpledBagGeometry(false), []);
  const canGeom    = useMemo(() => createSodaCanGeometry(false), []);
  const crateGeom  = useMemo(() => createMilkJugGeometry(), []);
  const netGeom    = useMemo(() => new THREE.TorusGeometry(0.35, 0.12, 4, 8), []);
  const decalGeom  = useMemo(() => new THREE.CircleGeometry(0.18, 24), []);
  const beaconGeom = useMemo(() => new THREE.OctahedronGeometry(0.016, 0), []);
  const targetRingGeom = useMemo(() => new THREE.RingGeometry(0.12, 0.15, 32), []);

  // Shared Materials
  const matBottle = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7dd3fc', roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.90 }), []);
  const matBag    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.65, transparent: true, opacity: 0.85 }), []);
  const matCan    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ef4444', metalness: 0.85, roughness: 0.25 }), []);
  const matCrate  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.45, metalness: 0.1 }), []);
  const matNet    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.9 }), []);
  const matBeacon = useMemo(() => new THREE.MeshBasicMaterial({ color: '#0becc2', wireframe: false }), []);
  const matRing   = useMemo(() => new THREE.MeshBasicMaterial({ color: '#0becc2', transparent: true, opacity: 0.65, side: THREE.DoubleSide }), []);

  // Coordinate converter: converts world coordinates from raycasting to local group coordinates
  const toLocalPoint = useCallback((worldPoint) => {
    if (!worldPoint) return null;
    if (!groupRef.current) return worldPoint.clone();
    return groupRef.current.worldToLocal(worldPoint.clone());
  }, []);

  // Check sweep hit with generous swoop radius in local coordinates
  const checkSweepHit = useCallback((localPoint, isDirectClick = false) => {
    if (!localPoint) return;
    // Generous radius: 0.42 on hover/drag, 0.55 on click
    const sweepRadius = isDirectClick ? GAME_CONFIG.SWEEP_RADIUS_WORLD * 1.35 : GAME_CONFIG.SWEEP_RADIUS_WORLD;
    const newlySwept = [];

    // 1. Direct hit on floating plastic items
    items.forEach((item) => {
      if (!sweptSet.has(item.id) && !animatingSwept.current.has(item.id)) {
        const d = localPoint.distanceTo(item.currentPos);
        if (d < sweepRadius) {
          newlySwept.push(item.id);
        }
      }
    });

    // 2. Proximity to any gyre center: if within sweepRadius of a gyre, sweep its plastic cluster!
    clusterAnchors.forEach((gyre) => {
      if (localPoint.distanceTo(gyre.pos) < sweepRadius) {
        items.forEach((item) => {
          if (item.gyreId === gyre.id && !sweptSet.has(item.id) && !animatingSwept.current.has(item.id)) {
            if (!newlySwept.includes(item.id)) {
              newlySwept.push(item.id);
            }
          }
        });
      }
    });

    if (newlySwept.length > 0) {
      const now = performance.now();
      newlySwept.forEach((id) => {
        const itemObj = items.find((it) => it.id === id);
        if (itemObj) {
          animatingSwept.current.set(id, {
            startTime: now,
            startPos: itemObj.currentPos.clone(),
            targetPos: localPoint.clone(),
          });
        }
      });

      setSweptSet((prev) => {
        const next = new Set(prev);
        newlySwept.forEach((id) => next.add(id));
        const currentPercent = Math.min(100, Math.round((next.size / items.length) * 100));
        updateOceanSweep(currentPercent, newlySwept);
        return next;
      });

      sound.playCollect();
      sound.triggerHaptic(18);
    }
  }, [items, clusterAnchors, sweptSet, updateOceanSweep]);

  // Pointer event handlers: swoop effortlessly on hover, drag, or click!
  const handlePointerDown = (e) => {
    if (!isInteractive) return;
    if (activeMissionId !== 4) setActiveMission(4);
    setIsSweeping(true);
    const localPt = toLocalPoint(e.point);
    if (localPt) {
      setNetPos(localPt);
      checkSweepHit(localPt, true);
    }
  };

  const handlePointerMove = (e) => {
    if (!isInteractive) return;
    const localPt = toLocalPoint(e.point);
    if (localPt) {
      setNetPos(localPt);
      // Fluid vacuum: sweeps continuously on cursor move or drag
      checkSweepHit(localPt, false);
    }
  };

  const handlePointerUp = () => {
    setIsSweeping(false);
  };

  const handlePointerLeave = () => {
    setIsSweeping(false);
    setNetPos(null);
  };

  // Animate items bobbing, suction vacuum into scoop, and scoop boom orientation
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const now = performance.now();

    // Floating plastic bobbing & suction animation
    items.forEach((item) => {
      if (item.isRemoved) return;

      const anim = animatingSwept.current.get(item.id);
      if (anim) {
        // Magnetic suction: pulled into net vortex over 260ms
        const progress = Math.min(1.0, (now - anim.startTime) / 260);
        const eased = progress * progress; // acceleration into vortex
        item.currentPos.lerpVectors(anim.startPos, anim.targetPos, eased);
        item.displayScale = item.scale * (1.0 - progress);

        if (progress >= 1.0) {
          item.isRemoved = true;
          animatingSwept.current.delete(item.id);
        }
      } else if (!sweptSet.has(item.id)) {
        // Natural ocean bobbing
        const bob = Math.sin(t * 2.2 + item.phase) * 0.0016;
        const currentAngle = item.angle + t * item.driftSpeed * 0.08;
        const curLx = Math.cos(currentAngle) * item.dist;
        const curLz = Math.sin(currentAngle) * item.dist;

        const gyre = clusterAnchors[item.gyreId];
        const localVec = new THREE.Vector3(curLx, bob, curLz).applyQuaternion(gyre.quat);
        item.currentPos.copy(gyre.pos).add(localVec).normalize().multiplyScalar(1.003 + bob);
        item.displayScale = item.scale;
      } else {
        item.isRemoved = true;
      }
    });

    // Tangential orientation of the ocean scoop along sphere surface in local space
    if (scoopGroupRef.current && netPos) {
      const normal = netPos.clone().normalize();
      scoopGroupRef.current.position.copy(normal).multiplyScalar(1.006);
      scoopGroupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    }
  });

  // When 100% cleaned, remove all ocean plastic and scoop
  if (cleanliness >= 100 || isFinished || mission4Completed) {
    return null;
  }

  const radius = GAME_CONFIG.SWEEP_RADIUS_WORLD;

  return (
    <group ref={groupRef}>
      {/* Ocean raycasting sphere (handles hover, sweep clicks and drag without locking orbit) */}
      <mesh
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        <sphereGeometry args={[1.004, 32, 32]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* ── Visual Gyre Patches: Oily Scum + Pulsing Target Rings & Beacons ── */}
      {clusterAnchors.map((gyre) => {
        const gyreItems = items.filter((it) => it.gyreId === gyre.id);
        const sweptInGyre = gyreItems.filter((it) => sweptSet.has(it.id)).length;
        const isGyreCleaned = sweptInGyre >= gyreItems.length;
        const cleanFraction = sweptInGyre / gyreItems.length;
        const oilOpacity = Math.max(0.0, (1.0 - cleanFraction) * 0.60);

        return (
          <group
            key={gyre.id}
            position={[gyre.pos.x, gyre.pos.y, gyre.pos.z]}
            quaternion={gyre.quat}
          >
            {/* Oily patch discoloration decal */}
            {oilOpacity > 0.01 && (
              <mesh
                position={[0, 0.0012, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                geometry={decalGeom}
                onClick={(e) => {
                  e.stopPropagation();
                  checkSweepHit(gyre.pos, true);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  checkSweepHit(gyre.pos, true);
                }}
              >
                <meshBasicMaterial
                  color="#0a1512"
                  transparent
                  opacity={oilOpacity}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Pulsing Sonar Target Ring & Buoy (Clicking cleans entire gyre) */}
            {!isGyreCleaned && (
              <group
                onClick={(e) => {
                  e.stopPropagation();
                  checkSweepHit(gyre.pos, true);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  checkSweepHit(gyre.pos, true);
                }}
              >
                {/* Generous invisible hit zone */}
                <mesh position={[0, 0.024, 0]}>
                  <sphereGeometry args={[0.18, 12, 12]} />
                  <meshBasicMaterial visible={false} />
                </mesh>

                {/* Pulsing Sonar Target Ring */}
                <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={targetRingGeom} material={matRing} />

                {/* Floating Beacon Buoy */}
                <mesh
                  position={[0, 0.028, 0]}
                  geometry={beaconGeom}
                  material={matBeacon}
                />
              </group>
            )}
          </group>
        );
      })}

      {/* ── Varied, High-Contrast Floating Plastic Waste ── */}
      {items.map((item) => {
        if (item.isRemoved) return null;

        const geom =
          item.type === 'bottle' ? bottleGeom :
          item.type === 'bag'    ? bagGeom :
          item.type === 'can'    ? canGeom :
          item.type === 'crate'  ? crateGeom : netGeom;

        const mat =
          item.type === 'bottle' ? matBottle :
          item.type === 'bag'    ? matBag :
          item.type === 'can'    ? matCan :
          item.type === 'crate'  ? matCrate : matNet;

        return (
          <mesh
            key={item.id}
            position={[item.currentPos.x, item.currentPos.y, item.currentPos.z]}
            scale={[item.displayScale, item.displayScale, item.displayScale]}
            geometry={geom}
            material={mat}
            onClick={(e) => {
              e.stopPropagation();
              checkSweepHit(item.currentPos, true);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              checkSweepHit(item.currentPos, true);
            }}
          />
        );
      })}

      {/* ── High-Tech Tangential Ocean Scoop & Cleanup Boom (Accurately tracks cursor) ── */}
      {isInteractive && netPos && (
        <group ref={scoopGroupRef}>
          {/* Outer glowing barrier arc (Ocean Interceptor Boom) */}
          <mesh scale={isSweeping ? 1.12 : 1.0}>
            <ringGeometry args={[radius * 0.86, radius, 32, 1, -Math.PI * 0.70, Math.PI * 1.4]} />
            <meshBasicMaterial
              color={isSweeping ? '#0becc2' : '#38bdf8'}
              side={THREE.DoubleSide}
              transparent
              opacity={isSweeping ? 0.95 : 0.75}
            />
          </mesh>

          {/* Micro-mesh collection pocket behind the boom */}
          <mesh scale={isSweeping ? 1.12 : 1.0}>
            <ringGeometry args={[radius * 0.40, radius * 0.86, 32, 1, -Math.PI * 0.70, Math.PI * 1.4]} />
            <meshBasicMaterial
              color="#0284c7"
              side={THREE.DoubleSide}
              transparent
              opacity={isSweeping ? 0.40 : 0.22}
            />
          </mesh>

          {/* Center intake vortex pulse */}
          <mesh>
            <circleGeometry args={[radius * 0.38, 24]} />
            <meshBasicMaterial
              color={isSweeping ? '#0becc2' : '#0284c7'}
              side={THREE.DoubleSide}
              transparent
              opacity={isSweeping ? 0.32 : 0.16}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default InteractiveOceans;
