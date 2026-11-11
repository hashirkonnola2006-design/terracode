import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, OCEAN_GYRES } from '../store/gameStore';
import { GAME_CONFIG } from '../config/game';
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

// 4 Major Oceanic Plastic Gyres with cluster center and extent
export const GYRE_CLUSTERS = [
  { id: 0, name: 'Great Pacific Garbage Patch', lat: 32.0,  lon: -145.0, radius: 0.18 },
  { id: 1, name: 'North Atlantic Ocean Gyre',   lat: 28.0,  lon: -42.0,  radius: 0.16 },
  { id: 2, name: 'Indian Ocean Garbage Gyre',   lat: -16.0, lon: 78.0,   radius: 0.15 },
  { id: 3, name: 'South Pacific Ocean Gyre',    lat: -26.0, lon: -112.0, radius: 0.15 },
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

  const [sweptSet, setSweptSet] = useState(() => {
    const s = new Set(storedSweptIds);
    if (sweptPercent > 0 && s.size === 0) {
      const count = Math.round((sweptPercent / 100) * (liteMode ? 60 : 120));
      for (let i = 0; i < count; i++) s.add(i);
    }
    return s;
  });
  const [netPos, setNetPos] = useState(null);
  const [isSweeping, setIsSweeping] = useState(false);

  // Keep sweptSet in sync if storedSweptIds grows or resets
  React.useEffect(() => {
    if (storedSweptIds.length === 0 && sweptPercent === 0) {
      setSweptSet(new Set());
    } else if (storedSweptIds.length > sweptSet.size) {
      setSweptSet((prev) => {
        const next = new Set(prev);
        storedSweptIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [storedSweptIds, sweptPercent]);

  // Generate varied low-poly floating plastic items clustered in real oceanic gyres
  const { items, clusterAnchors } = useMemo(() => {
    const list = [];
    let seed = 771122;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const types = ['bottle', 'bag', 'can', 'crate', 'net'];
    const totalItems = liteMode ? 60 : 120;
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
        // Swirling spiral distribution within gyre radius
        const angle = rand() * Math.PI * 2;
        const dist = Math.sqrt(rand()) * 0.14; // distance on tangent plane
        const phase = rand() * Math.PI * 2;
        const driftSpeed = 0.2 + rand() * 0.3;
        const scale = 0.006 + rand() * 0.006;

        // Compute coordinate in gyre local space
        const lx = Math.cos(angle) * dist;
        const lz = Math.sin(angle) * dist;

        // Transform to world position on sphere
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
        });
      }
    });

    return { items: list, clusterAnchors: anchors };
  }, [liteMode]);

  // Shared Geometries for realistic ocean waste
  const bottleGeom = useMemo(() => createPlasticBottleGeometry(false), []);
  const bagGeom    = useMemo(() => createCrumpledBagGeometry(false), []);
  const canGeom    = useMemo(() => createSodaCanGeometry(false), []);
  const crateGeom  = useMemo(() => createMilkJugGeometry(), []);
  const netGeom    = useMemo(() => new THREE.TorusGeometry(0.45, 0.15, 4, 8), []);
  const decalGeom  = useMemo(() => new THREE.CircleGeometry(0.16, 24), []);

  // Shared Materials
  const matBottle = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cbe6f7', roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85 }), []);
  const matBag    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.7, transparent: true, opacity: 0.8 }), []);
  const matCan    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ef4444', metalness: 0.8, roughness: 0.3 }), []);
  const matCrate  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.5 }), []);
  const matNet    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9 }), []);

  // Raycasting on ocean sphere for sweep net
  const oceanSphereRef = useRef(null);

  const handlePointerDown = (e) => {
    if (!isInteractive) return;
    setIsSweeping(true);
    if (activeMissionId !== 4) setActiveMission(4);
    checkSweepHit(e.point);
  };

  const handlePointerMove = (e) => {
    if (!isInteractive) return;
    setNetPos(e.point);
    if (isSweeping || e.buttons === 1) {
      checkSweepHit(e.point);
    }
  };

  const handlePointerUp = () => {
    setIsSweeping(false);
  };

  const checkSweepHit = (hitPoint) => {
    if (!hitPoint) return;
    const sweepRadius = GAME_CONFIG.SWEEP_RADIUS_WORLD;
    const newlySwept = [];

    items.forEach((item) => {
      if (!sweptSet.has(item.id)) {
        const d = hitPoint.distanceTo(item.currentPos);
        if (d < sweepRadius) {
          newlySwept.push(item.id);
        }
      }
    });

    if (newlySwept.length > 0) {
      setSweptSet((prev) => {
        const next = new Set(prev);
        newlySwept.forEach((id) => next.add(id));
        const currentPercent = Math.min(100, Math.round((next.size / items.length) * 100));
        updateOceanSweep(currentPercent, newlySwept);
        return next;
      });
    }
  };

  // Animate items bobbing and gentle circular swirl
  useFrame((state) => {
    const t = state.clock.elapsedTime;

    items.forEach((item) => {
      if (sweptSet.has(item.id)) return;

      // Gentle vertical bobbing along normal
      const bob = Math.sin(t * 2.2 + item.phase) * 0.0016;

      // Slow circular swirl around gyre center
      const currentAngle = item.angle + t * item.driftSpeed * 0.08;
      const curLx = Math.cos(currentAngle) * item.dist;
      const curLz = Math.sin(currentAngle) * item.dist;

      const gyre = clusterAnchors[item.gyreId];
      const localVec = new THREE.Vector3(curLx, bob, curLz).applyQuaternion(gyre.quat);
      item.currentPos.copy(gyre.pos).add(localVec).normalize().multiplyScalar(1.003 + bob);
    });
  });

  // When 100% cleaned, or ocean mission is completed, completely remove all ocean plastic and waste
  if (cleanliness >= 100 || isFinished || mission4Completed) {
    return null;
  }

  return (
    <group>
      {/* Invisible ocean raycasting sphere */}
      <mesh
        ref={oceanSphereRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <sphereGeometry args={[1.004, 32, 32]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* ── Dark Oily Discoloration Decals Under Each Gyre Cluster ── */}
      {clusterAnchors.map((gyre) => {
        // Calculate remaining unswept items in this gyre
        const gyreItems = items.filter((it) => it.gyreId === gyre.id);
        const sweptInGyre = gyreItems.filter((it) => sweptSet.has(it.id)).length;
        const cleanFraction = sweptInGyre / gyreItems.length;
        const oilOpacity = Math.max(0.0, (1.0 - cleanFraction) * 0.58);

        if (oilOpacity < 0.01) return null;

        return (
          <group
            key={gyre.id}
            position={[gyre.pos.x, gyre.pos.y, gyre.pos.z]}
            quaternion={gyre.quat}
          >
            <mesh position={[0, 0.0012, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={decalGeom}>
              <meshBasicMaterial
                color="#0a120f"
                transparent
                opacity={oilOpacity}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

      {/* ── Varied Low-Poly Ocean Plastic Items (Bottles, Bags, Cans, Crates, Nets) ── */}
      {items.map((item) => {
        const isSwept = sweptSet.has(item.id);
        if (isSwept) return null;

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
            scale={[item.scale, item.scale, item.scale]}
            geometry={geom}
            material={mat}
          />
        );
      })}

      {/* ── Glowing Sweep Net Cursor Barrier ── */}
      {isInteractive && activeMissionId === 4 && netPos && (
        <group position={[netPos.x, netPos.y, netPos.z]} lookAt={() => [0, 0, 0]}>
          <mesh>
            <ringGeometry args={[GAME_CONFIG.SWEEP_RADIUS_WORLD * 0.85, GAME_CONFIG.SWEEP_RADIUS_WORLD, 32]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.65} />
          </mesh>
          <mesh>
            <circleGeometry args={[GAME_CONFIG.SWEEP_RADIUS_WORLD * 0.85, 32]} />
            <meshBasicMaterial color="#0284c7" side={THREE.DoubleSide} transparent opacity={0.15} />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default InteractiveOceans;
