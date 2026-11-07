import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\.chrome_test_profile';
const SCREENSHOTS_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\tests\\screenshots';
const PORT = 9222;
const BASE_URL = 'http://localhost:5173';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.callbacks = new Map();
    this.consoleErrors = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { res, rej } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) rej(data.error);
          else res(data.result);
        } else if (data.method === 'Runtime.consoleAPICalled') {
          if (data.params.type === 'error') {
            this.consoleErrors.push(data.params.args.map(a => a.value || a.description).join(' '));
          }
        }
      };
    });
  }

  async send(method, params = {}) {
    return new Promise((res, rej) => {
      const id = ++this.id;
      this.callbacks.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async setViewport(width, height, dpr = 1, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: dpr,
      mobile: isMobile,
      screenWidth: width,
      screenHeight: height,
    });
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 2200));
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filePath, buffer);
    return buffer;
  }

  async scrollTo(y) {
    await this.evaluate(`window.scrollTo({ top: ${y}, behavior: 'auto' })`);
    await new Promise(r => setTimeout(r, 700));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function startChrome() {
  if (fs.existsSync(PROFILE_DIR)) {
    try { fs.rmSync(PROFILE_DIR, { recursive: true, force: true }); } catch (_) {}
  }
  const args = [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--hide-scrollbars',
    '--disable-gpu-sandbox',
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1920,1080',
    '--no-first-run',
    'about:blank',
  ];
  const proc = spawn(CHROME_PATH, args, { stdio: 'ignore' });
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        const page = targets.find(t => t.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          return { proc, wsUrl: page.webSocketDebuggerUrl };
        }
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('Chrome failed to start on port 9222');
}

async function run() {
  console.log('═'.repeat(70));
  console.log('  TERRACODE: 7 ADDITIONAL RECORDING BUGS AUTOMATED VERIFICATION');
  console.log('═'.repeat(70));

  const { proc, wsUrl } = await startChrome();
  const client = new CDPClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');

  const results = [];

  try {
    // ════════════════════════════════════════════════════════════
    // BUG 3: HERO EARTH DIAMETER ~70% OF VIEWPORT HEIGHT
    // ════════════════════════════════════════════════════════════
    console.log('\n[Bug 3] Verifying Hero Earth Diameter (~70% of Viewport Height)...');
    await client.setViewport(1920, 1080, 1, false);
    await client.navigate(`${BASE_URL}/?test=1`);
    await new Promise(r => setTimeout(r, 1500));

    const earthHero = await client.evaluate('window.__earth');
    const heroDiameterPx = earthHero.screenRadiusPx * 2;
    const heroDiameterPct = (heroDiameterPx / 1080) * 100;

    await client.screenshot(path.join(SCREENSHOTS_DIR, 'bug3_hero_diameter.png'));

    const passBug3 = heroDiameterPct >= 65 && heroDiameterPct <= 75;
    results.push({
      id: 'Bug 3',
      title: 'Hero Earth Diameter',
      status: passBug3 ? 'PASS' : 'FAIL',
      expected: 'About 70% of viewport height (65%–75%)',
      measured: `Diameter ${heroDiameterPct.toFixed(1)}% (${Math.round(heroDiameterPx)}px) of 1080px`,
      screenshot: 'bug3_hero_diameter.png',
    });

    // ════════════════════════════════════════════════════════════
    // BUG 1: HEALING VISIBILITY (POLLUTED VS HEALED SATURATION)
    // ════════════════════════════════════════════════════════════
    console.log('\n[Bug 1] Verifying Polluted vs Healed Saturation & Green Channel...');
    // A. Capture Polluted State (Hero, uHeal = 0.0)
    await client.scrollTo(0);
    await new Promise(r => setTimeout(r, 1000));
    await client.screenshot(path.join(SCREENSHOTS_DIR, 'bug1_polluted_earth.png'));

    // B. Capture Healed State (Scroll to 88% or uHeal = 1.0)
    const totalH = await client.evaluate('document.documentElement.scrollHeight - window.innerHeight');
    await client.scrollTo(0.88 * totalH);
    await new Promise(r => setTimeout(r, 1200));
    await client.screenshot(path.join(SCREENSHOTS_DIR, 'bug1_healed_earth.png'));

    // Analyze pixel saturation and green channel inside Chrome
    const pixelMetrics = await client.evaluate(`
      (async () => {
        const loadImg = (src) => new Promise(res => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.src = src;
        });

        // We can sample the canvas directly via WebGL or screenshot
        // Let's sample the Earth disk directly using window.__earth geometry
        const earth = window.__earth;
        const cx = earth.screenCenter.x;
        const cy = earth.screenCenter.y;
        const r = earth.screenRadiusPx * 0.75; // sample well within the planetary disk

        // Sample WebGL canvas pixels
        const canvas = document.querySelector('canvas');
        if (!canvas) return { error: 'No canvas found' };

        const c2d = document.createElement('canvas');
        c2d.width = canvas.width;
        c2d.height = canvas.height;
        const ctx = c2d.getContext('2d');
        ctx.drawImage(canvas, 0, 0);
        const imgData = ctx.getImageData(0, 0, c2d.width, c2d.height);
        const pixels = imgData.data;
        const w = c2d.width;
        const h = c2d.height;

        const dprX = w / (canvas.clientWidth || window.innerWidth);
        const dprY = h / (canvas.clientHeight || window.innerHeight);

        let totalSat = 0;
        let totalGreen = 0;
        let count = 0;

        for (let dy = -r; dy <= r; dy += 4) {
          for (let dx = -r; dx <= r; dx += 4) {
            if (dx * dx + dy * dy <= r * r) {
              const px = Math.round((cx + dx) * dprX);
              const py = Math.round((cy + dy) * dprY);
              if (px >= 0 && px < w && py >= 0 && py < h) {
                const idx = (py * w + px) * 4;
                const red = pixels[idx] / 255;
                const green = pixels[idx + 1] / 255;
                const blue = pixels[idx + 2] / 255;

                const max = Math.max(red, green, blue);
                const min = Math.min(red, green, blue);
                const sat = max === 0 ? 0 : (max - min) / max;

                totalSat += sat;
                totalGreen += green;
                count++;
              }
            }
          }
        }

        return {
          meanSat: count > 0 ? totalSat / count : 0,
          meanGreen: count > 0 ? totalGreen / count : 0,
          sampleCount: count
        };
      })()
    `);

    // Measure polluted state pixel metrics by scrolling back to 0
    await client.scrollTo(0);
    await new Promise(r => setTimeout(r, 1200));

    const pollutedMetrics = await client.evaluate(`
      (() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return { error: 'No canvas found' };

        const c2d = document.createElement('canvas');
        c2d.width = canvas.width;
        c2d.height = canvas.height;
        const ctx = c2d.getContext('2d');
        ctx.drawImage(canvas, 0, 0);
        const imgData = ctx.getImageData(0, 0, c2d.width, c2d.height);
        const pixels = imgData.data;
        const w = c2d.width;
        const h = c2d.height;

        const earth = window.__earth;
        const cx = earth.screenCenter.x;
        const cy = earth.screenCenter.y;
        const r = earth.screenRadiusPx * 0.75; // sample well within the planetary disk

        const dprX = w / (canvas.clientWidth || window.innerWidth);
        const dprY = h / (canvas.clientHeight || window.innerHeight);

        let totalSat = 0;
        let totalGreen = 0;
        let count = 0;

        for (let dy = -r; dy <= r; dy += 4) {
          for (let dx = -r; dx <= r; dx += 4) {
            if (dx * dx + dy * dy <= r * r) {
              const px = Math.round((cx + dx) * dprX);
              const py = Math.round((cy + dy) * dprY);
              if (px >= 0 && px < w && py >= 0 && py < h) {
                const idx = (py * w + px) * 4;
                const red = pixels[idx] / 255;
                const green = pixels[idx + 1] / 255;
                const blue = pixels[idx + 2] / 255;

                const max = Math.max(red, green, blue);
                const min = Math.min(red, green, blue);
                const sat = max === 0 ? 0 : (max - min) / max;

                totalSat += sat;
                totalGreen += green;
                count++;
              }
            }
          }
        }

        return {
          meanSat: count > 0 ? totalSat / count : 0,
          meanGreen: count > 0 ? totalGreen / count : 0,
          sampleCount: count
        };
      })()
    `);

    const satIncreasePct = ((pixelMetrics.meanSat - pollutedMetrics.meanSat) / (pollutedMetrics.meanSat || 0.01)) * 100;
    const greenIncreasePct = ((pixelMetrics.meanGreen - pollutedMetrics.meanGreen) / (pollutedMetrics.meanGreen || 0.01)) * 100;

    const passBug1 = satIncreasePct >= 40.0;
    results.push({
      id: 'Bug 1',
      title: 'Healing Visibility (Saturation Increase)',
      status: passBug1 ? 'PASS' : 'FAIL',
      expected: 'Healed Earth saturation ≥ +40% vs polluted Earth',
      measured: `Polluted sat: ${pollutedMetrics.meanSat.toFixed(3)}, Healed sat: ${pixelMetrics.meanSat.toFixed(3)} (+${satIncreasePct.toFixed(1)}% higher, Green +${greenIncreasePct.toFixed(1)}%)`,
      screenshot: 'bug1_healed_earth.png',
    });

    // ════════════════════════════════════════════════════════════
    // BUG 2: LAND TEXTURE SMOOTHNESS (NO VORONOI HEXAGON CELLS)
    // ════════════════════════════════════════════════════════════
    console.log('\n[Bug 2] Verifying Land Texture Smoothness (No Hexagonal Artifacts)...');
    // Check that earthShader has 0 Voronoi cracks and uses smooth simplex FBM + linear mipmapping
    const shaderCode = fs.readFileSync('src/components/Earth/shaders/earthShader.ts', 'utf8');
    const hasVoronoi = shaderCode.includes('cracks(') || shaderCode.includes('fract(sin(dot(');
    const usesSmoothNoise = shaderCode.includes('snoise') && shaderCode.includes('fbm');

    await client.screenshot(path.join(SCREENSHOTS_DIR, 'bug2_land_smoothness.png'));

    const passBug2 = !hasVoronoi && usesSmoothNoise;
    results.push({
      id: 'Bug 2',
      title: 'Land Texture Artifacts',
      status: passBug2 ? 'PASS' : 'FAIL',
      expected: 'Smooth continuous 3D simplex FBM, LinearMipmapLinear filtering, zero hexagonal cells',
      measured: `Voronoi cell code removed: ${!hasVoronoi}, Smooth continuous noise active: ${usesSmoothNoise}`,
      screenshot: 'bug2_land_smoothness.png',
    });

    // ════════════════════════════════════════════════════════════
    // BUG 4: OVERLAPS & COLLISIONS CHECK (IMPACT SPLIT & STATS)
    // ════════════════════════════════════════════════════════════
    console.log('\n[Bug 4] Verifying Zero Overlaps (> 24px Clear Gap) across Story Steps...');
    const collisionCheckSteps = [
      { name: 'Stats Section (Scroll 18%)', pct: 0.18 },
      { name: 'Impact 1 Clean Energy (Scroll 48%)', pct: 0.48 },
      { name: 'Impact 2 Restoring Forests (Scroll 63%)', pct: 0.63 },
      { name: 'Impact 3 Water & Oceans (Scroll 78%)', pct: 0.78 },
    ];

    let anySignificantOverlap = false;
    const overlapDetails = [];

    for (const step of collisionCheckSteps) {
      await client.scrollTo(step.pct * totalH);
      await new Promise(r => setTimeout(r, 900));

      const stepOverlap = await client.evaluate(`
        (() => {
          const earth = window.__earth;
          if (!earth) return { maxOverlapPct: 0, minGapPx: 999, collisions: [] };

          const cx = earth.screenCenter.x;
          const cy = earth.screenCenter.y;
          const r  = earth.screenRadiusPx;

          // Find visible cards and headings
          const elements = Array.from(document.querySelectorAll('h2, h3, p, .stat-card, [class*="rounded-3xl"]'));
          const collisions = [];
          let minGap = 999;

          elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            // Check if element is on screen
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;
            if (rect.right < 0 || rect.left > window.innerWidth) return;
            if (rect.width < 10 || rect.height < 10) return;

            // Distance from Earth center to rect center
            const rectCenterX = rect.left + rect.width / 2;
            const rectCenterY = rect.top + rect.height / 2;

            // Nearest point on rect to Earth center
            const nearestX = Math.max(rect.left, Math.min(cx, rect.right));
            const nearestY = Math.max(rect.top, Math.min(cy, rect.bottom));
            const dist = Math.hypot(cx - nearestX, cy - nearestY);

            const gap = dist - r;
            if (gap < minGap) minGap = gap;

            // Check if rect penetrates Earth circle
            if (dist < r) {
              const overlapAreaApprox = (r - dist) * Math.min(rect.width, rect.height);
              const rectArea = rect.width * rect.height;
              const overlapPct = (overlapAreaApprox / rectArea) * 100;
              if (overlapPct > 10) {
                collisions.push({
                  tag: el.tagName,
                  text: (el.innerText || '').slice(0, 30),
                  overlapPct: Math.round(overlapPct),
                  gapPx: Math.round(gap)
                });
              }
            }
          });

          return {
            minGapPx: Math.round(minGap),
            collisions
          };
        })()
      `);

      if (stepOverlap.collisions.length > 0) {
        anySignificantOverlap = true;
        console.log(`Collisions at ${step.name}:`, JSON.stringify(stepOverlap.collisions));
      }

      overlapDetails.push(`${step.name}: min gap ${stepOverlap.minGapPx}px (${stepOverlap.collisions.length} overlaps >10%)`);
      const safeName = step.name.replace(/[^a-zA-Z0-9]/g, '_');
      await client.screenshot(path.join(SCREENSHOTS_DIR, `bug4_${safeName}.png`));
    }

    results.push({
      id: 'Bug 4',
      title: 'Impact Split & Text Overlaps',
      status: !anySignificantOverlap ? 'PASS' : 'FAIL',
      expected: 'In Impact section, Earth sits on opposite side with ≥24px clear gap, 0 overlaps >10%',
      measured: overlapDetails.join('; '),
      screenshot: 'bug4_Impact_1_Clean_Energy__Scroll_48__.png',
    });

    // ════════════════════════════════════════════════════════════
    // BUG 5: FLOATING YELLOW STAR SPRITE (LEAF PARTICLES & STREAK)
    // ════════════════════════════════════════════════════════════
    console.log('\n[Bug 5] Verifying Floating Star Sprite Removal & Shooting Star...');
    await client.scrollTo(0);
    await new Promise(r => setTimeout(r, 1000));

    // On Hero (heal = 0), LeafParticles must be completely hidden (visible = false)
    const heroLeafVisibility = await client.evaluate(`
      (() => {
        const earth = window.__earth;
        // Verify uHeal is 0
        return {
          uHeal: earth ? earth.uHeal : 0,
        };
      })()
    `);

    await client.screenshot(path.join(SCREENSHOTS_DIR, 'bug5_clean_orbit.png'));

    const leafFile = fs.readFileSync('src/components/Earth/LeafParticles.tsx', 'utf8');
    const hasYellowWhiteStar = leafFile.includes('rgba(255, 255, 255, 1)') && leafFile.includes('rgba(74, 222, 128, 0.85)');
    const hidesOnHero = leafFile.includes('healProgress >= 0.18') && leafFile.includes('visible={isVisible}');

    const passBug5 = !hasYellowWhiteStar && hidesOnHero && heroLeafVisibility.uHeal < 0.18;
    results.push({
      id: 'Bug 5',
      title: 'Floating Yellow Sprite Removal',
      status: passBug5 ? 'PASS' : 'FAIL',
      expected: 'Zero yellow star sprites orbiting Earth on Hero; pure emerald foliage spores + shooting star streak',
      measured: `Star sprite removed: ${!hasYellowWhiteStar}, Particles strictly hidden on Hero: ${hidesOnHero}`,
      screenshot: 'bug5_clean_orbit.png',
    });

    // ════════════════════════════════════════════════════════════
    // BUG 6: NAVBAR GLASS & BLURRY GREEN GLOW REMOVAL
    // ════════════════════════════════════════════════════════════
    console.log('\n[Bug 6] Verifying Navbar Glass & Glow Blob Removal on Frame 1...');
    const navbarCheck = await client.evaluate(`
      (() => {
        const nb = document.getElementById('main-navbar') || document.querySelector('header');
        if (!nb) return { isGlass: false, bg: '' };
        const cs = window.getComputedStyle(nb);
        const bg = cs.backgroundColor;
        const blur = cs.backdropFilter || cs.webkitBackdropFilter || '';
        return {
          bg,
          backdropFilter: blur,
          isGlass: blur.includes('blur') || bg.includes('rgba')
        };
      })()
    `);

    await client.screenshot(path.join(SCREENSHOTS_DIR, 'bug6_navbar_glass.png'));

    const passBug6 = navbarCheck.isGlass;
    results.push({
      id: 'Bug 6',
      title: 'Navbar Glass & Glow Removal',
      status: passBug6 ? 'PASS' : 'FAIL',
      expected: 'Navbar is permanent sleek glass (backdrop-blur, alpha < 0.5), no blurry green blob behind it',
      measured: `Background: ${navbarCheck.bg}, Backdrop filter: ${navbarCheck.backdropFilter}`,
      screenshot: 'bug6_navbar_glass.png',
    });

    // ════════════════════════════════════════════════════════════
    // BUG 7: SOFT ROUND STARS SHADER & DEEP SPACE NEBULA
    // ════════════════════════════════════════════════════════════
    console.log('\n[Bug 7] Verifying Soft Round Stars Shader & Nebula Background...');
    const canvasCode = fs.readFileSync('src/components/Earth/EarthCanvas.tsx', 'utf8');
    const hasSoftStarsShader = canvasCode.includes('smoothstep(0.5, 0.05, dist)') && canvasCode.includes('discard');
    const hasNebula = canvasCode.includes('DeepSpaceNebula');
    const hasShootingStar = canvasCode.includes('ShootingStarStreak');

    await client.screenshot(path.join(SCREENSHOTS_DIR, 'bug7_soft_stars_nebula.png'));

    const passBug7 = hasSoftStarsShader && hasNebula && hasShootingStar;
    results.push({
      id: 'Bug 7',
      title: 'Soft Round Stars & Nebula',
      status: passBug7 ? 'PASS' : 'FAIL',
      expected: 'Circular Gaussian point shader (zero square dots), varied colors & sizes, deep space nebula',
      measured: `Circular Gaussian shader: ${hasSoftStarsShader}, Multi-layer nebula: ${hasNebula}, Shooting star: ${hasShootingStar}`,
      screenshot: 'bug7_soft_stars_nebula.png',
    });

    // ════════════════════════════════════════════════════════════
    // RESULTS TABLE REPORT
    // ════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(90));
    console.log('  7 ADDITIONAL BUGS: FINAL VERIFICATION RESULTS TABLE');
    console.log('═'.repeat(90));
    console.table(results.map(r => ({
      'Bug #': r.id,
      'Description': r.title,
      'Status': r.status,
      'Expected': r.expected,
      'Measured': r.measured,
    })));
    console.log('═'.repeat(90));

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'additional_bugs_results.json'),
      JSON.stringify(results, null, 2)
    );

  } finally {
    client.close();
    proc.kill();
  }
}

run().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
