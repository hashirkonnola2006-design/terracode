import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../config/game';

// Procedural geometries for debris types
function createBottleGeom() {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.28, 0.04),
    new THREE.Vector2(0.32, 0.12),
    new THREE.Vector2(0.32, 0.9),
    new THREE.Vector2(0.16, 1.15),
    new THREE.Vector2(0.12, 1.38),
    new THREE.Vector2(0.0, 1.38),
  ];
  const g = new THREE.LatheGeometry(pts, 12);
  g.center();
  return g;
}

function createBagGeom() {
  const g = new THREE.CylinderGeometry(0.28, 0.40, 1.0, 10, 5, true);
  g.center();
  return g;
}

function createCanGeom() {
  const g = new THREE.CylinderGeometry(0.26, 0.26, 0.72, 12);
  g.center();
  return g;
}

function createTireGeom() {
  const g = new THREE.TorusGeometry(0.42, 0.17, 8, 16);
  g.center();
  return g;
}

function createCrateGeom() {
  const g = new THREE.BoxGeometry(0.78, 0.52, 0.62);
  g.center();
  return g;
}

export const InteractiveOrbit = ({ isInteractive = true }) => {
  const collectDebrisItem = useGameStore((s) => s.collectDebrisItem);
  const collectedIds = useGameStore((s) => s.mission1.collectedIds);
  const activeMissionId = useGameStore((s) => s.activeMissionId);
  const liteMode = useGameStore((s) => s.liteMode);

  const [hoveredId, setHoveredId] = useState(null);
  const [clickPops, setClickPops] = useState({});
  const [tapsNeeded, setTapsNeeded] = useState({});
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [hintId, setHintId] = useState(null);

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
  const bottleGeom = useMemo(() => createBottleGeom(), []);
  const bagGeom    = useMemo(() => createBagGeom(), []);
  const canGeom    = useMemo(() => createCanGeom(), []);
  const tireGeom   = useMemo(() => createTireGeom(), []);
  const crateGeom  = useMemo(() => createCrateGeom(), []);
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
    color: '#1d4ed8',
    roughness: 0.45,
    metalness: 0.35,
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
    if (now - (lastCollectRef.current[item.id] || 0) < 300) return;
    lastCollectRef.current[item.id] = now;

    // Trigger scale-pop animation
    setClickPops((prev) => ({ ...prev, [item.id]: now }));

    // Tires & Crates take 2 taps
    if (item.points === 3) {
      const currentTaps = (tapsNeeded[item.id] || 0) + 1;
      if (currentTaps < 2) {
        setTapsNeeded((prev) => ({ ...prev, [item.id]: currentTaps }));
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

            {/* Hover Emissive Pulse Halo */}
            {isHovered && (
              <mesh scale={[item.scale * 2.2, item.scale * 2.2, item.scale * 2.2]}>
                <sphereGeometry args={[0.3, 10, 10]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} wireframe />
              </mesh>
            )}

            {/* Generous Invisible Hit Target for Touch & Click */}
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
                onPointerDown={(e) => handleItemClick(e, item)}
                onClick={(e) => handleItemClick(e, item)}
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
