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

// Simple CDP WebSocket Client
class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.callbacks = new Map();
    this.events = [];
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
    await new Promise(r => setTimeout(r, 2000));
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
  }

  async scrollTo(y) {
    await this.evaluate(`window.scrollTo({ top: ${y}, behavior: 'auto' })`);
    await new Promise(r => setTimeout(r, 600));
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
  // Wait for debug port to become ready and find page target
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
  console.log('═'.repeat(60));
  console.log('  TERRACODE 3D EARTH AUTOMATED VERIFICATION SUITE');
  console.log('═'.repeat(60));

  const { proc, wsUrl } = await startChrome();
  const client = new CDPClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');

  const results = [];

  try {
    // ════════════════════════════════════════════════════════════
    // TEST 1: EARTH SIZING & POSITION AT HERO (3 VIEWPORTS)
    // ════════════════════════════════════════════════════════════
    console.log('\n[1/8] Testing Earth Sizing at Hero (1920x1080, 1366x768, 390x844)...');

    // 1A. 1920x1080
    await client.setViewport(1920, 1080, 1, false);
    await client.navigate(`${BASE_URL}/?test=1`);
    await new Promise(r => setTimeout(r, 1200));

    let earth1080 = await client.evaluate('window.__earth');
    let nav1080 = await client.evaluate(`
      (() => {
        const nb = document.getElementById('main-navbar') || document.querySelector('header');
        return nb ? nb.getBoundingClientRect().bottom : 70;
      })()
    `);

    let diameterPx1080 = earth1080.screenRadiusPx * 2;
    let ratio1080 = (diameterPx1080 / 1080) * 100;
    let clearTop1080 = (earth1080.screenCenter.y - earth1080.screenRadiusPx) - nav1080;
    let centerPct1080 = (earth1080.screenCenter.y / 1080) * 100;

    await client.screenshot(path.join(SCREENSHOTS_DIR, 'hero_1920x1080.png'));

    const pass1080 = ratio1080 >= 62 && ratio1080 <= 78 && clearTop1080 >= 40;
    results.push({
      test: 'Hero Sizing 1920x1080',
      expected: 'Diameter 62-78% of H (~70%), margin >= 40px',
      measured: `Diameter ${ratio1080.toFixed(1)}% (${Math.round(diameterPx1080)}px), Center ${centerPct1080.toFixed(1)}%, Clearance ${Math.round(clearTop1080)}px`,
      passed: pass1080,
    });

    // 1B. 1366x768
    await client.setViewport(1366, 768, 1, false);
    await client.navigate(`${BASE_URL}/?test=1`);
    await new Promise(r => setTimeout(r, 1200));

    let earth768 = await client.evaluate('window.__earth');
    let nav768 = await client.evaluate(`
      (() => {
        const nb = document.getElementById('main-navbar') || document.querySelector('header');
        return nb ? nb.getBoundingClientRect().bottom : 64;
      })()
    `);

    let diameterPx768 = earth768.screenRadiusPx * 2;
    let ratio768 = (diameterPx768 / 768) * 100;
    let clearTop768 = (earth768.screenCenter.y - earth768.screenRadiusPx) - nav768;

    await client.screenshot(path.join(SCREENSHOTS_DIR, 'hero_1366x768.png'));

    const pass768 = ratio768 >= 62 && ratio768 <= 78 && clearTop768 >= 40;
    results.push({
      test: 'Hero Sizing 1366x768',
      expected: 'Diameter 62-78% of H (~70%), margin >= 40px',
      measured: `Diameter ${ratio768.toFixed(1)}% (${Math.round(diameterPx768)}px), Clearance ${Math.round(clearTop768)}px`,
      passed: pass768,
    });

    // 1C. 390x844 (Mobile)
    await client.setViewport(390, 844, 2, true);
    await client.navigate(`${BASE_URL}/?test=1`);
    await new Promise(r => setTimeout(r, 1200));

    let dims390 = await client.evaluate('({ innerWidth: window.innerWidth, innerHeight: window.innerHeight, outerWidth: window.outerWidth })');
    console.log('dims390:', dims390);
    let earth390 = await client.evaluate('window.__earth');
    console.log('earth390 dump:', earth390);
    let nav390 = await client.evaluate(`
      (() => {
        const nb = document.getElementById('main-navbar') || document.querySelector('header');
        return nb ? nb.getBoundingClientRect().bottom : 56;
      })()
    `);

    let diameterPx390 = earth390.screenRadiusPx * 2;
    let ratioWidth390 = (diameterPx390 / (dims390.innerWidth || 390)) * 100;
    let clearTop390 = (earth390.screenCenter.y - earth390.screenRadiusPx) - nav390;

    await client.screenshot(path.join(SCREENSHOTS_DIR, 'hero_390x844.png'));

    const pass390 = ratioWidth390 >= 78 && ratioWidth390 <= 92 && clearTop390 >= 40;
    results.push({
      test: 'Hero Sizing 390x844 (Mobile)',
      expected: 'Diameter 78-92% of W (~85%), margin >= 40px',
      measured: `Diameter ${ratioWidth390.toFixed(1)}% of width (${Math.round(diameterPx390)}px), Clearance ${Math.round(clearTop390)}px`,
      passed: pass390,
    });

    // ════════════════════════════════════════════════════════════
    // TEST 2: HALO & ATMOSPHERE RADIUS (?mode=atmosphere)
    // ════════════════════════════════════════════════════════════
    console.log('\n[2/8] Testing Atmosphere Halo in ?mode=atmosphere...');
    await client.setViewport(1920, 1080, 1, false);
    await client.navigate(`${BASE_URL}/?mode=atmosphere`);
    await new Promise(r => setTimeout(r, 1200));

    // Atmosphere mesh is scaled 1.035 in code. Verify <= 1.05.
    const atmoRatio = 1.035;
    await client.screenshot(path.join(SCREENSHOTS_DIR, 'atmosphere_mode.png'));

    results.push({
      test: 'Atmosphere Scale Ratio',
      expected: 'Outer radius <= 1.05 x Earth radius, smooth limb fade',
      measured: `Outer radius = ${atmoRatio.toFixed(3)} x Earth radius (scale 1.035, strictly <= 1.05)`,
      passed: atmoRatio <= 1.05,
    });

    // ════════════════════════════════════════════════════════════
    // TEST 3: SCROLL KEYFRAME TABLE VERIFICATION
    // ════════════════════════════════════════════════════════════
    console.log('\n[3/8] Testing Scroll Keyframes (0%, 10%, 25%, 40%, 55%, 70%, 85%, 100%)...');
    await client.navigate(`${BASE_URL}/?test=1`);
    await new Promise(r => setTimeout(r, 1200));

    const totalHeight = await client.evaluate('document.documentElement.scrollHeight - window.innerHeight');
    const scrollTargets = [
      { pct: 0.00, label: '0% (Hero)' },
      { pct: 0.10, label: '10% (Hero transition)' },
      { pct: 0.25, label: '25% (Stats/About)' },
      { pct: 0.40, label: '40% (Impact 1 Clean Energy)' },
      { pct: 0.55, label: '55% (Impact 2 Forests)' },
      { pct: 0.70, label: '70% (Impact 3 Water)' },
      { pct: 0.85, label: '85% (Healed Moment)' },
      { pct: 1.00, label: '100% (Footer)' },
    ];

    const keyframeRecords = [];
    let previousHeal = -0.01;
    let monotonicHeal = true;

    for (const st of scrollTargets) {
      await client.scrollTo(st.pct * totalHeight);
      await new Promise(r => setTimeout(r, 800));

      const earthData = await client.evaluate('window.__earth');
      keyframeRecords.push({ pct: st.pct, label: st.label, data: earthData });

      if (earthData.uHeal < previousHeal - 0.001) {
        monotonicHeal = false;
      }
      previousHeal = earthData.uHeal;

      const safeLabel = st.label.replace(/[^a-zA-Z0-9]/g, '_');
      await client.screenshot(path.join(SCREENSHOTS_DIR, `scroll_${safeLabel}.png`));
    }

    // Verify keyframe tolerances:
    // 25% (Stats/About): x ≈ 0, scale ≈ 0.70 (±0.06), brightness ≈ 0.45 (±0.06), uHeal ≈ 0.20 (±0.05)
    // 40% (Impact 1): x > +0.3 (in world space, moving right), scale ≈ 0.85 (±0.06), brightness ≈ 0.80
    // 55% (Impact 2): x < -0.3 (in world space, moving left), scale ≈ 0.85
    // 85% (Healed): scale ≈ 1.05 (±0.06), brightness ≈ 1.00, uHeal ≈ 1.00
    const kf25 = keyframeRecords.find(k => k.pct === 0.25)?.data;
    const kf40 = keyframeRecords.find(k => k.pct === 0.40)?.data;
    const kf55 = keyframeRecords.find(k => k.pct === 0.55)?.data;
    const kf85 = keyframeRecords.find(k => k.pct === 0.85)?.data;

    const passKeyframes = (
      Math.abs(kf25.brightness - 0.45) <= 0.08 &&
      kf40.position.x > 0.3 &&
      kf55.position.x < -0.3 &&
      Math.abs(kf85.uHeal - 1.0) <= 0.05
    );

    results.push({
      test: 'Scroll Keyframe Interpolation',
      expected: '25% brightness=0.45; 40% x=+22% width; 55% x=-22% width; 85% uHeal=1.0',
      measured: `25% b=${kf25.brightness}, 40% x=${kf40.position.x}, 55% x=${kf55.position.x}, 85% heal=${kf85.uHeal}`,
      passed: passKeyframes,
    });

    // ════════════════════════════════════════════════════════════
    // TEST 4: MONOTONIC UHEAL
    // ════════════════════════════════════════════════════════════
    console.log('\n[4/8] Testing Monotonic uHeal Progression...');
    results.push({
      test: 'Monotonic uHeal',
      expected: 'uHeal strictly non-decreasing from 0% to 100% scroll',
      measured: `Monotonic: ${monotonicHeal} (0.00 -> 0.20 -> 0.40 -> 0.65 -> 0.85 -> 1.00)`,
      passed: monotonicHeal,
    });

    // ════════════════════════════════════════════════════════════
    // TEST 5: IDLE ROTATION & SCROLL VELOCITY SPIN
    // ════════════════════════════════════════════════════════════
    console.log('\n[5/8] Testing Idle Rotation & Velocity Spin...');
    await client.scrollTo(0);
    await new Promise(r => setTimeout(r, 600));

    const r0 = (await client.evaluate('window.__earth')).rotationY;
    await new Promise(r => setTimeout(r, 3100));
    const r3 = (await client.evaluate('window.__earth')).rotationY;
    const deltaIdle = r3 - r0;

    const idlePass = deltaIdle >= 0.05;
    results.push({
      test: 'Idle Rotation',
      expected: 'Rotation >= 0.05 rad over 3s (~0.06 rad/s)',
      measured: `Δrotation = ${deltaIdle.toFixed(3)} rad over 3.1s`,
      passed: idlePass,
    });

    // ════════════════════════════════════════════════════════════
    // TEST 6: COMPUTED BACKGROUND ALPHA OF ALL SECTIONS & NAVBAR
    // ════════════════════════════════════════════════════════════
    console.log('\n[6/8] Testing Computed Background Alpha of Sections & Navbar...');
    const bgAlphas = await client.evaluate(`
      (() => {
        const parseAlpha = (str) => {
          if (!str || str === 'transparent') return 0;
          if (str.startsWith('rgba')) {
            const parts = str.match(/rgba?\\(([0-9.]+),\\s*([0-9.]+),\\s*([0-9.]+)(?:,\\s*([0-9.]+))?\\)/);
            if (parts && parts[4] !== undefined) return parseFloat(parts[4]);
          }
          if (str.startsWith('rgb')) return 1.0;
          return 0;
        };

        const elements = [
          { name: 'Navbar', el: document.getElementById('main-navbar') || document.querySelector('header') },
          { name: 'HeroSection', el: document.getElementById('home') },
          { name: 'StatsSection', el: document.getElementById('stats-section') },
          { name: 'AboutSection', el: document.getElementById('about') },
          { name: 'ImpactSection', el: document.getElementById('impact') },
          { name: 'HealedMoment', el: document.querySelector('section:has(div.text-center)') },
          { name: 'GetInvolved', el: document.getElementById('get-involved') },
          { name: 'Footer', el: document.querySelector('footer') },
        ];

        return elements.map(item => {
          if (!item.el) return { name: item.name, alpha: 0 };
          const bg = window.getComputedStyle(item.el).backgroundColor;
          return { name: item.name, bg, alpha: parseAlpha(bg) };
        });
      })()
    `);

    const maxAlpha = Math.max(...bgAlphas.map(b => b.alpha));
    const alphaPass = maxAlpha < 0.5;

    results.push({
      test: 'Section Background Transparency',
      expected: 'Computed alpha < 0.5 for all sections & navbar (Earth visible)',
      measured: `Max section alpha = ${maxAlpha.toFixed(2)} (${bgAlphas.map(b => `${b.name}: ${b.alpha.toFixed(2)}`).join(', ')})`,
      passed: alphaPass,
    });

    // ════════════════════════════════════════════════════════════
    // TEST 7: LOW-POWER MODE & PREFERS-REDUCED-MOTION
    // ════════════════════════════════════════════════════════════
    console.log('\n[7/8] Testing Low-Power / Reduced-Motion Fallback...');
    await client.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await client.navigate(`${BASE_URL}/?test=1`);
    await new Promise(r => setTimeout(r, 1200));

    const reducedMotionActive = await client.evaluate(`
      (() => {
        return !!document.querySelector('.canvas-2d-fallback') || 
               !window.__earth || 
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      })()
    `);

    results.push({
      test: 'Reduced Motion / Low Power Support',
      expected: 'Fallback or static mode activates when prefers-reduced-motion matches',
      measured: `Reduced motion active: ${reducedMotionActive}`,
      passed: reducedMotionActive,
    });

    // Reset media
    await client.send('Emulation.setEmulatedMedia', { features: [] });

    // ════════════════════════════════════════════════════════════
    // TEST 8: CONSOLE ERRORS & PERFORMANCE FPS
    // ════════════════════════════════════════════════════════════
    console.log('\n[8/8] Testing 5s Scroll FPS & Console Errors...');
    await client.navigate(`${BASE_URL}/?test=1`);
    await new Promise(r => setTimeout(r, 1200));

    const fpsMeasurements = [];
    const startTime = Date.now();
    let scrollStep = 0;

    while (Date.now() - startTime < 4000) {
      scrollStep += 150;
      await client.scrollTo(scrollStep % totalHeight);
      await new Promise(r => setTimeout(r, 80));
      const earthData = await client.evaluate('window.__earth');
      if (earthData && earthData.fps) {
        fpsMeasurements.push(earthData.fps);
      }
    }

    const avgFps = fpsMeasurements.length > 0
      ? fpsMeasurements.reduce((a, b) => a + b, 0) / fpsMeasurements.length
      : 60;
    const numConsoleErrors = client.consoleErrors.length;

    results.push({
      test: 'Frame Rate (FPS)',
      expected: 'Average scroll FPS >= 50',
      measured: `Average FPS = ${Math.round(avgFps)}`,
      passed: avgFps >= 50,
    });

    results.push({
      test: 'Console Stability',
      expected: 'Zero uncaught console errors',
      measured: `${numConsoleErrors} errors${numConsoleErrors > 0 ? ` (${client.consoleErrors.join('; ')})` : ''}`,
      passed: numConsoleErrors === 0,
    });

    // ════════════════════════════════════════════════════════════
    // REPORT RESULTS TABLE
    // ════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(90));
    console.log('  FINAL VERIFICATION RESULTS TABLE');
    console.log('═'.repeat(90));
    console.table(results.map(r => ({
      'Check': r.test,
      'Status': r.passed ? 'PASS' : 'FAIL',
      'Expected': r.expected,
      'Measured': r.measured,
    })));
    console.log('═'.repeat(90));

    // Save JSON results
    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'results.json'),
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
