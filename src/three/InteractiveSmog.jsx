import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

// Convert Lat/Lon (degrees) into 3D sphere coordinate
function latLonToVector3(lat, lon, radius = 1.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const SMOG_SOURCES = [
  { id: 0, name: 'North American Industrial Belt', lat: 41.5, lon: -87.5 },
  { id: 1, name: 'European Rhine-Ruhr Basin',      lat: 51.4, lon: 7.0 },
  { id: 2, name: 'East China Manufacturing Hub',  lat: 31.2, lon: 121.5 },
  { id: 3, name: 'Indo-Gangetic Industrial Plain',lat: 28.6, lon: 77.2 },
  { id: 4, name: 'Persian Gulf Refinery Complex', lat: 26.5, lon: 50.5 },
  { id: 5, name: 'South American Heavy Industry', lat: -23.5, lon: -46.6 },
  { id: 6, name: 'Mpumalanga Coal Energy Belt',   lat: -26.2, lon: 29.2 },
  { id: 7, name: 'Southeast Asian Shipping Hub',  lat: -6.2, lon: 106.8 },
];

export const InteractiveSmog = ({ isInteractive = true }) => {
  const convertSmogSource = useGameStore((s) => s.convertSmogSource);
  const convertedSources = useGameStore((s) => s.mission2.convertedSources);
  const cleanliness = useGameStore((s) => s.cleanliness);

  // Turbine blade rotation ref
  const bladesRef = useRef([]);

  // Compute 3D orientations for each spot on the Earth
  const spots = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return SMOG_SOURCES.map((s) => {
      const pos = latLonToVector3(s.lat, s.lon, 1.002);
      const normal = pos.clone().normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(up, normal);
      return { ...s, pos, quat, normal };
    });
  }, []);

  useFrame((state, delta) => {
    // Spin wind turbine blades
    bladesRef.current.forEach((b) => {
      if (b) b.rotation.z += delta * 4.5;
    });
  });

  return (
    <group>
      {spots.map((spot, idx) => {
        const isConverted = convertedSources.includes(spot.id);

        return (
          <group
            key={spot.id}
            position={[spot.pos.x, spot.pos.y, spot.pos.z]}
            quaternion={spot.quat}
          >
            {/* UNCONVERTED: Dark Smog Cloud & Red Smoldering Flare */}
            {!isConverted && (
              <group
                onPointerDown={(e) => {
                  if (!isInteractive) return;
                  e.stopPropagation();
                  convertSmogSource(spot.id);
                }}
                onClick={(e) => {
                  if (!isInteractive) return;
                  e.stopPropagation();
                  convertSmogSource(spot.id);
                }}
                className="cursor-pointer"
              >
                {/* Generous touch target */}
                <mesh position={[0, 0.04, 0]}>
                  <sphereGeometry args={[0.07, 8, 8]} />
                  <meshBasicMaterial visible={false} />
                </mesh>

                {/* Billowing Smog Cloud Dome */}
                <mesh position={[0, 0.02, 0]}>
                  <sphereGeometry args={[0.045, 12, 12]} />
                  <meshStandardMaterial
                    color="#2c2a26"
                    roughness={0.95}
                    transparent
                    opacity={0.88}
                  />
                </mesh>

                {/* Industrial Smoky Flare Ring */}
                <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.02, 0.055, 16]} />
                  <meshBasicMaterial
                    color="#ff4422"
                    transparent
                    opacity={0.75}
                    side={THREE.DoubleSide}
                  />
                </mesh>

                {/* Tap Prompt Beacon */}
                {isInteractive && (
                  <mesh position={[0, 0.055, 0]}>
                    <coneGeometry args={[0.012, 0.03, 6]} />
                    <meshBasicMaterial color="#ffaa00" />
                  </mesh>
                )}
              </group>
            )}

            {/* CONVERTED: Clean Renewable Wind Turbine / Solar Unit */}
            {isConverted && (
              <group>
                {/* Green Clean Energy Base Footprint */}
                <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.035, 16]} />
                  <meshBasicMaterial color="#10b981" transparent opacity={0.65} side={THREE.DoubleSide} />
                </mesh>

                {/* White Turbine Mast Tower */}
                <mesh position={[0, 0.025, 0]}>
                  <cylinderGeometry args={[0.003, 0.005, 0.05, 8]} />
                  <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.3} />
                </mesh>

                {/* Generator Hub */}
                <mesh position={[0, 0.05, 0.004]}>
                  <sphereGeometry args={[0.005, 8, 8]} />
                  <meshStandardMaterial color="#38bdf8" />
                </mesh>

                {/* Spinning 3-Blade Rotor */}
                <group
                  ref={(el) => {
                    bladesRef.current[idx] = el;
                  }}
                  position={[0, 0.05, 0.008]}
                >
                  {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, bIdx) => (
                    <group key={bIdx} rotation={[0, 0, angle]}>
                      <mesh position={[0, 0.016, 0]}>
                        <boxGeometry args={[0.003, 0.032, 0.001]} />
                        <meshStandardMaterial color="#ffffff" roughness={0.2} />
                      </mesh>
                    </group>
                  ))}
                </group>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default InteractiveSmog;

