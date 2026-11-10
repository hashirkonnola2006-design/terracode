import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, SMOG_LOCATIONS } from '../store/gameStore';

// Convert Lat/Lon (degrees) into 3D sphere coordinate
export function latLonToVector3(lat, lon, radius = 1.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const SMOG_SOURCES = [
  { id: 0, name: 'North American Industrial Belt', lat: 41.5, lon: -87.5, type: 'wind' },
  { id: 1, name: 'European Rhine-Ruhr Basin',      lat: 51.4, lon: 7.0,   type: 'solar' },
  { id: 2, name: 'East China Manufacturing Hub',  lat: 31.2, lon: 121.5, type: 'wind' },
  { id: 3, name: 'Indo-Gangetic Industrial Plain',lat: 28.6, lon: 77.2,  type: 'solar' },
  { id: 4, name: 'Persian Gulf Refinery Complex', lat: 26.5, lon: 50.5,  type: 'wind' },
  { id: 5, name: 'South American Heavy Industry', lat: -23.5, lon: -46.6, type: 'solar' },
  { id: 6, name: 'Mpumalanga Coal Energy Belt',   lat: -26.2, lon: 29.2,  type: 'wind' },
  { id: 7, name: 'Southeast Asian Shipping Hub',  lat: -6.2, lon: 106.8, type: 'solar' },
];

export const InteractiveSmog = ({ isInteractive = true }) => {
  const convertSmogSource = useGameStore((s) => s.convertSmogSource);
  const convertedSources = useGameStore((s) => s.mission2.convertedSources);
  const liteMode = useGameStore((s) => s.liteMode);

  const [hoveredSpot, setHoveredSpot] = useState(null);
  const [clickPop, setClickPop] = useState({});
  const convertTimes = useRef({});

  // Wind turbine blade rotation refs
  const turbineRotorRefs = useRef([]);

  // Compute 3D orientations for each industrial site
  const spots = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return SMOG_SOURCES.map((s) => {
      const pos = latLonToVector3(s.lat, s.lon, 1.002);
      const normal = pos.clone().normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(up, normal);
      return { ...s, pos, quat, normal };
    });
  }, []);

  // Shared Low-Poly Geometries
  // Factory
  const factoryBaseGeom = useMemo(() => new THREE.BoxGeometry(0.032, 0.016, 0.024), []);
  const chimneyGeom = useMemo(() => new THREE.CylinderGeometry(0.0032, 0.0042, 0.038, 7), []);
  const flareRingGeom = useMemo(() => new THREE.RingGeometry(0.003, 0.0055, 8), []);

  // Wind Turbine
  const towerGeom = useMemo(() => new THREE.CylinderGeometry(0.0024, 0.0045, 0.052, 7), []);
  const nacelleGeom = useMemo(() => new THREE.BoxGeometry(0.005, 0.005, 0.012), []);
  const bladeGeom = useMemo(() => {
    const g = new THREE.BoxGeometry(0.0026, 0.034, 0.0008);
    g.translate(0, 0.017, 0); // Rotate around base
    return g;
  }, []);

  // Solar Array
  const solarPanelGeom = useMemo(() => new THREE.BoxGeometry(0.022, 0.0012, 0.014), []);
  const solarMountGeom = useMemo(() => new THREE.CylinderGeometry(0.0015, 0.0015, 0.012, 4), []);

  // Pulse Ring & Footprints
  const footprintGeom = useMemo(() => new THREE.CircleGeometry(0.036, 18), []);
  const pulseRingGeom = useMemo(() => new THREE.RingGeometry(0.01, 0.08, 24), []);

  // Shared Materials
  const matFactory = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2d3036', roughness: 0.85 }), []);
  const matChimney = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1f2126', roughness: 0.9 }), []);
  const matFlare = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff4500' }), []);
  const matTurbine = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.15, roughness: 0.25 }), []);
  const matNacelle = useMemo(() => new THREE.MeshStandardMaterial({ color: '#38bdf8', metalness: 0.3, roughness: 0.4 }), []);
  const matSolarPanel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.15, metalness: 0.75 }), []);
  const matSolarGrid = useMemo(() => new THREE.MeshBasicMaterial({ color: '#1e3a8a' }), []);
  const matGreenFootprint = useMemo(() => new THREE.MeshBasicMaterial({ color: '#10b981', transparent: true, opacity: 0.55, side: THREE.DoubleSide }), []);
  const matAshFootprint = useMemo(() => new THREE.MeshStandardMaterial({ color: '#383430', roughness: 0.95, side: THREE.DoubleSide }), []);

  useEffect(() => {
    convertedSources.forEach((id) => {
      if (!convertTimes.current[id]) {
        convertTimes.current[id] = performance.now();
      }
    });
  }, [convertedSources]);

  const handleSpotClick = (spotId, e) => {
    if (!isInteractive) return;
    if (e && e.stopPropagation) e.stopPropagation();

    setClickPop((prev) => ({ ...prev, [spotId]: performance.now() }));
    convertSmogSource(spotId);
  };

  useFrame((state, delta) => {
    // Spin wind turbine rotors smoothly
    turbineRotorRefs.current.forEach((rotor) => {
      if (rotor) rotor.rotation.z += delta * 4.2;
    });
  });

  return (
    <group>
      {spots.map((spot, idx) => {
        const isConverted = convertedSources.includes(spot.id);
        const isHovered = hoveredSpot === spot.id;
        const now = performance.now();
        const popTime = clickPop[spot.id] || 0;
        const isPopping = now - popTime < 300;
        const popScale = isPopping ? 1.0 + Math.sin(((now - popTime) / 300) * Math.PI) * 0.20 : 1.0;

        const convertTime = convertTimes.current[spot.id] || 0;
        const elapsedSinceConvert = convertTime > 0 ? (now - convertTime) / 1000 : 999;
        const pulseProgress = Math.min(1.0, elapsedSinceConvert / 1.0); // 1-second pulse ring

        return (
          <group
            key={spot.id}
            position={[spot.pos.x, spot.pos.y, spot.pos.z]}
            quaternion={spot.quat}
            scale={[popScale, popScale, popScale]}
          >
            {/* Ground Footprint Disc */}
            <mesh position={[0, 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={footprintGeom}>
              {isConverted ? (
                <primitive object={matGreenFootprint} attach="material" />
              ) : (
                <primitive object={matAshFootprint} attach="material" />
              )}
            </mesh>

            {/* ── UNCONVERTED: Industrial Factory Site with Chimneys & Dark Smoke Puffs ── */}
            {!isConverted && (
              <group
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredSpot(spot.id);
                }}
                onPointerOut={() => setHoveredSpot(null)}
                onPointerDown={(e) => handleSpotClick(spot.id, e)}
                onClick={(e) => handleSpotClick(spot.id, e)}
              >
                {/* Generous Invisible Hit Target */}
                <mesh position={[0, 0.045, 0]}>
                  <sphereGeometry args={[0.075, 8, 8]} />
                  <meshBasicMaterial visible={false} />
                </mesh>

                {/* Factory Main Building */}
                <mesh position={[0, 0.008, 0]} geometry={factoryBaseGeom} material={matFactory} />

                {/* Chimney 1 */}
                <mesh position={[-0.008, 0.020, 0]} geometry={chimneyGeom} material={matChimney} />
                {/* Chimney 2 */}
                <mesh position={[0.008, 0.018, 0]} geometry={chimneyGeom} material={matChimney} />

                {/* Glowing Smoldering Chimney Rims */}
                <mesh position={[-0.008, 0.039, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={flareRingGeom} material={matFlare} />
                <mesh position={[0.008, 0.037, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={flareRingGeom} material={matFlare} />

                {/* Rising Dark Smoke Puffs (Anchored to chimneys, rising along local +Y) */}
                {!liteMode && (
                  <group>
                    {[0, 1, 2, 3, 4].map((pIdx) => {
                      const t1 = ((now * 0.00085 + pIdx * 0.22) % 1.0);
                      const puffY1 = 0.039 + t1 * 0.045;
                      const puffScale1 = 0.004 + t1 * 0.012;
                      const puffAlpha1 = Math.sin(t1 * Math.PI) * 0.75;

                      const t2 = ((now * 0.00095 + pIdx * 0.24 + 0.12) % 1.0);
                      const puffY2 = 0.037 + t2 * 0.042;
                      const puffScale2 = 0.004 + t2 * 0.011;
                      const puffAlpha2 = Math.sin(t2 * Math.PI) * 0.70;

                      return (
                        <group key={pIdx}>
                          <mesh position={[-0.008 + (pIdx % 2 === 0 ? 0.002 : -0.002), puffY1, 0]}>
                            <sphereGeometry args={[puffScale1, 6, 6]} />
                            <meshBasicMaterial color="#2d2825" transparent opacity={puffAlpha1} />
                          </mesh>
                          <mesh position={[0.008 + (pIdx % 2 === 0 ? -0.002 : 0.002), puffY2, 0]}>
                            <sphereGeometry args={[puffScale2, 6, 6]} />
                            <meshBasicMaterial color="#292523" transparent opacity={puffAlpha2} />
                          </mesh>
                        </group>
                      );
                    })}
                  </group>
                )}

                {/* Interactive Pulsing Tap Beacon */}
                {isInteractive && (
                  <group position={[0, 0.055, 0]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                      <ringGeometry args={[0.015, 0.032, 16]} />
                      <meshBasicMaterial
                        color={isHovered ? '#ffaa00' : '#f97316'}
                        transparent
                        opacity={isHovered ? 0.9 : 0.5}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                    <mesh position={[0, 0.010, 0]}>
                      <coneGeometry args={[0.007, 0.018, 6]} />
                      <meshBasicMaterial color={isHovered ? '#fef08a' : '#ffaa00'} />
                    </mesh>
                  </group>
                )}
              </group>
            )}

            {/* ── CONVERTED: Renewable Wind Turbine or Solar Array ── */}
            {isConverted && (
              <group>
                {/* Expanding Green Pulse Ring on Conversion */}
                {pulseProgress < 1.0 && (
                  <mesh
                    position={[0, 0.004, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    scale={[pulseProgress * 1.5, pulseProgress * 1.5, 1]}
                  >
                    <ringGeometry args={[0.01, 0.045, 24]} />
                    <meshBasicMaterial
                      color="#4ade80"
                      transparent
                      opacity={(1.0 - pulseProgress) * 0.85}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                )}

                {/* Variant A: Sleek Wind Turbine (Even spots: 0, 2, 4, 6) */}
                {spot.type === 'wind' && (
                  <group>
                    {/* Mast Tower */}
                    <mesh position={[0, 0.026, 0]} geometry={towerGeom} material={matTurbine} />
                    {/* Nacelle Generator */}
                    <mesh position={[0, 0.052, 0.002]} geometry={nacelleGeom} material={matNacelle} />
                    {/* 3-Blade Rotor */}
                    <group
                      ref={(el) => {
                        turbineRotorRefs.current[idx] = el;
                      }}
                      position={[0, 0.052, 0.008]}
                    >
                      {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, bIdx) => (
                        <group key={bIdx} rotation={[0, 0, angle]}>
                          <mesh geometry={bladeGeom} material={matTurbine} />
                        </group>
                      ))}
                    </group>
                  </group>
                )}

                {/* Variant B: Photovoltaic Solar Array (Odd spots: 1, 3, 5, 7) */}
                {spot.type === 'solar' && (
                  <group position={[0, 0.005, 0]}>
                    {/* 3 Angled Solar Panels */}
                    {[
                      { x: -0.014, z: 0.008, tilt: -0.35 },
                      { x: 0.0,    z: -0.005, tilt: -0.35 },
                      { x: 0.014,  z: 0.008, tilt: -0.35 },
                    ].map((panel, pIdx) => (
                      <group key={pIdx} position={[panel.x, 0.006, panel.z]} rotation={[panel.tilt, 0, 0]}>
                        <mesh position={[0, 0, 0]} geometry={solarPanelGeom} material={matSolarPanel} />
                        <mesh position={[0, 0.0007, 0]} scale={[0.92, 1, 0.88]}>
                          <boxGeometry args={[0.022, 0.0005, 0.014]} />
                          <meshStandardMaterial color="#1e40af" roughness={0.1} metalness={0.8} />
                        </mesh>
                        <mesh position={[0, -0.006, 0]} geometry={solarMountGeom} material={matTurbine} />
                      </group>
                    ))}
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

export default InteractiveSmog;
