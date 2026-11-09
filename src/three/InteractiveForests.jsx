import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

function latLonToVector3(lat, lon, radius = 1.0) {
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

export const InteractiveForests = ({ isInteractive = true }) => {
  const plantForestPatch = useGameStore((s) => s.plantForestPatch);
  const plantedPatches = useGameStore((s) => s.mission3.plantedPatches);

  // Tree scale animation map
  const treeScales = useRef({});

  const patches = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return FOREST_PATCHES.map((f) => {
      const pos = latLonToVector3(f.lat, f.lon, 1.002);
      const normal = pos.clone().normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(up, normal);
      return { ...f, pos, quat, normal };
    });
  }, []);

  useFrame((state, delta) => {
    patches.forEach((p) => {
      const isPlanted = plantedPatches.includes(p.id);
      const cur = treeScales.current[p.id] || 0;
      const target = isPlanted ? 1.0 : 0.0;
      treeScales.current[p.id] = THREE.MathUtils.lerp(cur, target, delta * 6.0);
    });
  });

  return (
    <group>
      {patches.map((patch) => {
        const isPlanted = plantedPatches.includes(patch.id);
        const animScale = treeScales.current[patch.id] || (isPlanted ? 1.0 : 0.0);

        return (
          <group
            key={patch.id}
            position={[patch.pos.x, patch.pos.y, patch.pos.z]}
            quaternion={patch.quat}
          >
            {/* UNPLANTED: Dry Brown/Gray Patch with Pulsing Sprout Beacon */}
            {!isPlanted && (
              <group
                onClick={(e) => {
                  if (!isInteractive) return;
                  e.stopPropagation();
                  plantForestPatch(patch.id);
                }}
                className="cursor-pointer"
              >
                {/* Generous touch target */}
                <mesh position={[0, 0.03, 0]}>
                  <sphereGeometry args={[0.065, 8, 8]} />
                  <meshBasicMaterial visible={false} />
                </mesh>

                {/* Dry Soil Patch Footprint */}
                <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.038, 16]} />
                  <meshStandardMaterial color="#6b5038" roughness={0.9} side={THREE.DoubleSide} />
                </mesh>

                {/* Sprout Plant Beacon */}
                {isInteractive && (
                  <group position={[0, 0.02, 0]}>
                    <mesh position={[0, 0, 0]}>
                      <cylinderGeometry args={[0.003, 0.003, 0.025, 6]} />
                      <meshBasicMaterial color="#a3e635" />
                    </mesh>
                    <mesh position={[0.008, 0.012, 0]} rotation={[0, 0, -0.5]}>
                      <coneGeometry args={[0.006, 0.014, 6]} />
                      <meshBasicMaterial color="#4ade80" />
                    </mesh>
                  </group>
                )}
              </group>
            )}

            {/* PLANTED: Lush Green Forest Canopy with 5 Cluster Trees */}
            <group scale={[animScale, animScale, animScale]}>
              {/* Vibrant Grass Soil Disc */}
              <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.045, 16]} />
                <meshStandardMaterial color="#15803d" roughness={0.7} side={THREE.DoubleSide} />
              </mesh>

              {/* 5 Clustered Canopy Trees */}
              {[
                { x: 0, z: 0, h: 0.032, r: 0.016 },
                { x: 0.018, z: 0.012, h: 0.026, r: 0.013 },
                { x: -0.016, z: 0.014, h: 0.024, r: 0.012 },
                { x: 0.012, z: -0.018, h: 0.025, r: 0.013 },
                { x: -0.014, z: -0.015, h: 0.028, r: 0.014 },
              ].map((tree, tIdx) => (
                <group key={tIdx} position={[tree.x, 0, tree.z]}>
                  {/* Tree Trunk */}
                  <mesh position={[0, tree.h * 0.35, 0]}>
                    <cylinderGeometry args={[0.002, 0.003, tree.h * 0.7, 6]} />
                    <meshStandardMaterial color="#5c3a21" roughness={0.9} />
                  </mesh>

                  {/* Leaf Canopy Dome / Cone */}
                  <mesh position={[0, tree.h * 0.85, 0]}>
                    <coneGeometry args={[tree.r, tree.h * 0.9, 8]} />
                    <meshStandardMaterial color={tIdx % 2 === 0 ? '#16a34a' : '#22c55e'} roughness={0.5} />
                  </mesh>
                </group>
              ))}
            </group>
          </group>
        );
      })}
    </group>
  );
};

export default InteractiveForests;

