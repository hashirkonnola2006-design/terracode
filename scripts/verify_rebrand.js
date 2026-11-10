import puppeteer from 'puppeteer-core';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const routes = [
  { path: '/', name: 'landing', expectedTitle: 'TerraHeal | Heal the Planet by Playing' },
  { path: '/solutions', name: 'solutions', expectedTitle: 'TerraHeal | Solutions' },
  { path: '/clean', name: 'clean', expectedTitle: 'TerraHeal | Clean the Earth' },
  { path: '/quiz', name: 'quiz', expectedTitle: 'TerraHeal | Zero-Waste Quiz' },
  { path: '/game-3', name: 'game3', expectedTitle: 'TerraHeal | Game 3' },
];

async function run() {
  console.log('--- STARTING TERRAHEAL REBRAND VERIFICATION ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`[CONSOLE] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    errors.push(`[PAGEERROR] ${err.toString()}`);
  });

  // Verify routes at desktop (1440x900) and mobile (390x844)
  for (const r of routes) {
    console.log(`Checking route: ${r.path}...`);
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:5173${r.path}`, { waitUntil: 'networkidle2' });
    await new Promise((res) => setTimeout(res, 1500));

    const title = await page.title();
    console.log(`  Page title: "${title}" (Expected: "${r.expectedTitle}")`);
    if (title !== r.expectedTitle) {
      console.warn(`  WARNING: Title mismatch for ${r.path}! Got "${title}"`);
    }

    // Inspect logo element
    const logoInfo = await page.evaluate(() => {
      const mark = document.querySelector('svg[aria-label="TerraHeal mark"], .font-pixel');
      const fontPixel = document.querySelector('.font-pixel');
      let fontFamily = '';
      if (fontPixel) {
        fontFamily = window.getComputedStyle(fontPixel).fontFamily;
      }
      return {
        hasMark: !!document.querySelector('svg[viewBox="0 0 18 17"], svg[viewBox="0 0 18 18"]'),
        fontFamily,
      };
    });
    console.log(`  Logo inspection:`, logoInfo);

    // Desktop screenshot
    await page.screenshot({ path: `${ARTIFACT_DIR}/rebrand_${r.name}_desktop_1440.png` });

    // Mobile viewport
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await new Promise((res) => setTimeout(res, 500));
    await page.screenshot({ path: `${ARTIFACT_DIR}/rebrand_${r.name}_mobile_390.png` });
  }

  // Verify localStorage persistence for ecofuture_game_storage
  console.log('\n--- VERIFYING LOCALSTORAGE PERSISTENCE (ecofuture_game_storage) ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/clean', { waitUntil: 'networkidle2' });

  // Read existing storage key
  const storageData = await page.evaluate(() => {
    return {
      keys: Object.keys(localStorage),
      ecoStorage: localStorage.getItem('ecofuture_game_storage'),
    };
  });
  console.log('LocalStorage keys present:', storageData.keys);
  console.log('ecofuture_game_storage item exists:', storageData.ecoStorage !== null);

  console.log('\nVerification complete! Errors encountered:', errors.length);
  errors.forEach((e) => console.log(e));

  await browser.close();
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});

