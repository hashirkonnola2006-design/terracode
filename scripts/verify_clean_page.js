import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function runVerification() {
  console.log(`Starting headless browser with executable: ${CHROME_PATH}`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('Browser Error:', msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.toString());
    console.error('Page Error:', err);
  });

  console.log('Navigating to http://localhost:5173/clean...');
  await page.goto('http://localhost:5173/clean', { waitUntil: 'networkidle2', timeout: 30000 });

  // Dismiss tutorial if open
  try {
    await page.evaluate(() => {
      const store = window.__ECOFUTURE_STORE__ || JSON.parse(localStorage.getItem('ecofuture_game_storage') || '{}');
      // Reset game to 0% first for clean initial baseline
      const restartBtn = document.querySelector('button[title="Restart Cleaning"]');
      if (restartBtn) restartBtn.click();
    });
  } catch (e) {}

  await new Promise((r) => setTimeout(r, 1200));

  // 1. Screenshot 0% Cleanliness
  console.log('Capturing Stage 0% (Polluted Earth)...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'earth_stage_00_polluted.png') });

  // Verify rotation in Three.js SceneController
  const rotationCheck = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      let lastTime = performance.now();
      const check = () => {
        frames++;
        if (frames >= 30) {
          const fps = Math.round((frames * 1000) / (performance.now() - lastTime));
          resolve({ fps, passed: true });
        } else {
          requestAnimationFrame(check);
        }
      };
      requestAnimationFrame(check);
    });
  });
  console.log('Frame loop running at FPS:', rotationCheck.fps);

  // 2. Test Stage 25%
  console.log('Setting Cleanliness to 25%...');
  await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage');
    const state = JSON.parse(raw || '{}');
    state.state.cleanliness = 25;
    localStorage.setItem('ecofuture_game_storage', JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'earth_stage_25_recovering.png') });

  // 3. Test Stage 50%
  console.log('Setting Cleanliness to 50%...');
  await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage');
    const state = JSON.parse(raw || '{}');
    state.state.cleanliness = 50;
    localStorage.setItem('ecofuture_game_storage', JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'earth_stage_50_forests.png') });

  // 4. Test Stage 75%
  console.log('Setting Cleanliness to 75%...');
  await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage');
    const state = JSON.parse(raw || '{}');
    state.state.cleanliness = 75;
    localStorage.setItem('ecofuture_game_storage', JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'earth_stage_75_clearing.png') });

  // 5. Test Stage 100%
  console.log('Setting Cleanliness to 100%...');
  await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage');
    const state = JSON.parse(raw || '{}');
    state.state.cleanliness = 100;
    localStorage.setItem('ecofuture_game_storage', JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'earth_stage_100_restored.png') });

  // 6. Test Restart Button
  console.log('Testing Restart Button...');
  const restartBtn = await page.$('button[title="Restart Cleaning"]');
  if (restartBtn) {
    await restartBtn.click();
    await new Promise((r) => setTimeout(r, 1000));
    const cleanAfterRestart = await page.evaluate(() => {
      const el = document.querySelector('span.font-mono.tabular-nums');
      return el ? el.textContent : null;
    });
    console.log('Cleanliness after restart:', cleanAfterRestart);
  }

  // 7. Test "Skip, just heal it" animation
  console.log('Testing Skip & Auto-Heal animation...');
  const skipBtn = await page.$('button[title="Skip game and heal Earth automatically"]');
  if (skipBtn) {
    await skipBtn.click();
    console.log('Skip clicked, observing 3.5s smooth animation...');
    await new Promise((r) => setTimeout(r, 1200));
    const midwayVal = await page.evaluate(() => {
      const el = document.querySelector('span.font-mono.tabular-nums');
      return el ? el.textContent : null;
    });
    console.log('Cleanliness midway through skip animation:', midwayVal);

    await new Promise((r) => setTimeout(r, 2600));
    const finalVal = await page.evaluate(() => {
      const el = document.querySelector('span.font-mono.tabular-nums');
      return el ? el.textContent : null;
    });
    console.log('Cleanliness at end of skip animation:', finalVal);
  }

  // Final check on console errors
  console.log('Total console errors recorded:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Recorded Console Errors:', consoleErrors);
  }

  await browser.close();
  console.log('Verification run complete!');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

