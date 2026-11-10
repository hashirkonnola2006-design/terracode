import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function testFullCleanup() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/clean', { waitUntil: 'networkidle2' });

  // Reset store
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));

  // Dismiss tutorial if open
  try {
    const gotItBtn = await page.$('button ::-p-text(Got it)');
    if (gotItBtn) await gotItBtn.click();
  } catch (e) {}

  // 1. Complete Mission 1 by collecting 12 debris items
  console.log('Collecting 12 debris items to complete Mission 1...');
  await page.evaluate(() => {
    const store = window.useGameStore;
    for (let i = 0; i < 12; i++) {
      store.getState().collectDebrisItem(i, 'bottle', 1);
    }
  });

  await new Promise((r) => setTimeout(r, 800));

  const m1DoneText = await page.evaluate(() => {
    const panel = document.querySelector('div.fixed.bottom-3, div.fixed.bottom-4');
    return panel ? panel.innerText : '';
  });
  console.log('\n--- PANEL TEXT AFTER MISSION 1 COMPLETE ---');
  console.log(m1DoneText);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sidebar_mission1_completed.png') });

  // 2. Complete Mission 2 by converting 4 smog sources
  console.log('Converting 4 smog sources to complete Mission 2...');
  await page.evaluate(() => {
    const store = window.useGameStore;
    for (let i = 0; i < 4; i++) {
      store.getState().convertSmogSource(i);
    }
  });

  await new Promise((r) => setTimeout(r, 800));

  const m2DoneText = await page.evaluate(() => {
    const panel = document.querySelector('div.fixed.bottom-3, div.fixed.bottom-4');
    return panel ? panel.innerText : '';
  });
  console.log('\n--- PANEL TEXT AFTER MISSION 2 COMPLETE ---');
  console.log(m2DoneText);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sidebar_mission2_completed.png') });

  // 3. Complete Mission 3 and 4
  console.log('Completing Mission 3 & 4 (100% restored)...');
  await page.evaluate(() => {
    const store = window.useGameStore;
    for (let i = 0; i < 4; i++) {
      store.getState().plantForestPatch(i);
    }
    store.getState().updateOceanSweep(50);
  });

  await new Promise((r) => setTimeout(r, 1200));

  const fullCleanText = await page.evaluate(() => {
    const meter = document.querySelector('header span.tabular-nums');
    return meter ? meter.innerText : '';
  });
  console.log(`Final Global Cleanliness: ${fullCleanText}`);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sidebar_all_missions_completed.png') });

  await browser.close();
  console.log('Full cleanup flow verification complete!');
}

testFullCleanup().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

