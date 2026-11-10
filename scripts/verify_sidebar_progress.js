import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function verifySidebarProgress() {
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

  console.log('Navigating to http://localhost:5173/clean...');
  await page.goto('http://localhost:5173/clean', { waitUntil: 'networkidle2', timeout: 30000 });

  // Reset store to fresh state to test from 0
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  // Dismiss tutorial if open
  try {
    const gotItBtn = await page.$('button ::-p-text(Got it)');
    if (gotItBtn) await gotItBtn.click();
  } catch (e) {}

  // 1. Verify initial mission panel text
  const initialPanelText = await page.evaluate(() => {
    const panel = document.querySelector('div.fixed.bottom-3, div.fixed.bottom-4');
    return panel ? panel.innerText : 'PANEL_NOT_FOUND';
  });
  console.log('\n--- INITIAL MISSION PANEL TEXT ---');
  console.log(initialPanelText);

  // Check expected targets: 12, 4, 4
  const has0_12 = initialPanelText.includes('0/12');
  const has0_4 = initialPanelText.includes('0/4');
  console.log(`Checking targets: 0/12 present? ${has0_12}, 0/4 present? ${has0_4}`);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sidebar_initial_0_of_12.png') });

  // 2. Perform debris collection and observe reactivity
  console.log('\nCollecting debris items in store...');
  const afterDebris = await page.evaluate(async () => {
    const store = window.useGameStore;
    if (!store) throw new Error('window.useGameStore not found!');
    store.getState().collectDebrisItem(0, 'bottle', 1);
    store.getState().collectDebrisItem(1, 'can', 1);
    store.getState().collectDebrisItem(2, 'bottle', 1);
    return {
      storeCleanup: store.getState().cleanup,
      storeCleanliness: store.getState().cleanliness,
      storeM1: store.getState().mission1,
    };
  });
  console.log('Store state after 3 debris items:', JSON.stringify(afterDebris, null, 2));

  await new Promise((r) => setTimeout(r, 800));

  const afterDebrisPanelText = await page.evaluate(() => {
    const panel = document.querySelector('div.fixed.bottom-3, div.fixed.bottom-4');
    return panel ? panel.innerText : 'PANEL_NOT_FOUND';
  });
  console.log('\n--- PANEL TEXT AFTER 3 DEBRIS ITEMS ---');
  console.log(afterDebrisPanelText);

  const has3_12 = afterDebrisPanelText.includes('3/12');
  console.log(`Reactivity verification: '3/12' present in sidebar DOM? ${has3_12}`);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sidebar_updated_3_of_12.png') });

  // 3. Convert 1 smog source and plant 1 forest
  console.log('\nConverting smog and planting forest...');
  await page.evaluate(async () => {
    const store = window.useGameStore;
    store.getState().convertSmogSource(0);
    store.getState().plantForestPatch(0);
    store.getState().updateOceanSweep(25);
  });

  await new Promise((r) => setTimeout(r, 800));

  const finalPanelText = await page.evaluate(() => {
    const panel = document.querySelector('div.fixed.bottom-3, div.fixed.bottom-4');
    return panel ? panel.innerText : 'PANEL_NOT_FOUND';
  });
  console.log('\n--- FINAL PANEL TEXT AFTER ALL MISSIONS PROGRESS ---');
  console.log(finalPanelText);

  const cleanlinessText = await page.evaluate(() => {
    const meter = document.querySelector('header span.tabular-nums');
    return meter ? meter.innerText : 'METER_NOT_FOUND';
  });
  console.log(`Top bar Global Cleanliness: ${cleanlinessText}`);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sidebar_multimission_progress.png') });

  await browser.close();
  console.log('\nVerification completed successfully!');
}

verifySidebarProgress().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
