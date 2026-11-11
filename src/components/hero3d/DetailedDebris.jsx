import React, { useMemo } from 'react';
import * as THREE from 'three';

// ═════════════════════════════════════════════════════════════════════════════
// 1. HIGH-RESOLUTION CANVAS BRAND & INDUSTRIAL TEXTURES (SINGLETON CACHED)
// ═════════════════════════════════════════════════════════════════════════════

let cachedTextures = null;

function getCachedTextures() {
  if (cachedTextures) return cachedTextures;

  // 1A. Classic Red Coca-Cola Aluminum Can Texture (Ultra-Detailed Spencerian Script, Ribbon, Barcode & Nutrition Table)
  const colaCanvas = document.createElement('canvas');
  colaCanvas.width = 1024;
  colaCanvas.height = 512;
  const cCtx = colaCanvas.getContext('2d');
  if (cCtx) {
    // 1. Rich Authentic Coca-Cola Red with Cylindrical Gloss & Aluminum Shading
    const bgGrad = cCtx.createLinearGradient(0, 0, 1024, 0);
    bgGrad.addColorStop(0.00, '#850014');
    bgGrad.addColorStop(0.12, '#b8001f');
    bgGrad.addColorStop(0.25, '#e4002b');
    bgGrad.addColorStop(0.38, '#ff1a3d');
    bgGrad.addColorStop(0.50, '#e4002b');
    bgGrad.addColorStop(0.62, '#b8001f');
    bgGrad.addColorStop(0.75, '#e4002b');
    bgGrad.addColorStop(0.88, '#ff1a3d');
    bgGrad.addColorStop(1.00, '#850014');
    cCtx.fillStyle = bgGrad;
    cCtx.fillRect(0, 0, 1024, 512);

    // Subtle brushed metallic micro-lines
    cCtx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let y = 0; y < 512; y += 4) {
      cCtx.fillRect(0, y, 1024, 1.2);
    }

    // Helper to render the iconic Coca-Cola Spencerian script and ribbon wave
    const renderCocaColaFront = (centerX, baseY) => {
      // 1. Dynamic Flowing White Ribbon / Wave
      cCtx.save();
      cCtx.strokeStyle = '#ffffff';
      cCtx.lineWidth = 14;
      cCtx.lineCap = 'round';
      cCtx.beginPath();
      cCtx.moveTo(centerX - 180, baseY + 80);
      cCtx.bezierCurveTo(centerX - 80, baseY + 120, centerX + 60, baseY + 20, centerX + 180, baseY + 60);
      cCtx.stroke();

      // Secondary translucent accent wave
      cCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      cCtx.lineWidth = 6;
      cCtx.beginPath();
      cCtx.moveTo(centerX - 180, baseY + 96);
      cCtx.bezierCurveTo(centerX - 80, baseY + 136, centerX + 60, baseY + 36, centerX + 180, baseY + 76);
      cCtx.stroke();
      cCtx.restore();

      // 2. "ORIGINAL TASTE" Top Eyebrow
      cCtx.save();
      cCtx.fillStyle = '#ffffff';
      cCtx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      cCtx.textAlign = 'center';
      cCtx.letterSpacing = '0.35em';
      cCtx.fillText('ORIGINAL TASTE', centerX, baseY - 70);
      cCtx.restore();

      // 3. World-Famous "Coca-Cola" Spencerian Script
      cCtx.save();
      cCtx.fillStyle = '#ffffff';
      cCtx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      cCtx.shadowBlur = 4;
      cCtx.shadowOffsetX = 1;
      cCtx.shadowOffsetY = 2;

      // Primary cursive rendering with Spencerian flourishes
      cCtx.font = 'italic 700 82px "Brush Script MT", "Segoe Script", "Lucida Calligraphy", "Comic Sans MS", cursive, sans-serif';
      cCtx.textAlign = 'center';
      cCtx.fillText('Coca-Cola', centerX, baseY + 15);

      // Spencerian top swirl over "oca"
      cCtx.strokeStyle = '#ffffff';
      cCtx.lineWidth = 5.5;
      cCtx.beginPath();
      cCtx.moveTo(centerX - 130, baseY - 35);
      cCtx.bezierCurveTo(centerX - 90, baseY - 55, centerX - 20, baseY - 35, centerX - 10, baseY - 20);
      cCtx.stroke();

      // Spencerian underline tail swoop under "ola"
      cCtx.lineWidth = 5.5;
      cCtx.beginPath();
      cCtx.moveTo(centerX + 18, baseY + 32);
      cCtx.bezierCurveTo(centerX + 60, baseY + 45, centerX + 135, baseY + 40, centerX + 155, baseY + 20);
      cCtx.stroke();
      cCtx.restore();

      // 4. "Delicious & Refreshing"
      cCtx.save();
      cCtx.fillStyle = 'rgba(255, 255, 255, 0.90)';
      cCtx.font = 'italic 500 13px Georgia, serif';
      cCtx.textAlign = 'center';
      cCtx.fillText('Delicious & Refreshing • 330 ml', centerX, baseY + 125);
      cCtx.restore();
    };

    // Render on Front Face (centered at X=256) and Back Face (centered at X=768)
    renderCocaColaFront(256, 250);
    renderCocaColaFront(768, 250);

    // ── NUTRITION & PRODUCT FACTS PANEL (X=480 to X=550) ──
    cCtx.save();
    cCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    cCtx.lineWidth = 1;
    cCtx.strokeRect(500, 110, 80, 140);

    cCtx.fillStyle = '#ffffff';
    cCtx.font = 'bold 8px monospace';
    cCtx.fillText('NUTRITION / 100ml', 504, 122);
    cCtx.font = '7px monospace';
    cCtx.fillText('Energy: 180kJ/42kcal', 504, 136);
    cCtx.fillText('Fat: 0g', 504, 148);
    cCtx.fillText('Carbs: 10.6g', 504, 160);
    cCtx.fillText(' Sugars: 10.6g', 504, 172);
    cCtx.fillText('Protein: 0g', 504, 184);
    cCtx.fillText('Salt: 0g', 504, 196);
    cCtx.fillText('330ml ℮', 504, 218);

    // Authentic Barcode Block
    cCtx.fillStyle = '#ffffff';
    cCtx.fillRect(500, 260, 80, 52);
    cCtx.fillStyle = '#0f172a';
    for (let bx = 506; bx < 574; bx += 3) {
      if ((bx * 11) % 4 !== 0) {
        cCtx.fillRect(bx, 264, 1.8, 40);
      }
    }
    cCtx.font = 'bold 6px monospace';
    cCtx.fillText('5 449000 000996', 506, 309);

    // Micro recycling callout
    cCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    cCtx.font = 'bold 9px sans-serif';
    cCtx.fillText('♻ PLEASE RECYCLE ME', 495, 335);

    // Corporate fine print
    cCtx.font = '6px sans-serif';
    cCtx.fillText('© THE COCA-COLA COMPANY', 495, 350);
    cCtx.fillText('SERVE CHILLED • CAN ALUMINUM', 495, 362);
    cCtx.restore();
  }
  const colaTexture = new THREE.CanvasTexture(colaCanvas);
  colaTexture.wrapS = THREE.RepeatWrapping;
  colaTexture.anisotropy = 8;

  // 1B. Electric Neon Energy Drink Can Texture
  const energyCanvas = document.createElement('canvas');
  energyCanvas.width = 512;
  energyCanvas.height = 256;
  const eCtx = energyCanvas.getContext('2d');
  if (eCtx) {
    // Matte dark graphite base
    eCtx.fillStyle = '#090d16';
    eCtx.fillRect(0, 0, 512, 256);

    // Neon emerald / cyan toxic slash stripes
    eCtx.fillStyle = '#10b981';
    eCtx.beginPath();
    eCtx.moveTo(60, 20);
    eCtx.lineTo(130, 230);
    eCtx.lineTo(105, 235);
    eCtx.lineTo(35, 25);
    eCtx.closePath();
    eCtx.fill();

    eCtx.fillStyle = '#06b6d4';
    eCtx.beginPath();
    eCtx.moveTo(125, 30);
    eCtx.lineTo(195, 220);
    eCtx.lineTo(170, 225);
    eCtx.lineTo(100, 35);
    eCtx.closePath();
    eCtx.fill();

    // Bold "SURGE"
    eCtx.fillStyle = '#ffffff';
    eCtx.font = '900 60px sans-serif';
    eCtx.fillText('SURGE', 180, 130);

    eCtx.fillStyle = '#10b981';
    eCtx.font = 'bold 20px sans-serif';
    eCtx.fillText('ENERGY • 500ml', 182, 165);

    // Warning voltage hazard triangle
    eCtx.strokeStyle = '#eab308';
    eCtx.lineWidth = 4;
    eCtx.strokeRect(390, 150, 60, 60);
    eCtx.fillStyle = '#eab308';
    eCtx.font = 'bold 32px sans-serif';
    eCtx.fillText('⚡', 402, 192);
  }
  const energyTexture = new THREE.CanvasTexture(energyCanvas);
  energyTexture.wrapS = THREE.RepeatWrapping;

  // 1C. Sparkling Water Blue Can Texture
  const fizzCanvas = document.createElement('canvas');
  fizzCanvas.width = 512;
  fizzCanvas.height = 256;
  const fCtx = fizzCanvas.getContext('2d');
  if (fCtx) {
    const grad = fCtx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(1, '#0284c7');
    fCtx.fillStyle = grad;
    fCtx.fillRect(0, 0, 512, 256);

    // Silver rims
    fCtx.fillStyle = '#f1f5f9';
    fCtx.fillRect(0, 0, 512, 10);
    fCtx.fillRect(0, 246, 512, 10);

    // Bubble clusters
    fCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 30; i++) {
      const bx = (i * 37) % 512;
      const by = (i * 29) % 230 + 15;
      const br = (i % 5) + 3;
      fCtx.beginPath();
      fCtx.arc(bx, by, br, 0, Math.PI * 2);
      fCtx.fill();
    }

    fCtx.fillStyle = '#ffffff';
    fCtx.font = 'italic 800 58px sans-serif';
    fCtx.fillText('FIZZ', 170, 135);

    fCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    fCtx.font = '600 18px sans-serif';
    fCtx.fillText('SPARKLING WATER • ZERO SUGAR', 140, 170);
  }
  const fizzTexture = new THREE.CanvasTexture(fizzCanvas);
  fizzTexture.wrapS = THREE.RepeatWrapping;

  // 1D. Mineral Water Bottle Printed Label (Sky Blue & Mountain Crest)
  const bottleCanvas = document.createElement('canvas');
  bottleCanvas.width = 512;
  bottleCanvas.height = 128;
  const bCtx = bottleCanvas.getContext('2d');
  if (bCtx) {
    bCtx.fillStyle = 'rgba(14, 165, 233, 0.88)';
    bCtx.fillRect(0, 0, 512, 128);

    // Mountain peaks silhouette
    bCtx.fillStyle = '#ffffff';
    bCtx.beginPath();
    bCtx.moveTo(140, 95);
    bCtx.lineTo(190, 35);
    bCtx.lineTo(235, 80);
    bCtx.lineTo(275, 25);
    bCtx.lineTo(330, 95);
    bCtx.closePath();
    bCtx.fill();

    bCtx.fillStyle = '#0f172a';
    bCtx.font = 'bold 32px sans-serif';
    bCtx.fillText('AQUA GLACIER', 140, 120);

    bCtx.fillStyle = '#ffffff';
    bCtx.fillRect(400, 30, 60, 70);
    bCtx.fillStyle = '#000000';
    for (let i = 405; i < 455; i += 3) {
      if ((i * 3) % 2 === 0) bCtx.fillRect(i, 35, 2, 55);
    }
  }
  const bottleTexture = new THREE.CanvasTexture(bottleCanvas);
  bottleTexture.wrapS = THREE.RepeatWrapping;

  // 1E. Takeout Coffee Sleeve (Cardboard Texture & Stamp)
  const coffeeCanvas = document.createElement('canvas');
  coffeeCanvas.width = 256;
  coffeeCanvas.height = 128;
  const kCtx = coffeeCanvas.getContext('2d');
  if (kCtx) {
    kCtx.fillStyle = '#b45309'; // Kraft brown
    kCtx.fillRect(0, 0, 256, 128);

    // Cardboard ribs
    kCtx.strokeStyle = 'rgba(0,0,0,0.12)';
    kCtx.lineWidth = 2;
    for (let x = 0; x < 256; x += 6) {
      kCtx.beginPath();
      kCtx.moveTo(x, 0);
      kCtx.lineTo(x, 128);
      kCtx.stroke();
    }

    // Circular Stamp
    kCtx.strokeStyle = '#451a03';
    kCtx.lineWidth = 3;
    kCtx.beginPath();
    kCtx.arc(128, 64, 42, 0, Math.PI * 2);
    kCtx.stroke();

    kCtx.fillStyle = '#451a03';
    kCtx.font = 'bold 15px sans-serif';
    kCtx.fillText('TERRA', 104, 60);
    kCtx.fillText('COFFEE', 98, 76);
  }
  const coffeeTexture = new THREE.CanvasTexture(coffeeCanvas);
  coffeeTexture.wrapS = THREE.RepeatWrapping;

  // 1F. Photovoltaic Satellite Cell Grid Texture
  const solarCanvas = document.createElement('canvas');
  solarCanvas.width = 256;
  solarCanvas.height = 256;
  const sCtx = solarCanvas.getContext('2d');
  if (sCtx) {
    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 0, 256, 256);

    // Silicon wafer blue sheen
    sCtx.fillStyle = '#1e3a8a';
    sCtx.fillRect(4, 4, 248, 248);

    // Grid wires (silver / white)
    sCtx.strokeStyle = 'rgba(147, 197, 253, 0.85)';
    sCtx.lineWidth = 1.5;
    for (let x = 8; x < 256; x += 16) {
      sCtx.beginPath();
      sCtx.moveTo(x, 4);
      sCtx.lineTo(x, 252);
      sCtx.stroke();
    }

    // Busbars (gold conductors)
    sCtx.strokeStyle = '#fbbf24';
    sCtx.lineWidth = 4;
    sCtx.beginPath();
    sCtx.moveTo(64, 4);
    sCtx.lineTo(64, 252);
    sCtx.moveTo(192, 4);
    sCtx.lineTo(192, 252);
    sCtx.stroke();
  }
  const solarTexture = new THREE.CanvasTexture(solarCanvas);

  // 1G. Industrial Hazard Warning Stripes (Yellow & Black)
  const hazardCanvas = document.createElement('canvas');
  hazardCanvas.width = 256;
  hazardCanvas.height = 256;
  const hCtx = hazardCanvas.getContext('2d');
  if (hCtx) {
    hCtx.fillStyle = '#eab308'; // Safety yellow
    hCtx.fillRect(0, 0, 256, 256);

    hCtx.fillStyle = '#18181b'; // Black stripes
    for (let i = -256; i < 512; i += 48) {
      hCtx.beginPath();
      hCtx.moveTo(i, 0);
      hCtx.lineTo(i + 24, 0);
      hCtx.lineTo(i + 24 + 256, 256);
      hCtx.lineTo(i + 256, 256);
      hCtx.closePath();
      hCtx.fill();
    }
  }
  const hazardTexture = new THREE.CanvasTexture(hazardCanvas);
  hazardTexture.wrapS = THREE.RepeatWrapping;
  hazardTexture.wrapT = THREE.RepeatWrapping;

  // 1H. Craggy Dark Asteroid Rock Texture (Pitted Basalt with Flecks & Craters)
  const rockCanvas = document.createElement('canvas');
  rockCanvas.width = 256;
  rockCanvas.height = 256;
  const rCtx = rockCanvas.getContext('2d');
  if (rCtx) {
    rCtx.fillStyle = '#1e232a';
    rCtx.fillRect(0, 0, 256, 256);
    // Mottled basalt texture
    for (let i = 0; i < 400; i++) {
      const rx = (i * 37) % 256;
      const ry = (i * 61) % 256;
      const rRad = 1.5 + (i % 6);
      const shade = 28 + ((i * 13) % 40);
      rCtx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 6})`;
      rCtx.beginPath();
      rCtx.arc(rx, ry, rRad, 0, Math.PI * 2);
      rCtx.fill();
    }
  }
  const rockTexture = new THREE.CanvasTexture(rockCanvas);

  cachedTextures = {
    cola: colaTexture,
    energy: energyTexture,
    fizz: fizzTexture,
    bottle: bottleTexture,
    coffee: coffeeTexture,
    solar: solarTexture,
    hazard: hazardTexture,
    rock: rockTexture,
  };

  return cachedTextures;
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. SHARED PROCEDURAL GEOMETRIES (REAL-WORLD HUMAN SCALE: ~0.08 to 0.14 UNITS)
// ═════════════════════════════════════════════════════════════════════════════

let cachedGeoms = null;

function getCachedGeometries() {
  if (cachedGeoms) return cachedGeoms;

  // ── 2A. Soda Can Lathe Profile (Height ~0.11, Radius ~0.028) ──
  const canPts = [
    new THREE.Vector2(0, -0.055),
    new THREE.Vector2(0.016, -0.053),
    new THREE.Vector2(0.024, -0.048),
    new THREE.Vector2(0.027, -0.042),
    new THREE.Vector2(0.028, 0.042),
    new THREE.Vector2(0.024, 0.049),
    new THREE.Vector2(0.026, 0.053),
    new THREE.Vector2(0.023, 0.053),
    new THREE.Vector2(0.020, 0.051),
    new THREE.Vector2(0, 0.051),
  ];
  const canGeom = new THREE.LatheGeometry(canPts, 20);
  const cPos = canGeom.attributes.position;
  // Realistic dent in can body
  for (let i = 0; i < cPos.count; i++) {
    const y = cPos.getY(i);
    const x = cPos.getX(i);
    const z = cPos.getZ(i);
    if (Math.abs(y) < 0.025 && x > 0.006) {
      cPos.setX(i, x * 0.78);
      cPos.setZ(i, z * 0.88);
    }
  }
  canGeom.computeVertexNormals();
  canGeom.center();

  // ── 2B. Water Bottle Lathe Profile (Height ~0.14, Radius ~0.026) ──
  const bottlePts = [
    new THREE.Vector2(0, -0.070),
    new THREE.Vector2(0.016, -0.068),
    new THREE.Vector2(0.024, -0.060),
    new THREE.Vector2(0.026, -0.048),
    new THREE.Vector2(0.024, -0.026),
    new THREE.Vector2(0.026, -0.006),
    new THREE.Vector2(0.024, 0.014),
    new THREE.Vector2(0.026, 0.028),
    new THREE.Vector2(0.020, 0.045),
    new THREE.Vector2(0.012, 0.054),
    new THREE.Vector2(0.011, 0.064),
    new THREE.Vector2(0.013, 0.065),
    new THREE.Vector2(0.012, 0.071),
    new THREE.Vector2(0, 0.071),
  ];
  const bottleGeom = new THREE.LatheGeometry(bottlePts, 20);
  bottleGeom.center();

  // ── 2C. Coffee Cup Lathe Profile (Height ~0.11, Radius ~0.035) ──
  const cupPts = [
    new THREE.Vector2(0, -0.055),
    new THREE.Vector2(0.020, -0.055),
    new THREE.Vector2(0.031, 0.038),
    new THREE.Vector2(0.033, 0.040),
    new THREE.Vector2(0.032, 0.042),
    new THREE.Vector2(0.034, 0.044),
    new THREE.Vector2(0.033, 0.051),
    new THREE.Vector2(0.026, 0.053),
    new THREE.Vector2(0.016, 0.052),
    new THREE.Vector2(0, 0.052),
  ];
  const cupGeom = new THREE.LatheGeometry(cupPts, 20);
  cupGeom.center();

  // ── 2D. Vehicle Rubber Tire (Diameter ~0.11) ──
  const tireGeom = new THREE.TorusGeometry(0.044, 0.018, 12, 24);
  tireGeom.center();

  // ── 2E. HDPE Milk Jug (Height ~0.10, Width ~0.07, Depth ~0.04) ──
  const jugShape = new THREE.Shape();
  jugShape.moveTo(-0.028, -0.044);
  jugShape.lineTo(0.028, -0.044);
  jugShape.quadraticCurveTo(0.034, -0.044, 0.034, -0.022);
  jugShape.lineTo(0.031, 0.022);
  jugShape.quadraticCurveTo(0.028, 0.038, 0.012, 0.044);
  jugShape.lineTo(0.010, 0.056);
  jugShape.lineTo(-0.010, 0.056);
  jugShape.lineTo(-0.012, 0.044);
  jugShape.quadraticCurveTo(-0.028, 0.038, -0.031, 0.022);
  jugShape.lineTo(-0.034, -0.022);
  jugShape.quadraticCurveTo(-0.034, -0.044, -0.028, -0.044);

  const hole = new THREE.Path();
  hole.moveTo(0.011, 0.010);
  hole.lineTo(0.020, 0.010);
  hole.lineTo(0.020, 0.030);
  hole.lineTo(0.011, 0.030);
  hole.closePath();
  jugShape.holes.push(hole);

  const jugGeom = new THREE.ExtrudeGeometry(jugShape, {
    curveSegments: 4,
    depth: 0.032,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.003,
    bevelThickness: 0.003,
  });
  jugGeom.center();

  // ── 2F. Crumpled Grocery Bag (Height ~0.09, Width ~0.07) ──
  const bagGeom = new THREE.SphereGeometry(0.042, 16, 14);
  const bPos = bagGeom.attributes.position;
  for (let i = 0; i < bPos.count; i++) {
    let x = bPos.getX(i);
    let y = bPos.getY(i) * 1.35;
    let z = bPos.getZ(i) * 0.75;
    const fold1 = Math.sin(x * 45.0 + y * 30.0) * 0.005;
    const fold2 = Math.cos(z * 50.0 - y * 35.0) * 0.005;
    const sag = y < 0 ? 1.0 + Math.abs(y) * 0.28 : 1.0;
    if (y > 0.028) {
      const pinch = Math.max(0.18, (0.052 - y) / 0.024);
      x *= pinch;
      z *= pinch;
    }
    bPos.setXYZ(i, (x + fold2) * sag, y, (z + fold1) * sag);
  }
  bagGeom.computeVertexNormals();
  bagGeom.center();

  // ── 2G. Satellite Solar Panel Shard (0.11 x 0.07 x 0.003) ──
  const solarGeom = new THREE.BoxGeometry(0.11, 0.07, 0.003);
  solarGeom.center();

  // ── 2H. Curved Rocket Booster Fairing Plate ──
  const rocketGeom = new THREE.CylinderGeometry(0.048, 0.048, 0.09, 16, 1, true, 0, Math.PI * 0.65);
  rocketGeom.center();

  // ── 2I. Takeout Clamshell Food Box ──
  const boxGeom = new THREE.BoxGeometry(0.075, 0.045, 0.065);
  boxGeom.center();

  // ── 2J. Craggy Space Asteroid / Slag (Organic High-Detail Mesh) ──
  const slagGeom = new THREE.IcosahedronGeometry(0.042, 2);
  const sPos = slagGeom.attributes.position;
  for (let i = 0; i < sPos.count; i++) {
    const x = sPos.getX(i);
    const y = sPos.getY(i);
    const z = sPos.getZ(i);
    const crag = Math.sin(x * 38.0 + y * 24.0) * 0.007 +
                 Math.cos(y * 42.0 - z * 32.0) * 0.005 +
                 Math.sin(z * 65.0 + x * 50.0) * 0.003;
    sPos.setXYZ(i, x + crag, y + crag, z + crag);
  }
  slagGeom.computeVertexNormals();
  slagGeom.center();

  cachedGeoms = {
    can: canGeom,
    bottle: bottleGeom,
    cup: cupGeom,
    tire: tireGeom,
    jug: jugGeom,
    bag: bagGeom,
    solar: solarGeom,
    rocket: rocketGeom,
    box: boxGeom,
    slag: slagGeom,
  };

  return cachedGeoms;
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. PHOTOREALISTIC PBR MESH COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

export const DetailedCan = ({ brand = 'cola', scale = 1.0 }) => {
  const textures = getCachedTextures();
  const tex = brand === 'energy' ? textures.energy : brand === 'fizz' ? textures.fizz : textures.cola;

  // 1. Printed lacquered aluminum can body material
  const bodyMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: tex,
      metalness: 0.90,
      roughness: 0.18,
    });
  }, [tex]);

  // 2. High-grade polished raw aluminum material for rims, lids, and pull-tabs
  const silverAluminumMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      metalness: 0.98,
      roughness: 0.12,
    });
  }, []);

  // 3. Realistic creased aluminum dent geometry
  const dentedBodyGeom = useMemo(() => {
    const geom = new THREE.CylinderGeometry(0.032, 0.032, 0.098, 48, 12, true);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Subtle space debris dent on one side
      if (Math.abs(y) < 0.026 && x > 0.012) {
        const factor = 1.0 - (0.026 - Math.abs(y)) / 0.026 * (x / 0.032) * 0.32;
        pos.setX(i, x * factor);
        pos.setZ(i, z * (factor * 0.95));
      }
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  // 4. Stamped oval mouth opening on top lid
  const tabShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Stamped pull-tab silhouette with finger ring
    shape.moveTo(-0.005, -0.008);
    shape.lineTo(0.005, -0.008);
    shape.lineTo(0.005, 0.012);
    shape.quadraticCurveTo(0.005, 0.017, 0.000, 0.017);
    shape.quadraticCurveTo(-0.005, 0.017, -0.005, 0.012);
    shape.closePath();

    // Finger ring hole
    const hole = new THREE.Path();
    hole.moveTo(0.0028, 0.007);
    hole.absarc(0, 0.007, 0.0028, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.0008,
      bevelEnabled: false,
    });
    geom.center();
    return geom;
  }, []);

  return (
    <group scale={[scale, scale, scale]}>
      {/* ── A. Can Body with High-Res Coca-Cola Print ── */}
      <mesh geometry={dentedBodyGeom} material={bodyMat} />

      {/* ── B. Tapered Aluminum Neck / Chime (Upper) ── */}
      <mesh position={[0, 0.053, 0]}>
        <cylinderGeometry args={[0.0265, 0.032, 0.008, 48, 1, true]} />
        <primitive object={silverAluminumMat} attach="material" />
      </mesh>

      {/* ── C. Rolled Double-Seam Top Rim Lip ── */}
      <mesh position={[0, 0.0575, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.0268, 0.0014, 12, 48]} />
        <primitive object={silverAluminumMat} attach="material" />
      </mesh>

      {/* ── D. Recessed Silver Aluminum Top Lid ── */}
      <mesh position={[0, 0.0555, 0]}>
        <cylinderGeometry args={[0.0260, 0.0260, 0.0015, 48]} />
        <primitive object={silverAluminumMat} attach="material" />
      </mesh>

      {/* Stamped Opening Scoreline on Lid */}
      <mesh position={[0.008, 0.0565, 0.006]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <ringGeometry args={[0.003, 0.005, 16]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      {/* Silver Pull-Tab with Ring Hole */}
      <mesh position={[-0.002, 0.0572, 0.002]} rotation={[-Math.PI / 2, 0, 0.4]} geometry={tabShape}>
        <primitive object={silverAluminumMat} attach="material" />
      </mesh>

      {/* Center Rivet */}
      <mesh position={[-0.002, 0.0578, -0.002]}>
        <cylinderGeometry args={[0.0018, 0.0018, 0.0012, 16]} />
        <primitive object={silverAluminumMat} attach="material" />
      </mesh>

      {/* ── E. Tapered Aluminum Base & Recessed Concave Bottom Dome ── */}
      <mesh position={[0, -0.052, 0]}>
        <cylinderGeometry args={[0.032, 0.025, 0.006, 48, 1, true]} />
        <primitive object={silverAluminumMat} attach="material" />
      </mesh>

      {/* Rolled Bottom Seam Rim */}
      <mesh position={[0, -0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.0250, 0.0012, 12, 48]} />
        <primitive object={silverAluminumMat} attach="material" />
      </mesh>

      {/* Recessed Concave Aluminum Bottom Dome (Curving inward into can body) */}
      <mesh position={[0, -0.0545, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.0245, 48]} />
        <primitive object={silverAluminumMat} attach="material" />
      </mesh>
    </group>
  );
};

export const DetailedBottle = ({ capColor = '#2563eb', scale = 1.0 }) => {
  const textures = getCachedTextures();
  const geoms = getCachedGeometries();

  const plasticMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#93c5fd',
      roughness: 0.10,
      metalness: 0.15,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
    });
  }, []);

  const labelMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: textures.bottle,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
  }, [textures]);

  return (
    <group scale={[scale, scale, scale]}>
      {/* Translucent Bottle Body */}
      <mesh geometry={geoms.bottle} material={plasticMat} />
      {/* Printed Label Band */}
      <mesh position={[0, -0.005, 0]}>
        <cylinderGeometry args={[0.0264, 0.0264, 0.040, 20, 1, true]} />
        <primitive object={labelMat} attach="material" />
      </mesh>
      {/* Screw Cap */}
      <mesh position={[0, 0.072, 0]}>
        <cylinderGeometry args={[0.0135, 0.0135, 0.010, 16]} />
        <meshStandardMaterial color={capColor} roughness={0.3} metalness={0.15} />
      </mesh>
    </group>
  );
};

export const DetailedCoffeeCup = ({ scale = 1.0 }) => {
  const textures = getCachedTextures();
  const geoms = getCachedGeometries();

  const cupMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.75,
      metalness: 0.02,
    });
  }, []);

  const sleeveMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: textures.coffee,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
  }, [textures]);

  return (
    <group scale={[scale, scale, scale]}>
      {/* White Paper Cup Body */}
      <mesh geometry={geoms.cup} material={cupMat} />
      {/* Kraft Cardboard Heat Sleeve */}
      <mesh position={[0, -0.005, 0]}>
        <cylinderGeometry args={[0.030, 0.026, 0.038, 20, 1, true]} />
        <primitive object={sleeveMat} attach="material" />
      </mesh>
      {/* Travel Sipping Lid */}
      <mesh position={[0, 0.052, 0]}>
        <cylinderGeometry args={[0.0355, 0.0345, 0.008, 20]} />
        <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.1} />
      </mesh>
      {/* Sipping Hole */}
      <mesh position={[0.022, 0.057, 0]}>
        <boxGeometry args={[0.005, 0.002, 0.009]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>
    </group>
  );
};

export const DetailedTire = ({ scale = 1.0 }) => {
  const geoms = getCachedGeometries();
  const tireMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1a1d24',
      roughness: 0.88,
      metalness: 0.08,
    });
  }, []);

  return (
    <group scale={[scale, scale, scale]}>
      <mesh geometry={geoms.tire} material={tireMat} />
      {/* Inner Rim Lip */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.032, 0.003, 8, 20]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
    </group>
  );
};

export const DetailedMilkJug = ({ color = '#f8fafc', capColor = '#dc2626', scale = 1.0 }) => {
  const geoms = getCachedGeometries();
  const jugMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.05,
      transparent: true,
      opacity: 0.90,
    });
  }, [color]);

  return (
    <group scale={[scale, scale, scale]}>
      <mesh geometry={geoms.jug} material={jugMat} />
      {/* Red Cap */}
      <mesh position={[0, 0.058, 0.016]}>
        <cylinderGeometry args={[0.008, 0.008, 0.008, 14]} />
        <meshStandardMaterial color={capColor} roughness={0.3} />
      </mesh>
    </group>
  );
};

export const DetailedCrumpledBag = ({ color = '#f8fafc', scale = 1.0 }) => {
  const geoms = getCachedGeometries();
  const bagMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.58,
      metalness: 0.08,
      transparent: true,
      opacity: 0.80,
    });
  }, [color]);

  return (
    <group scale={[scale, scale, scale]}>
      <mesh geometry={geoms.bag} material={bagMat} />
    </group>
  );
};

export const DetailedSatelliteShard = ({ scale = 1.0 }) => {
  const textures = getCachedTextures();
  const geoms = getCachedGeometries();

  const solarMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: textures.solar,
      metalness: 0.92,
      roughness: 0.16,
    });
  }, [textures]);

  const goldFoilMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      metalness: 0.96,
      roughness: 0.22,
    });
  }, []);

  return (
    <group scale={[scale, scale, scale]}>
      {/* Photovoltaic Front Face */}
      <mesh geometry={geoms.solar} material={solarMat} />
      {/* Kapton Gold Thermal Foil Backing */}
      <mesh position={[0, 0, -0.002]}>
        <boxGeometry args={[0.11, 0.07, 0.001]} />
        <primitive object={goldFoilMat} attach="material" />
      </mesh>
      {/* Snapped Aluminum Strut */}
      <mesh position={[0.052, 0.025, 0]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.0025, 0.0025, 0.035, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.94} roughness={0.2} />
      </mesh>
    </group>
  );
};

export const DetailedRocketHull = ({ scale = 1.0 }) => {
  const textures = getCachedTextures();
  const geoms = getCachedGeometries();

  const hazardMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: textures.hazard,
      metalness: 0.86,
      roughness: 0.32,
      side: THREE.DoubleSide,
    });
  }, [textures]);

  return (
    <group scale={[scale, scale, scale]}>
      <mesh geometry={geoms.rocket} material={hazardMat} />
    </group>
  );
};

export const DetailedTakeoutBox = ({ scale = 1.0 }) => {
  const geoms = getCachedGeometries();
  const foamMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#f1f5f9',
      roughness: 0.90,
      metalness: 0.02,
    });
  }, []);

  return (
    <group scale={[scale, scale, scale]}>
      <mesh geometry={geoms.box} material={foamMat} />
      {/* Hinge groove */}
      <mesh position={[0, 0.002, -0.033]}>
        <boxGeometry args={[0.072, 0.004, 0.004]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.95} />
      </mesh>
    </group>
  );
};

export const DetailedSpaceSlag = ({ geomIdx = 0, scale = 1.0 }) => {
  const textures = getCachedTextures();
  const geoms = getCachedGeometries();
  const slagMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: textures.rock,
      color: '#cbd5e1',
      roughness: 0.88,
      metalness: 0.22,
      flatShading: false,
    });
  }, [textures]);

  return (
    <group scale={[scale, scale, scale]}>
      <mesh geometry={geoms.slag} material={slagMat} />
    </group>
  );
};
