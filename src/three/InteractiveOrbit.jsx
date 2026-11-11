import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../config/game';
import {
  createPlasticBottleGeometry,
  createSodaCanGeometry,
  createCoffeeCupGeometry,
  createCrumpledBagGeometry,
  createMilkJugGeometry,
  createRubberTireGeometry,
} from '../utils/wasteGeometries';

const EMPTY_COLLECTED_IDS = [];

export const InteractiveOrbit = ({ isInteractive = true }) => {
  const collectDebrisItem = useGameStore((s) => s.collectDebrisItem);
  const collectedIds = useGameStore((s) => s.cleanup?.mission1?.collectedIds ?? s.mission1?.collectedIds ?? EMPTY_COLLECTED_IDS);
  const cleanliness = useGameStore((s) => s.cleanup?.health ?? s.cleanliness ?? 0);
  const isFinished = useGameStore((s) => s.cleanup?.completed ?? s.finished ?? false);
  const mission1Completed = useGameStore((s) => s.cleanup?.mission1?.completed ?? s.mission1?.completed ?? false);
  const activeMissionId = useGameStore((s) => s.cleanup?.activeMissionId ?? s.activeMissionId ?? 1);
  const liteMode = useGameStore((s) => s.liteMode);

  const [hoveredId, setHoveredId] = useState(null);
  const [clickPops, setClickPops] = useState({});
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [hintId, setHintId] = useState(null);
  const pointerDownPos = useRef({});

  // Generate 50 fixed orbital debris items
  const items = useMemo(() => {
    const list = [];
    let seed = 998877;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const types = ['bottle', 'bag', 'can', 'tire', 'crate'];
    const totalCount = liteMode ? 42 : 55;

    for (let i = 0; i < totalCount; i++) {
      const type = types[Math.floor(rand() * types.length)];
      const radius = 1.25 + rand() * 0.55; // Floats in low Earth orbit (1.25 to 1.80)
      const inclination = (rand() - 0.5) * Math.PI * 0.75;
      const nodeAngle = rand() * Math.PI * 2;
      const baseAngle = rand() * Math.PI * 2;
      const scale = 0.042 * (0.85 + rand() * 0.40);
      const points = (type === 'tire' || type === 'crate') ? 3 : 1;

      // Random tumble spin rates
      const tumbleSpeedX = (rand() - 0.5) * 0.8;
      const tumbleSpeedY = (rand() - 0.5) * 0.8;
      const tumbleSpeedZ = (rand() - 0.5) * 0.8;

      list.push({
        id: i,
        type,
        radius,
        inclination,
        nodeAngle,
        baseAngle,
        scale,
        points,
        rotX: rand() * Math.PI * 2,
        rotY: rand() * Math.PI * 2,
        rotZ: rand() * Math.PI * 2,
        tumbleSpeedX,
        tumbleSpeedY,
        tumbleSpeedZ,
      });
    }
    return list;
  }, [liteMode]);

  // Shared Geometries
  const bottleGeom = useMemo(() => createPlasticBottleGeometry(false), []);
  const bagGeom    = useMemo(() => createCrumpledBagGeometry(false), []);
  const canGeom    = useMemo(() => createSodaCanGeometry(false), []);
  const tireGeom   = useMemo(() => createRubberTireGeometry(), []);
  const crateGeom  = useMemo(() => createMilkJugGeometry(), []);
  const hitGeom    = useMemo(() => new THREE.SphereGeometry(0.26, 8, 8), []);

  // Shared Materials with proper physical properties
  const matBottle = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#d6ecfa',
    transmission: 0.82,
    roughness: 0.14,
    transparent: true,
    opacity: 0.85,
    clearcoat: 1.0,
  }), []);

  const matBag = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#f8fafc',
    transmission: 0.45,
    roughness: 0.42,
    transparent: true,
    opacity: 0.85,
  }), []);

  const matCan = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e11d48',
    metalness: 0.85,
    roughness: 0.22,
  }), []);

  const matTire = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#18181b',
    roughness: 0.92,
    metalness: 0.05,
  }), []);

  const matCrate = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f1f5f9',
    roughness: 0.45,
    metalness: 0.08,
  }), []);

  const matHit = useMemo(() => new THREE.MeshBasicMaterial({ visible: false }), []);

  const itemPositions = useRef({});
  const itemRotationRefs = useRef({});

  // 8-second idle hint
  useEffect(() => {
    if (!isInteractive || activeMissionId !== 1) return;
    const interval = setInterval(() => {
      const remaining = items.filter((it) => !collectedIds.includes(it.id));
      if (remaining.length > 0) {
        setHintId(remaining[Math.floor(Math.random() * remaining.length)].id);
      }
    }, GAME_CONFIG.IDLE_HINT_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [items, collectedIds, isInteractive, activeMissionId]);

  // Clean up floating text badges after 1.2s
  useEffect(() => {
    if (floatingTexts.length === 0) return;
    const timer = setTimeout(() => {
      setFloatingTexts((prev) => prev.slice(1));
    }, 1200);
    return () => clearTimeout(timer);
  }, [floatingTexts]);

  // Handle tap / click
  const lastCollectRef = useRef({});
  const handleItemClick = (e, item) => {
    if (!isInteractive) return;
    if (e && e.stopPropagation) e.stopPropagation();

    const now = performance.now();
    if (now - (lastCollectRef.current[item.id] || 0) < 250) return;
    lastCollectRef.current[item.id] = now;

    // Trigger scale-pop animation
    setClickPops((prev) => ({ ...prev, [item.id]: now }));

    // Collect item immediately in 1 satisfying tap
    const res = collectDebrisItem(item.id, item.type, item.points);
    if (res) {
      const label = res.combo > 1 ? `+${res.points} (x${res.combo})` : `+${res.points}`;
      setFloatingTexts((prev) => [
        ...prev,
        { id: Date.now(), text: label, pos: itemPositions.current[item.id] || [0, 0, 0], color: '#0becc2' },
      ]);
    }
  };

  // Compute fixed orbital positions and update slight tumble rotation
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    items.forEach((item) => {
      if (collectedIds.includes(item.id)) return;

      const a = item.baseAngle;
      const r = item.radius;

      const x0 = r * Math.cos(a);
      const z0 = r * Math.sin(a);

      const x1 = x0;
      const y1 = -z0 * Math.sin(item.inclination);
      const z1 = z0 * Math.cos(item.inclination);

      const cosN = Math.cos(item.nodeAngle);
      const sinN = Math.sin(item.nodeAngle);

      const x = x1 * cosN - z1 * sinN;
      const y = y1;
      const z = x1 * sinN + z1 * cosN;

      itemPositions.current[item.id] = [x, y, z];

      // Update tumble rotation
      const curRot = itemRotationRefs.current[item.id] || [item.rotX, item.rotY, item.rotZ];
      itemRotationRefs.current[item.id] = [
        curRot[0] + delta * item.tumbleSpeedX,
        curRot[1] + delta * item.tumbleSpeedY,
        curRot[2] + delta * item.tumbleSpeedZ,
      ];
    });
  });

  // When 100% cleaned, or when orbit mission is completed, completely remove all orbital waste
  if (cleanliness >= 100 || isFinished || mission1Completed) {
    return null;
  }

  return (
    <group>
      {items.map((item) => {
        const isCollected = collectedIds.includes(item.id);
        if (isCollected) return null;

        const isHinted = item.id === hintId;
        const isHovered = item.id === hoveredId;
        const now = performance.now();
        const popTime = clickPops[item.id] || 0;
        const isPopping = now - popTime < 280;
        const popScale = isPopping ? 1.0 + Math.sin(((now - popTime) / 280) * Math.PI) * 0.35 : 1.0;

        const geom =
          item.type === 'bottle' ? bottleGeom :
          item.type === 'bag'    ? bagGeom :
          item.type === 'can'    ? canGeom :
          item.type === 'tire'   ? tireGeom : crateGeom;

        const mat =
          item.type === 'bottle' ? matBottle :
          item.type === 'bag'    ? matBag :
          item.type === 'can'    ? matCan :
          item.type === 'tire'   ? matTire : matCrate;

        const pos = itemPositions.current[item.id] || [0, 0, 0];
        const rot = itemRotationRefs.current[item.id] || [item.rotX, item.rotY, item.rotZ];

        return (
          <group key={item.id} position={pos} rotation={rot} scale={[popScale, popScale, popScale]}>
            {/* Visible 3D Debris Mesh */}
            <mesh
              geometry={geom}
              material={mat}
              scale={[item.scale, item.scale, item.scale]}
              castShadow={!liteMode}
              receiveShadow={!liteMode}
            />

            {/* Hover subtle wireframe halo */}
            {isHovered && (
              <mesh scale={[item.scale * 1.6, item.scale * 1.6, item.scale * 1.6]}>
                <sphereGeometry args={[0.25, 8, 8]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} wireframe />
              </mesh>
            )}

            {/* Generous Invisible Hit Target with distance threshold to distinguish tap from globe rotation */}
            {isInteractive && (
              <mesh
                geometry={hitGeom}
                material={matHit}
                scale={[item.scale * 3.8, item.scale * 3.8, item.scale * 3.8]}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredId(item.id);
                }}
                onPointerOut={() => setHoveredId(null)}
                onPointerDown={(e) => {
                  if (e.stopPropagation) e.stopPropagation();
                  pointerDownPos.current[item.id] = { x: e.clientX, y: e.clientY };
                }}
                onPointerUp={(e) => {
                  if (e.stopPropagation) e.stopPropagation();
                  const down = pointerDownPos.current[item.id];
                  if (down) {
                    const dx = e.clientX - down.x;
                    const dy = e.clientY - down.y;
                    if (Math.hypot(dx, dy) < 8) {
                      handleItemClick(e, item);
                    }
                    delete pointerDownPos.current[item.id];
                  }
                }}
              />
            )}

            {/* Subtle Minimal Idle Hint (No huge thick rings) */}
            {isHinted && (
              <mesh scale={[item.scale * 1.3, item.scale * 1.3, item.scale * 1.3]}>
                <sphereGeometry args={[0.26, 8, 8]} />
                <meshBasicMaterial color="#0becc2" transparent opacity={0.3} wireframe />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default InteractiveOrbit;
