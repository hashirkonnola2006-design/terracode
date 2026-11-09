import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ClutterShaderMaterial } from './shaders/clutterShader';
import {
  EARTH_RADIUS,
  BASE_ROTATION_SPEED,
  HEALED_ROTATION_SPEED,
  AXIAL_TILT_X,
  AXIAL_TILT_Z,
  INITIAL_ROTATION_Y,
  HEAL_SCALE_EXPANSION
} from './Earth';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Surface 3D Trash Clutter)
// ═══════════════════════════════════════════════════════════════
export const BAGS_COUNT_DESKTOP     = 45;   // Crumpled white, black & blue tarps
export const TIRES_COUNT_DESKTOP    = 18;   // Rubber tires
export const CRATES_COUNT_DESKTOP   = 16;   // Wooden pallets & crates
export const CANS_COUNT_DESKTOP     = 28;   // Metal cans & oil drums
export const BOTTLES_COUNT_DESKTOP  = 24;   // Plastic bottles with caps
export const NETS_COUNT_DESKTOP     = 12;   // Fishing net tangles
export const MEDIUM_COUNT_DESKTOP   = 420;  // Bottle caps, cups, shards
export const TINY_COUNT_DESKTOP     = 1600; // Dense crusted micro-speckles

// Geometries for surface clutter objects
function createCrumpledBagGeom() {
  const g = new THREE.PlaneGeometry(1.3, 1.1, 5, 5);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = Math.sin(x * 5.0 + y * 4.2) * 0.22 + Math.cos(x * 9.5) * 0.12;
    pos.setZ(i, z);
  }
  g.computeVertexNormals();
  g.center();
  return g;
}

function createTireGeom() {
  return new THREE.TorusGeometry(0.50, 0.22, 10, 20);
}

function createCrateGeom() {
  return new THREE.BoxGeometry(0.85, 0.45, 0.65);
}

function createCanGeom() {
  return new THREE.CylinderGeometry(0.28, 0.28, 0.70, 12);
}

function createBottleGeom() {
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.30, 0.04),
    new THREE.Vector2(0.32, 0.12),
    new THREE.Vector2(0.32, 0.80),
    new THREE.Vector2(0.18, 1.05),
    new THREE.Vector2(0.13, 1.20),
    new THREE.Vector2(0.13, 1.30),
    new THREE.Vector2(0.0, 1.30),
  ];
  const g = new THREE.LatheGeometry(pts, 12);
  g.center();
  return g;
}

function createNetGeom() {
  const g = new THREE.RingGeometry(0.25, 0.85, 12, 4);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, Math.sin(x * 6.0 + y * 5.0) * 0.18);
  }
  g.computeVertexNormals();
  return g;
}

function createShardGeom() {
  const g = new THREE.DodecahedronGeometry(0.48, 0);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i, pos.getX(i) * 0.65, pos.getY(i) * 0.25, pos.getZ(i) * 0.65);
  }
  g.computeVertexNormals();
  return g;
}

function createSpeckleGeom() {
  return new THREE.TetrahedronGeometry(0.38, 0);
}

