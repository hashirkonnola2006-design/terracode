import puppeteer from 'puppeteer-core';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function runPreciseCheck() {
  console.log('=== PRECISE TIMELINE CAPTURE ===');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });

  const milestones = [
    { name: '01_black', waitMs: 80, desc: '0.08s - Black hold' },
    { name: '02_teal_static', waitMs: 450, desc: '0.45s - Teal pixel static filling in' },
    { name: '03_logo_blocky', waitMs: 750, desc: '0.75s - Logo appears blocky & sharpening' },
    { name: '04_logo_sharp_hold', waitMs: 1380, desc: '1.38s - Sharp logo on solid teal hold' },
    { name: '05_reverse_dissolve', waitMs: 1680, desc: '1.68s - Reverse dissolve revealing underlying site' },
    { name: '06_fully_revealed', waitMs: 2100, desc: '2.10s - Intro fully unmounted from DOM' },
  ];

  for (const m of milestones) {
    console.log(`Testing milestone: ${m.desc}...`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    // Clear session storage before each load
    await page.goto('about:blank');
    await page.goto('http://localhost:5173/?intro=1', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, m.waitMs));

    const domInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[aria-hidden="true"]');
      const sr = document.querySelector('[role="status"]');
      const bodyOverflow = document.body.style.overflow;
      return {
        hasCanvas: !!canvas,
        hasSr: !!sr,
        bodyOverflow,
      };
    });

    console.log(`  State at ${m.waitMs}ms:`, domInfo);
    await page.screenshot({ path: `${ARTIFACT_DIR}/precise_intro_${m.name}.png` });
    await page.close();
  }

  // Multi-viewport tests at 1.35s (sharp hold) and 2.1s (revealed)
  const viewports = [
    { name: '1920x1080', width: 1920, height: 1080, isMobile: false },
    { name: '768x1024', width: 768, height: 1024, isMobile: false },
    { name: '390x844', width: 390, height: 844, isMobile: true, hasTouch: true },
  ];

  for (const vp of viewports) {
    console.log(`Testing viewport ${vp.name}...`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    await page.goto('http://localhost:5173/?intro=1', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1350));
    await page.screenshot({ path: `${ARTIFACT_DIR}/precise_intro_${vp.name}_hold.png` });

    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: `${ARTIFACT_DIR}/precise_intro_${vp.name}_revealed.png` });
    await page.close();
  }

  // Test session storage behavior
  console.log('\n--- VERIFYING SESSION STORAGE NO-REPLAY ---');
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // First visit with ?intro=1 sets session storage
  await page.goto('http://localhost:5173/?intro=1', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2200));

  // Reload without ?intro=1 -> MUST NOT SHOW INTRO
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 150));
  const hasIntroOnReload = await page.evaluate(() => {
    return !!document.querySelector('canvas[aria-hidden="true"]');
  });
  console.log('Intro shown on page reload without ?intro=1 (MUST BE FALSE):', hasIntroOnReload);

  // Navigate to /solutions -> MUST NOT SHOW INTRO
  await page.goto('http://localhost:5173/solutions', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 150));
  const hasIntroOnSolutions = await page.evaluate(() => {
    return !!document.querySelector('canvas[aria-hidden="true"]');
  });
  console.log('Intro shown on /solutions navigation (MUST BE FALSE):', hasIntroOnSolutions);

  // Navigate back to / -> MUST NOT SHOW INTRO
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 150));
  const hasIntroOnBackLanding = await page.evaluate(() => {
    return !!document.querySelector('canvas[aria-hidden="true"]');
  });
  console.log('Intro shown returning to landing / (MUST BE FALSE):', hasIntroOnBackLanding);

  await page.close();
  await browser.close();
  console.log('=== VERIFICATION COMPLETE ===');
}

runPreciseCheck().catch(console.error);

