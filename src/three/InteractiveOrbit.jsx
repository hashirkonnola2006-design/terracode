import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../config/game';

// Procedural geometries for debris types
function createBottleGeom() {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.3, 0.04),
    new THREE.Vector2(0.34, 0.12),
    new THREE.Vector2(0.34, 0.9),
    new THREE.Vector2(0.18, 1.15),
    new THREE.Vector2(0.14, 1.4),
    new THREE.Vector2(0.0, 1.4),
  ];
  const g = new THREE.LatheGeometry(pts, 12);
  g.center();
  return g;
}

function createBagGeom() {
  const g = new THREE.CylinderGeometry(0.3, 0.42, 1.1, 10, 6, true);
  g.center();
  return g;
}

function createCanGeom() {
  const g = new THREE.CylinderGeometry(0.28, 0.28, 0.75, 12);
  g.center();
  return g;
}

function createTireGeom() {
  const g = new THREE.TorusGeometry(0.44, 0.18, 8, 16);
  g.center();
  return g;
}

function createCrateGeom() {
  const g = new THREE.BoxGeometry(0.8, 0.55, 0.65);
  g.center();
  return g;
}

export const InteractiveOrbit = ({ isInteractive = true }) => {
  const collectDebrisItem = useGameStore((s) => s.collectDebrisItem);
  const collectedIds = useGameStore((s) => s.mission1.collectedIds);
  const activeMissionId = useGameStore((s) => s.activeMissionId);

  const [tapsNeeded, setTapsNeeded] = useState({});
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [hintId, setHintId] = useState(null);

  // Generate 60 fixed orbital debris items
  const items = useMemo(() => {
    const list = [];
    let seed = 998877;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const types = ['bottle', 'bag', 'can', 'tire', 'crate'];

    for (let i = 0; i < 60; i++) {
      const type = types[Math.floor(rand() * types.length)];
      const radius = 0.85 + rand() * 0.75;
      const inclination = (rand() - 0.5) * Math.PI * 0.7;
      const nodeAngle = rand() * Math.PI * 2;
      const baseAngle = rand() * Math.PI * 2;
      const orbitSpeed = (rand() > 0.45 ? 1 : -1) * (0.012 + rand() * 0.02) * 0.04;
      const scale = 0.038 * (0.8 + rand() * 0.45);
      const points = (type === 'tire' || type === 'crate') ? 3 : 1;

      list.push({
        id: i,
        type,
        radius,
        inclination,
        nodeAngle,
        baseAngle,
        currentAngle: baseAngle,
        orbitSpeed,
        scale,
        points,
        rotX: rand() * Math.PI * 2,
        rotY: rand() * Math.PI * 2,
        rotZ: rand() * Math.PI * 2,
        rotSpeed: (rand() - 0.5) * 0.4,
      });
    }
    return list;
  }, []);

  // Shared geometries
  const bottleGeom = useMemo(() => createBottleGeom(), []);
  const bagGeom    = useMemo(() => createBagGeom(), []);
  const canGeom    = useMemo(() => createCanGeom(), []);
  const tireGeom   = useMemo(() => createTireGeom(), []);
  const crateGeom  = useMemo(() => createCrateGeom(), []);
  const hitGeom    = useMemo(() => new THREE.SphereGeometry(0.24, 8, 8), []);

  // Materials
  const matBottle = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#cbe6f7', transmission: 0.8, roughness: 0.15, transparent: true, opacity: 0.8 }), []);
  const matBag    = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#f3f6fa', transmission: 0.5, roughness: 0.4, transparent: true, opacity: 0.85 }), []);
  const matCan    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e53e3e', metalness: 0.7, roughness: 0.3 }), []);
  const matTire   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: 0.9 }), []);
  const matCrate  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b6cb0', roughness: 0.5 }), []);
  const matHit    = useMemo(() => new THREE.MeshBasicMaterial({ visible: false }), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const itemPositions = useRef({});

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

  // Handle tap / click (with debounce guard to prevent double-fire between pointerdown & click)
  const lastCollectRef = useRef({});
  const handleItemClick = (e, item) => {
    if (!isInteractive) return;
    if (e && e.stopPropagation) e.stopPropagation();

    const now = performance.now();
    if (now - (lastCollectRef.current[item.id] || 0) < 350) return;
    lastCollectRef.current[item.id] = now;

    // Tires & Crates take 2 taps
    if (item.points === 3) {
      const currentTaps = (tapsNeeded[item.id] || 0) + 1;
      if (currentTaps < 2) {
        setTapsNeeded((prev) => ({ ...prev, [item.id]: currentTaps }));
        // Add a floating "Tap again!" badge
        setFloatingTexts((prev) => [
          ...prev,
          { id: Date.now(), text: 'Tap again!', pos: itemPositions.current[item.id] || [0, 0, 0], color: '#f6ad55' },
        ]);
        return;
      }
    }

    // Collect item
    const res = collectDebrisItem(item.id, item.type, item.points);
    if (res) {
      const label = res.combo > 1 ? `+${res.points} (x${res.combo})` : `+${res.points}`;
      setFloatingTexts((prev) => [
        ...prev,
        { id: Date.now(), text: label, pos: itemPositions.current[item.id] || [0, 0, 0], color: '#4ade80' },
      ]);
    }
  };

  useFrame(() => {
    // Orbital & rotation animation frozen — debris is static in space
    // Positions computed once from fixed baseAngle; no updates needed here
    items.forEach((item) => {
      const a = item.currentAngle; // stays at baseAngle — never incremented
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
    });
  });

  return (
    <group>
      {items.map((item) => {
        const isCollected = collectedIds.includes(item.id);
        if (isCollected) return null;

        const isHinted = item.id === hintId;
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

        return (
          <group key={item.id} position={pos} rotation={[item.rotX, item.rotY, item.rotZ]}>
            {/* Visible 3D Debris Mesh */}
            <mesh
              geometry={geom}
              material={mat}
              scale={[item.scale, item.scale, item.scale]}
              castShadow
              receiveShadow
            />

            {/* Generous Invisible Hit Target for Touch & Click */}
            {isInteractive && (
              <mesh
                geometry={hitGeom}
                material={matHit}
                scale={[item.scale * 3.5, item.scale * 3.5, item.scale * 3.5]}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleItemClick(e, item);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(e, item);
                }}
              />
            )}

            {/* Idle Hint Beacon Ring */}
            {isHinted && (
              <mesh scale={[item.scale * 2.8, item.scale * 2.8, item.scale * 2.8]}>
                <ringGeometry args={[0.8, 1.0, 16]} />
                <meshBasicMaterial color="#4ade80" side={THREE.DoubleSide} transparent opacity={0.65} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default InteractiveOrbit;

