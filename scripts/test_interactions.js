import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function testInteractions() {
  console.log('Testing interactive clicks on rotating planet...');
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
      console.error('Console error:', msg.text());
    }
  });

  await page.goto('http://localhost:5173/clean', { waitUntil: 'networkidle2' });

  // Reset first
  await page.evaluate(() => {
    localStorage.removeItem('ecofuture_game_storage');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));

  // Dismiss tutorial if button exists
  const gotItBtn = await page.$('button');
  if (gotItBtn) {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((el) => el.textContent.includes('Start Restoring') || el.textContent.includes('Got It'));
      if (b) b.click();
    });
  }
  await new Promise((r) => setTimeout(r, 600));

  // Check initial cleanliness
  const initialClean = await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage');
    const state = JSON.parse(raw || '{}');
    return state.state ? state.state.cleanliness : 0;
  });
  console.log('Initial Cleanliness:', initialClean);

  // Test Direct Object Trigger in Store
  console.log('Testing Mission 1 Orbit Item collection...');
  await page.evaluate(() => {
    const store = window.__ECOFUTURE_STORE__ || JSON.parse(localStorage.getItem('ecofuture_game_storage') || '{}');
    // Call store action
    const event = new CustomEvent('test-action');
    window.dispatchEvent(event);
  });

  // Verify store methods directly
  const storeStateAfterActions = await page.evaluate(() => {
    // Import useGameStore from window or module if exposed, or test store actions via component events
    const raw = localStorage.getItem('ecofuture_game_storage');
    return JSON.parse(raw || '{}').state;
  });
  console.log('Store active mission:', storeStateAfterActions?.activeMissionId);

  // Test Skip & Auto-Heal
  console.log('Testing Skip button click...');
  const skipBtn = await page.$('button[title="Skip game and heal Earth automatically"]');
  if (skipBtn) {
    await skipBtn.click();
    console.log('Skip clicked! Waiting 3.8s for smooth animation to finish...');
    await new Promise((r) => setTimeout(r, 3800));

    const finalClean = await page.evaluate(() => {
      const raw = localStorage.getItem('ecofuture_game_storage');
      const state = JSON.parse(raw || '{}');
      return state.state ? state.state.cleanliness : 0;
    });
    console.log('Cleanliness after Skip completion:', finalClean);
  }

  // Test Play Again / Restart button on EndingScreen
  console.log('Testing Restart from EndingScreen...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const restart = btns.find((b) => b.textContent.includes('Play Again') || b.title === 'Restart Cleaning');
    if (restart) restart.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  const cleanAfterRestart = await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage');
    const state = JSON.parse(raw || '{}');
    return state.state ? state.state.cleanliness : 0;
  });
  console.log('Cleanliness after Restart:', cleanAfterRestart);

  // Test local heal mask painting
  console.log('Testing Local Heal Mask painting...');
  await page.evaluate(() => {
    // Dispatch converting smog source #0 (North American Industrial Belt)
    // and planting forest #0 (Amazon Basin)
    const raw = localStorage.getItem('ecofuture_game_storage');
    const data = JSON.parse(raw || '{}');
    if (data.state) {
      data.state.mission2.convertedSources = [0];
      data.state.mission3.plantedPatches = [0];
      data.state.healRegions = [
        { lat: 41.5, lon: -87.5, radius: 0.10 },
        { lat: -8.5, lon: -55.0, radius: 0.12 },
      ];
      localStorage.setItem('ecofuture_game_storage', JSON.stringify(data));
    }
  });

  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));

  console.log('Capturing Local Healing (Heal Mask active on North America & Amazon)...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'earth_local_healing_mask.png') });

  console.log('Console Errors count:', consoleErrors.length);
  await browser.close();
  console.log('Interaction tests complete!');
}

testInteractions().catch((err) => {
  console.error('Interaction test failed:', err);
  process.exit(1);
});