export const SurfaceClutter = ({ scrollRotation = 0, healProgress = 0, isLowEnd = false }) => {
  const groupRef = useRef(null);

  const bagMeshRef     = useRef(null);
  const tireMeshRef    = useRef(null);
  const crateMeshRef   = useRef(null);
  const canMeshRef     = useRef(null);
  const bottleMeshRef  = useRef(null);
  const netMeshRef     = useRef(null);
  const mediumMeshRef  = useRef(null);
  const tinyMeshRef    = useRef(null);

  // Scaled counts for mobile/low-end
  const mult = isLowEnd ? 0.45 : 1.0;
  const bagCount     = Math.round(BAGS_COUNT_DESKTOP * mult);
  const tireCount    = Math.round(TIRES_COUNT_DESKTOP * mult);
  const crateCount   = Math.round(CRATES_COUNT_DESKTOP * mult);
  const canCount     = Math.round(CANS_COUNT_DESKTOP * mult);
  const bottleCount  = Math.round(BOTTLES_COUNT_DESKTOP * mult);
  const netCount     = Math.round(NETS_COUNT_DESKTOP * mult);
  const mediumCount  = Math.round(MEDIUM_COUNT_DESKTOP * mult);
  const tinyCount    = Math.round(TINY_COUNT_DESKTOP * mult);

  // Geometries
  const bagGeom     = useMemo(() => createCrumpledBagGeom(), []);
  const tireGeom    = useMemo(() => createTireGeom(), []);
  const crateGeom   = useMemo(() => createCrateGeom(), []);
  const canGeom     = useMemo(() => createCanGeom(), []);
  const bottleGeom  = useMemo(() => createBottleGeom(), []);
  const netGeom     = useMemo(() => createNetGeom(), []);
  const shardGeom   = useMemo(() => createShardGeom(), []);
  const speckleGeom = useMemo(() => createSpeckleGeom(), []);

  // Shared Clutter Material
  const clutterMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(ClutterShaderMaterial.uniforms),
      vertexShader: ClutterShaderMaterial.vertexShader,
      fragmentShader: ClutterShaderMaterial.fragmentShader,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
  }, []);

  // Precompute instance clusters
  const clutterData = useMemo(() => {
    const dummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);

    let seed = 12345;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    /**
     * Converts lon/lat (degrees) to 3D point on unit sphere matching Earth's UV coordinates
     * India: lat 20°N, lon 78°E
     * Indian Ocean: lat -10° to 15°, lon 60° to 95°
     */
    const lonLatToPoint = (lon, lat) => {
      const u = (lon + 180) / 360;
      const v = (lat + 90) / 180;
      const theta = (1.0 - v) * Math.PI;
      const phi = u * Math.PI * 2;
      const x = -Math.cos(phi) * Math.sin(theta);
      const y = Math.cos(theta);
      const z = Math.sin(phi) * Math.sin(theta);
      return new THREE.Vector3(x, y, z).normalize();
    };

    const buildGroup = (count, baseScale, minThresh, maxThresh, defaultType, colorPicker, biasFront = true) => {
      const matrices = [];
      const thresholds = new Float32Array(count);
      const types = new Float32Array(count);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        let norm;
        if (biasFront && rand() < 0.82) {
          // Indian Ocean / Asia / Arabian Sea / Bay of Bengal cluster (matching 3d_earth.png)
          const lon = 35 + rand() * 95;   // 35°E (East Africa) to 130°E (Southeast Asia / Australia)
          const lat = -30 + rand() * 65;  // -30°S (South Indian Ocean) to 35°N (Himalayas)
          norm = lonLatToPoint(lon, lat);
          norm.x += (rand() - 0.5) * 0.06;
          norm.y += (rand() - 0.5) * 0.06;
          norm.z += (rand() - 0.5) * 0.06;
          norm.normalize();
        } else {
          // Global distributed scatter
          const theta = rand() * Math.PI * 2;
          const phi = Math.acos(rand() * 2 - 1);
          norm = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi)
          ).normalize();
        }

        const radius = EARTH_RADIUS + 0.0035;
        dummy.position.copy(norm).multiplyScalar(radius);
        dummy.quaternion.setFromUnitVectors(up, norm);

        // Random spin around the normal and slight tilt
        const spin = new THREE.Quaternion().setFromAxisAngle(norm, rand() * Math.PI * 2);
        dummy.quaternion.premultiply(spin);

        const s = baseScale * (0.85 + rand() * 0.40);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();

        matrices.push(dummy.matrix.clone());

        thresholds[i] = minThresh + rand() * (maxThresh - minThresh);
        const { type, col } = colorPicker(i, rand);
        types[i] = type !== undefined ? type : defaultType;

        colors[i * 3]     = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }

      return { matrices, thresholds, types, colors };
    };

    // 1. Bags & Tarps (White sacks, Royal blue tarps, Black garbage bags)
    const bags = buildGroup(bagCount, 0.026, 0.40, 0.95, 0, (i, r) => {
      const p = r();
      const col = new THREE.Color();
      if (p < 0.45) col.set('#b0b8c4');      // Grimy white sack
      else if (p < 0.75) col.set('#1e3a8a'); // Muted plastic tarp
      else col.set('#14171d');               // Black/charcoal trash bag
      return { type: 0, col };
    });

    // 2. Tires (Dark rubber with cracks)
    const tires = buildGroup(tireCount, 0.022, 0.45, 0.95, 2, () => ({
      type: 2,
      col: new THREE.Color('#141417')
    }));

    // 3. Wooden Crates / Pallets (Wood brown)
    const crates = buildGroup(crateCount, 0.020, 0.35, 0.90, 3, (i, r) => ({
      type: 3,
      col: new THREE.Color(r() > 0.5 ? '#6b4c2b' : '#4d3419')
    }));

    // 4. Metal Cans & Drums (Red soda cans, Silver cans, White/Rust drums)
    const cans = buildGroup(canCount, 0.016, 0.30, 0.88, 1, (i, r) => {
      const p = r();
      const col = new THREE.Color();
      if (p < 0.38) col.set('#991b1b');      // Dark red soda can
      else if (p < 0.75) col.set('#94a3b8'); // Silver/slate metal
      else col.set('#c4b5a0');               // Weathered drum
      return { type: 1, col };
    });

    // 5. Plastic Bottles (Translucent bottle + blue/green caps)
    const bottles = buildGroup(bottleCount, 0.018, 0.25, 0.85, 0, (i, r) => ({
      type: 0,
      col: new THREE.Color(r() > 0.4 ? '#b9d2e6' : '#1d4ed8')
    }));

    // 6. Fishing Nets (Emerald/olive tangled mesh)
    const nets = buildGroup(netCount, 0.024, 0.40, 0.92, 4, () => ({
      type: 4,
      col: new THREE.Color('#144820')
    }));

    // 7. Medium Debris (Caps, Shards, Cups - staggered 0.20 -> 0.75)
    const medium = buildGroup(mediumCount, 0.013, 0.20, 0.75, 0, (i, r) => {
      const p = r();
      const col = new THREE.Color();
      if (p < 0.40) col.set('#d8dde6');      // Grimy white
      else if (p < 0.65) col.set('#2055a5'); // Muted plastic blue
      else if (p < 0.80) col.set('#a83232'); // Rusted red
      else if (p < 0.90) col.set('#c27d1a'); // Dirty yellow/ochre
      else col.set('#283038');               // Charcoal
      return { type: p < 0.55 ? 0 : 1, col };
    });

    // 8. Tiny Micro-Debris (Speckles - clears early 0.05 -> 0.55)
    const tiny = buildGroup(tinyCount, 0.0055, 0.05, 0.55, 5, (i, r) => {
      const p = r();
      const col = new THREE.Color();
      if (p < 0.45) col.set('#cbd5e1');      // White/grey micro-plastic
      else if (p < 0.70) col.set('#475569'); // Slate grime
      else if (p < 0.85) col.set('#854d0e'); // Brown/mud sediment
      else col.set('#1e3a8a');               // Deep blue speckle
      return { type: 5, col };
    });

    return { bags, tires, crates, cans, bottles, nets, medium, tiny };
  }, [bagCount, tireCount, crateCount, canCount, bottleCount, netCount, mediumCount, tinyCount]);

  // Synchronously initialize instance buffers
  const initMesh = (mesh, data) => {
    if (!mesh || !data) return;
    const { matrices, thresholds, types, colors } = data;

    for (let i = 0; i < matrices.length; i++) {
      mesh.setMatrixAt(i, matrices[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;

    mesh.geometry.setAttribute('aThreshold',   new THREE.InstancedBufferAttribute(thresholds, 1));
    mesh.geometry.setAttribute('aClutterType', new THREE.InstancedBufferAttribute(types, 1));
    mesh.geometry.setAttribute('aBaseColor',   new THREE.InstancedBufferAttribute(colors, 3));
  };

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (clutterMaterial) {
      clutterMaterial.uniforms.uHeal.value = healProgress;
      clutterMaterial.uniforms.uTime.value = t;
    }

    if (groupRef.current) {
      const currentSpeed = THREE.MathUtils.lerp(BASE_ROTATION_SPEED, HEALED_ROTATION_SPEED, healProgress);
      groupRef.current.rotation.y = INITIAL_ROTATION_Y + t * currentSpeed + scrollRotation;

      const s = 1.0 + healProgress * HEAL_SCALE_EXPANSION;
      groupRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group rotation={[AXIAL_TILT_X, 0, AXIAL_TILT_Z]}>
      <group ref={groupRef}>
        {/* 1. Bags & Tarps (White, Black & Royal Blue) */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              bagMeshRef.current = m;
              initMesh(m, clutterData.bags);
            }
          }}
          castShadow
          receiveShadow
          args={[bagGeom, clutterMaterial, bagCount]}
        />

        {/* 2. Rubber Tires */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              tireMeshRef.current = m;
              initMesh(m, clutterData.tires);
            }
          }}
          castShadow
          receiveShadow
          args={[tireGeom, clutterMaterial, tireCount]}
        />

        {/* 3. Wooden Crates / Pallets */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              crateMeshRef.current = m;
              initMesh(m, clutterData.crates);
            }
          }}
          castShadow
          receiveShadow
          args={[crateGeom, clutterMaterial, crateCount]}
        />

        {/* 4. Metal Cans & Drums */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              canMeshRef.current = m;
              initMesh(m, clutterData.cans);
            }
          }}
          castShadow
          receiveShadow
          args={[canGeom, clutterMaterial, canCount]}
        />

        {/* 5. Plastic Bottles with Caps */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              bottleMeshRef.current = m;
              initMesh(m, clutterData.bottles);
            }
          }}
          castShadow
          receiveShadow
          args={[bottleGeom, clutterMaterial, bottleCount]}
        />

        {/* 6. Tangled Fishing Nets */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              netMeshRef.current = m;
              initMesh(m, clutterData.nets);
            }
          }}
          castShadow
          receiveShadow
          args={[netGeom, clutterMaterial, netCount]}
        />

        {/* 7. Medium Debris (Caps, Shards, Cups) */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              mediumMeshRef.current = m;
              initMesh(m, clutterData.medium);
            }
          }}
          castShadow
          receiveShadow
          args={[shardGeom, clutterMaterial, mediumCount]}
        />

        {/* 8. Dense Crusted Micro-Speckles (3,000+) */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              tinyMeshRef.current = m;
              initMesh(m, clutterData.tiny);
            }
          }}
          castShadow
          receiveShadow
          args={[speckleGeom, clutterMaterial, tinyCount]}
        />
      </group>
    </group>
  );
};
