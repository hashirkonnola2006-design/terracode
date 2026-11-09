import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../config/game';

function latLonToVector3(lat, lon, radius = 1.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const InteractiveOceans = ({ isInteractive = true }) => {
  const updateOceanSweep = useGameStore((s) => s.updateOceanSweep);
  const sweptPercent = useGameStore((s) => s.mission4.sweptPercent);
  const activeMissionId = useGameStore((s) => s.activeMissionId);

  const [sweptSet, setSweptSet] = useState(new Set());
  const [netPos, setNetPos] = useState(null);
  const [isSweeping, setIsSweeping] = useState(false);

  // Generate 120 ocean plastic particles across real ocean gyres
  const particles = useMemo(() => {
    const list = [];
    let seed = 443322;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Major gyres: Pacific (30N, -145W), Atlantic (28N, -40W), Indian (-15S, 80E)
    const gyres = [
      { lat: 30, lon: -145, rad: 22 }, // North Pacific Gyre
      { lat: 28, lon: -40,  rad: 18 }, // North Atlantic Gyre
      { lat: -15, lon: 80,  rad: 16 }, // Indian Ocean Gyre
      { lat: -25, lon: -110,rad: 16 }, // South Pacific Gyre
    ];

    for (let i = 0; i < 120; i++) {
      const g = gyres[Math.floor(rand() * gyres.length)];
      const lat = g.lat + (rand() - 0.5) * g.rad;
      const lon = g.lon + (rand() - 0.5) * g.rad;
      const pos = latLonToVector3(lat, lon, 1.003);
      const color = rand() > 0.5 ? '#f8fafc' : rand() > 0.5 ? '#38bdf8' : '#e2e8f0';
      list.push({ id: i, pos, color, scale: 0.008 + rand() * 0.008 });
    }
    return list;
  }, []);

  // Raycasting on ocean sphere to track sweep net
  const oceanSphereRef = useRef(null);

  const handlePointerDown = (e) => {
    if (!isInteractive || activeMissionId !== 4) return;
    setIsSweeping(true);
    checkSweepHit(e.point);
  };

  const handlePointerMove = (e) => {
    if (!isInteractive || activeMissionId !== 4) return;
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

    particles.forEach((p) => {
      if (!sweptSet.has(p.id)) {
        const d = hitPoint.distanceTo(p.pos);
        if (d < sweepRadius) {
          newlySwept.push(p.id);
        }
      }
    });

    if (newlySwept.length > 0) {
      setSweptSet((prev) => {
        const next = new Set(prev);
        newlySwept.forEach((id) => next.add(id));
        const currentPercent = Math.min(100, Math.round((next.size / particles.length) * 100));
        updateOceanSweep(currentPercent);
        return next;
      });
    }
  };

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

      {/* Floating Plastic Micro-Particles */}
      {particles.map((p) => {
        const isSwept = sweptSet.has(p.id);
        if (isSwept) return null;

        return (
          <mesh key={p.id} position={[p.pos.x, p.pos.y, p.pos.z]}>
            <dodecahedronGeometry args={[p.scale, 0]} />
            <meshStandardMaterial color={p.color} roughness={0.3} metalness={0.2} />
          </mesh>
        );
      })}

      {/* Glowing Sweep Net Cursor Barrier */}
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
