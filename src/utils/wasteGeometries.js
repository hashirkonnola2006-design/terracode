import * as THREE from 'three';

/**
 * Procedural realistic waste geometries for TerraHeal.
 * Replaces abstract shapes (boxes, plain cylinders, polyhedrons) with unmistakable consumer trash items:
 * - Plastic water bottles with indented base, ribbed grip, tapered shoulder, threaded neck, and screw cap
 * - Dented soda cans with incurved bottom dome, dented aluminum wall, neck taper, rolled lip, and recessed lid
 * - Takeout coffee cups with tapered paper body, rolled rim, and snap-on plastic travel sipping lid
 * - Molded plastic milk/detergent jugs with angled shoulder, neck, and hollow handle loop cutout
 * - Crumpled plastic grocery bags with bunched tied neck, wrinkles, and realistic sag
 * - Rubber vehicle tires with torus proportions
 */

/**
 * Realistic Plastic Water Bottle (LatheGeometry)
 */
export function createPlasticBottleGeometry(highDetail = false) {
  const segments = highDetail ? 18 : 12;
  const pts = [
    new THREE.Vector2(0, -0.62),
    new THREE.Vector2(0.14, -0.60),  // push-up base rim
    new THREE.Vector2(0.21, -0.54),
    new THREE.Vector2(0.23, -0.42),
    new THREE.Vector2(0.215, -0.22), // grip rib 1
    new THREE.Vector2(0.235, -0.05),
    new THREE.Vector2(0.22, 0.12),   // grip rib 2
    new THREE.Vector2(0.235, 0.24),
    new THREE.Vector2(0.18, 0.40),   // shoulder curve
    new THREE.Vector2(0.11, 0.48),   // neck start
    new THREE.Vector2(0.10, 0.58),   // threaded neck
    new THREE.Vector2(0.12, 0.59),   // cap bottom flange
    new THREE.Vector2(0.115, 0.66),  // screw cap
    new THREE.Vector2(0, 0.66),
  ];
  const g = new THREE.LatheGeometry(pts, segments);
  g.center();
  return g;
}

/**
 * Realistic Dented Soda / Beverage Can (LatheGeometry with deformed wall)
 */
export function createSodaCanGeometry(highDetail = false) {
  const segments = highDetail ? 16 : 12;
  const pts = [
    new THREE.Vector2(0, -0.42),
    new THREE.Vector2(0.11, -0.40),  // concave bottom dome
    new THREE.Vector2(0.17, -0.36),  // bottom chine rim
    new THREE.Vector2(0.20, -0.32),
    new THREE.Vector2(0.20, 0.28),   // can body
    new THREE.Vector2(0.17, 0.36),   // neck taper
    new THREE.Vector2(0.185, 0.40),  // rolled lip rim
    new THREE.Vector2(0.165, 0.40),
    new THREE.Vector2(0.15, 0.38),   // recessed lid
    new THREE.Vector2(0, 0.38),
  ];
  const g = new THREE.LatheGeometry(pts, segments);

  // Add realistic dent into the side wall
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    const z = pos.getZ(i);
    if (Math.abs(y) < 0.20 && x > 0.05) {
      pos.setX(i, x * 0.82);
      pos.setZ(i, z * 0.92);
    }
  }
  g.computeVertexNormals();
  g.center();
  return g;
}

/**
 * Disposable Takeout Coffee Cup with Plastic Sipping Lid (LatheGeometry)
 */
export function createCoffeeCupGeometry(highDetail = false) {
  const segments = highDetail ? 16 : 12;
  const pts = [
    new THREE.Vector2(0, -0.48),
    new THREE.Vector2(0.17, -0.48),  // paper cup bottom base
    new THREE.Vector2(0.26, 0.32),   // tapered cup wall
    new THREE.Vector2(0.28, 0.34),   // rolled drinking rim
    new THREE.Vector2(0.27, 0.36),
    new THREE.Vector2(0.285, 0.38),  // plastic snap lid rim
    new THREE.Vector2(0.275, 0.44),  // raised dome lid
    new THREE.Vector2(0.23, 0.46),   // sipping hole ridge
    new THREE.Vector2(0.16, 0.45),   // recessed lid top
    new THREE.Vector2(0, 0.45),
  ];
  const g = new THREE.LatheGeometry(pts, segments);
  g.center();
  return g;
}

/**
 * Crumpled Plastic Grocery / Trash Bag (SphereGeometry with wrinkled folds & pinched top knot)
 */
export function createCrumpledBagGeometry(highDetail = false) {
  const g = new THREE.SphereGeometry(0.36, highDetail ? 14 : 10, highDetail ? 12 : 8);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    y *= 1.35;
    z *= 0.75;

    const fold1 = Math.sin(x * 6.5 + y * 4.0) * 0.05;
    const fold2 = Math.cos(z * 7.0 - y * 4.5) * 0.04;
    const sag = (y < 0) ? (1.0 + Math.abs(y) * 0.30) : 1.0;

    // Pinched top tied knot
    if (y > 0.30) {
      const pinch = Math.max(0.18, (0.48 - y) / 0.18);
      x *= pinch;
      z *= pinch;
    }

    pos.setXYZ(i, (x + fold2) * sag, y, (z + fold1) * sag);
  }
  g.computeVertexNormals();
  g.center();
  return g;
}

/**
 * Molded Plastic Milk / Detergent Jug with Handle Cutout (ExtrudeGeometry)
 */
export function createMilkJugGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.24, -0.38);
  shape.lineTo(0.24, -0.38);
  shape.quadraticCurveTo(0.29, -0.38, 0.29, -0.20);
  shape.lineTo(0.27, 0.18);
  shape.quadraticCurveTo(0.25, 0.32, 0.11, 0.38);
  shape.lineTo(0.09, 0.50);
  shape.lineTo(-0.09, 0.50);
  shape.lineTo(-0.11, 0.38);
  shape.quadraticCurveTo(-0.25, 0.32, -0.27, 0.18);
  shape.lineTo(-0.29, -0.20);
  shape.quadraticCurveTo(-0.29, -0.38, -0.24, -0.38);

  // Handle grip cutout
  const hole = new THREE.Path();
  hole.moveTo(0.10, 0.08);
  hole.lineTo(0.18, 0.08);
  hole.lineTo(0.18, 0.26);
  hole.lineTo(0.10, 0.26);
  hole.closePath();
  shape.holes.push(hole);

  const g = new THREE.ExtrudeGeometry(shape, {
    curveSegments: 3,
    depth: 0.26,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
  });
  g.center();
  return g;
}

/**
 * Rubber Vehicle Tire (TorusGeometry)
 */
export function createRubberTireGeometry() {
  const g = new THREE.TorusGeometry(0.42, 0.17, 8, 16);
  g.center();
  return g;
}

/**
 * Procedural Soda Can Texture (Cola design with white banner)
 */
export function createSodaCanTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 46, 128, 36);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 52, 128, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('COLA', 28, 71);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * Procedural Takeout Coffee Cup Texture (White paper with brown sleeve band and dark lid top)
 */
export function createCoffeeCupTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Dark travel sipping lid
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 128, 24);
    // Upper white paper cup
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 24, 128, 32);
    // Kraft cardboard heat sleeve
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 56, 128, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('COFFEE', 36, 78);
    // Lower white paper cup
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 92, 128, 36);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}
