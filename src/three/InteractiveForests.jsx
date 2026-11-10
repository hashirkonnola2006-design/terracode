import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, FOREST_LOCATIONS } from '../store/gameStore';

// Convert Lat/Lon (degrees) into 3D sphere coordinate
export function latLonToVector3(lat, lon, radius = 1.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const FOREST_PATCHES = [
  { id: 0, name: 'Amazon Basin Deforestation Arc', lat: -8.5,  lon: -55.0 },
  { id: 1, name: 'Congo Rainforest Buffer Zone',   lat: -1.2,  lon: 22.5 },
  { id: 2, name: 'Canadian Boreal Shield',         lat: 53.5,  lon: -105.0 },
  { id: 3, name: 'Southern Siberian Taiga',        lat: 56.0,  lon: 92.0 },
  { id: 4, name: 'Borneo Tropical Peatland',       lat: 0.5,   lon: 114.0 },
  { id: 5, name: 'Brazilian Atlantic Forest Belt', lat: -22.0, lon: -43.5 },
  { id: 6, name: 'Eastern Australian Woodland',    lat: -34.0, lon: 148.5 },
  { id: 7, name: 'Madagascar Highland Watershed',  lat: -19.0, lon: 47.0 },
  { id: 8, name: 'Mesoamerican Wildlife Corridor', lat: 14.2,  lon: -88.5 },
  { id: 9, name: 'Western Ghats Biodiversity Hub', lat: 13.0,  lon: 75.5 },
];

// Tree configurations per patch (20 trees per patch, 10 in lite mode)
function generatePatchTrees(patchId) {
  let seed = 12345 + patchId * 987;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const trees = [];
  const count = 22;

  for (let i = 0; i < count; i++) {
    // Disc distribution (radius up to 0.042)
    const angle = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 0.038;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    // 3 variants: 0 = Pine cone-stack, 1 = Round broadleaf, 2 = Tall slim
    const variant = i % 3;
    const scale = 0.75 + rand() * 0.55; // 0.75 - 1.30
    const rotY = rand() * Math.PI * 2;
    const delay = i * 0.038; // 38ms stagger per tree

    // Color variations: deep pine, lush green, vibrant emerald
    const colors = ['#15803d', '#16a34a', '#22c55e', '#14532d', '#2e8b57'];
    const color = colors[Math.floor(rand() * colors.length)];

    trees.push({ id: i, x, z, variant, scale, rotY, delay, color });
  }

  return trees;
}

// Dead stumps for unplanted state
function generateStumps(patchId) {
  let seed = 9999 + patchId * 333;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return [
    { x: -0.012, z: -0.010, h: 0.018, tiltX: 0.15, tiltZ: -0.1 },
    { x: 0.015,  z: -0.008, h: 0.014, tiltX: -0.2, tiltZ: 0.1 },
    { x: -0.005, z: 0.016,  h: 0.022, tiltX: 0.1,  tiltZ: 0.2 },
    { x: 0.010,  z: 0.012,  h: 0.016, tiltX: -0.1, tiltZ: -0.15 },
  ];
}

export const InteractiveForests = ({ isInteractive = true }) => {
  const plantForestPatch = useGameStore((s) => s.plantForestPatch);
  const plantedPatches = useGameStore((s) => s.mission3.plantedPatches);
  const activeMissionId = useGameStore((s) => s.activeMissionId);
  const liteMode = useGameStore((s) => s.liteMode);

  // Hover states & scale pop
  const [hoveredPatch, setHoveredPatch] = useState(null);
  const [clickPop, setClickPop] = useState({});

  // Tree growth tracking
  const plantingTimes = useRef({});
  const treeScales = useRef({});
  const particlesRef = useRef({});

  // Compute 3D positions and normal orientations
  const patches = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return FOREST_PATCHES.map((f) => {
      const pos = latLonToVector3(f.lat, f.lon, 1.002);
      const normal = pos.clone().normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(up, normal);
      const trees = generatePatchTrees(f.id);
      const stumps = generateStumps(f.id);
      return { ...f, pos, quat, normal, trees, stumps };
    });
  }, []);

  // Shared Geometries for low-poly tree variants
  const trunkGeom = useMemo(() => new THREE.CylinderGeometry(0.0016, 0.0025, 0.022, 5), []);
  const pineCone1 = useMemo(() => new THREE.ConeGeometry(0.012, 0.018, 6), []);
  const pineCone2 = useMemo(() => new THREE.ConeGeometry(0.009, 0.014, 6), []);
  const broadleafGeom = useMemo(() => new THREE.IcosahedronGeometry(0.011, 0), []);
  const tallSlimGeom = useMemo(() => new THREE.ConeGeometry(0.007, 0.026, 6), []);
  const stumpGeom = useMemo(() => new THREE.CylinderGeometry(0.0018, 0.0026, 0.016, 4), []);
  const discGeom = useMemo(() => new THREE.CircleGeometry(0.045, 24), []);

  // Shared Materials
  const matTrunk = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a3319', roughness: 0.9 }), []);
  const matStump = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3d3025', roughness: 0.95 }), []);

  // Track planting times
  useEffect(() => {
    plantedPatches.forEach((id) => {
      if (!plantingTimes.current[id]) {
        plantingTimes.current[id] = performance.now();
        // Trigger particle burst
        particlesRef.current[id] = { start: performance.now(), count: liteMode ? 8 : 16 };
      }
    });
  }, [plantedPatches, liteMode]);

  const handlePatchClick = (patchId, e) => {
    if (!isInteractive) return;
    if (e && e.stopPropagation) e.stopPropagation();

    // Scale pop animation
    setClickPop((prev) => ({ ...prev, [patchId]: performance.now() }));
    plantForestPatch(patchId);
  };

  useFrame((state) => {
    const now = performance.now();

    // Update tree growth scales with ease-out-back
    patches.forEach((patch) => {
      const isPlanted = plantedPatches.includes(patch.id);
      if (!isPlanted) {
        treeScales.current[patch.id] = 0;
        return;
      }

      const startTime = plantingTimes.current[patch.id] || now;
      const elapsed = (now - startTime) / 1000; // seconds

      // Overall patch growth progress
      const p = Math.min(1.0, elapsed / 0.85);
      treeScales.current[patch.id] = p;
    });
  });

  return (
    <group>
      {patches.map((patch) => {
        const isPlanted = plantedPatches.includes(patch.id);
        const isHovered = hoveredPatch === patch.id;
        const now = performance.now();
        const popTime = clickPop[patch.id] || 0;
        const isPopping = now - popTime < 300;
        const popScale = isPopping ? 1.0 + Math.sin(((now - popTime) / 300) * Math.PI) * 0.18 : 1.0;

        const maxTrees = liteMode ? 10 : patch.trees.length;
        const patchStartTime = plantingTimes.current[patch.id] || now;
        const elapsedSincePlant = (now - patchStartTime) / 1000;

        return (
          <group
            key={patch.id}
            position={[patch.pos.x, patch.pos.y, patch.pos.z]}
            quaternion={patch.quat}
            scale={[popScale, popScale, popScale]}
          >
            {/* ── Ground Soil Disc (Transitions from cracked brown-gray to lush grass green) ── */}
            <mesh position={[0, 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={discGeom}>
              <meshStandardMaterial
                color={isPlanted ? '#1e7538' : isHovered ? '#785b42' : '#524335'}
                roughness={isPlanted ? 0.65 : 0.95}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* ── UNPLANTED STATE: Dead Stumps & Pulsing Seed Beacon ── */}
            {!isPlanted && (
              <group
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredPatch(patch.id);
                }}
                onPointerOut={() => setHoveredPatch(null)}
                onPointerDown={(e) => handlePatchClick(patch.id, e)}
                onClick={(e) => handlePatchClick(patch.id, e)}
              >
                {/* Generous Invisible Hit Target */}
                <mesh position={[0, 0.035, 0]}>
                  <sphereGeometry args={[0.075, 8, 8]} />
                  <meshBasicMaterial visible={false} />
                </mesh>

                {/* Dead Stumps & Sticks */}
                {patch.stumps.map((stump, sIdx) => (
                  <mesh
                    key={sIdx}
                    position={[stump.x, stump.h * 0.5, stump.z]}
                    rotation={[stump.tiltX, 0, stump.tiltZ]}
                    geometry={stumpGeom}
                    material={matStump}
                  />
                ))}

                {/* Interactive Seed Sprout Beacon */}
                {isInteractive && (
                  <group position={[0, 0.022, 0]}>
                    {/* Glowing seed halo */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                      <ringGeometry args={[0.015, 0.038, 16]} />
                      <meshBasicMaterial
                        color={isHovered ? '#4ade80' : '#a3e635'}
                        transparent
                        opacity={isHovered ? 0.85 : 0.45}
                        side={THREE.DoubleSide}
                      />
                    </mesh>

                    {/* Sprout stem & leaf tip */}
                    <mesh position={[0, 0.008, 0]}>
                      <cylinderGeometry args={[0.002, 0.003, 0.018, 6]} />
                      <meshBasicMaterial color="#84cc16" />
                    </mesh>
                    <mesh position={[0.006, 0.018, 0]} rotation={[0, 0, -0.6]}>
                      <coneGeometry args={[0.006, 0.014, 6]} />
                      <meshBasicMaterial color="#4ade80" />
                    </mesh>
                  </group>
                )}
              </group>
            )}

            {/* ── PLANTED STATE: Clustered Instanced Trees with Staggered Growth ── */}
            {isPlanted && (
              <group>
                {patch.trees.slice(0, maxTrees).map((tree) => {
                  // Staggered ease-out-back growth curve
                  const treeElapsed = Math.max(0, elapsedSincePlant - tree.delay);
                  const duration = 0.55; // 550ms growth time per tree
                  const rawP = Math.min(1.0, treeElapsed / duration);
                  
                  // Ease-out-back formula: f(t) = 1 + c3*(t-1)^3 + c1*(t-1)^2
                  const c1 = 1.6;
                  const c3 = c1 + 1;
                  const easeOutBack = rawP === 0 ? 0 : 1 + c3 * Math.pow(rawP - 1, 3) + c1 * Math.pow(rawP - 1, 2);
                  const growthScale = Math.max(0.001, Math.min(1.15, easeOutBack)) * tree.scale;

                  if (rawP <= 0) return null;

                  return (
                    <group
                      key={tree.id}
                      position={[tree.x, 0, tree.z]}
                      rotation={[0, tree.rotY, 0]}
                      scale={[growthScale, growthScale, growthScale]}
                    >
                      {/* Trunk */}
                      <mesh position={[0, 0.011, 0]} geometry={trunkGeom} material={matTrunk} />

                      {/* Variant 0: Pine Cone-Stack */}
                      {tree.variant === 0 && (
                        <group>
                          <mesh position={[0, 0.020, 0]} geometry={pineCone1}>
                            <meshStandardMaterial color={tree.color} roughness={0.6} />
                          </mesh>
                          <mesh position={[0, 0.028, 0]} geometry={pineCone2}>
                            <meshStandardMaterial color="#22c55e" roughness={0.5} />
                          </mesh>
                        </group>
                      )}

                      {/* Variant 1: Round Broadleaf Crown */}
                      {tree.variant === 1 && (
                        <mesh position={[0, 0.022, 0]} geometry={broadleafGeom}>
                          <meshStandardMaterial color={tree.color} roughness={0.55} />
                        </mesh>
                      )}

                      {/* Variant 2: Tall Slim Poplar / Cypress */}
                      {tree.variant === 2 && (
                        <mesh position={[0, 0.024, 0]} geometry={tallSlimGeom}>
                          <meshStandardMaterial color={tree.color} roughness={0.65} />
                        </mesh>
                      )}
                    </group>
                  );
                })}

                {/* Leaf & Sparkle Particle Burst on Completion */}
                {elapsedSincePlant < 1.4 && (
                  <group>
                    {Array.from({ length: liteMode ? 6 : 14 }).map((_, pIdx) => {
                      const pProgress = Math.min(1.0, elapsedSincePlant / 1.3);
                      const angle = (pIdx / 14) * Math.PI * 2 + patch.id;
                      const pRadius = 0.015 + pProgress * 0.045;
                      const px = Math.cos(angle) * pRadius;
                      const pz = Math.sin(angle) * pRadius;
                      const py = 0.015 + Math.sin(pProgress * Math.PI) * 0.045;
                      const pScale = Math.sin(pProgress * Math.PI) * 0.005;

                      return (
                        <mesh key={pIdx} position={[px, py, pz]}>
                          <dodecahedronGeometry args={[pScale, 0]} />
                          <meshBasicMaterial color={pIdx % 2 === 0 ? '#4ade80' : '#fef08a'} />
                        </mesh>
                      );
                    })}
                  </group>
                )}
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default InteractiveForests;
