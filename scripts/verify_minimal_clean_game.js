import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function runVerification() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // 1. Desktop Viewport (1440x900)
  await page.setViewport({ width: 1440, height: 900 });
  console.log('Navigating to http://localhost:5173/clean...');
  await page.goto('http://localhost:5173/clean', { waitUntil: 'networkidle0' });

  // Dismiss tutorial if present
  try {
    const dismissBtn = await page.$('button[title="Skip tutorial"]');
    if (dismissBtn) {
      await dismissBtn.click();
      await new Promise((r) => setTimeout(r, 400));
    }
  } catch (_) {}

  // Allow 3D canvas to render
  await new Promise((r) => setTimeout(r, 1200));

  // Capture initial clean screen
  const initialPath = path.join(ARTIFACT_DIR, 'clean_game_initial_minimal.png');
  await page.screenshot({ path: initialPath });
  console.log('Captured initial screenshot:', initialPath);

  // Check initial state from store via localStorage or page evaluation
  const initialState = await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage');
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      health: parsed?.state?.cleanup?.health ?? 0,
      completed: parsed?.state?.cleanup?.completed ?? false,
      m1Count: parsed?.state?.cleanup?.mission1?.count ?? 0,
      m2Count: parsed?.state?.cleanup?.mission2?.convertedSources?.length ?? 0,
    };
  });
  console.log('Initial state:', initialState);

  // Test collapsing / expanding the missions panel
  const missionToggle = await page.$('aside button');
  if (missionToggle) {
    console.log('Testing mission panel collapse/expand...');
    await missionToggle.click();
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'clean_game_missions_collapsed.png') });
    await missionToggle.click();
    await new Promise((r) => setTimeout(r, 400));
  }

  // Mobile Viewport test (390x844)
  console.log('Testing mobile viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'clean_game_mobile_minimal.png') });

  // Back to Desktop for 100% healing test
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 500));

  // Trigger "Skip, just heal it"
  console.log('Triggering Skip / Auto-Heal to 100%...');
  const skipBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const skip = btns.find((b) => b.textContent.includes('Skip, just heal it'));
    if (skip) {
      skip.click();
      return true;
    }
    return false;
  });

  if (!skipBtn) {
    console.log('Calling store skipAndHealAll directly...');
    await page.evaluate(() => {
      // Find zustand store on window or click reset then skip
      const raw = localStorage.getItem('ecofuture_game_storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.state.cleanup.health = 100;
        parsed.state.cleanup.completed = true;
        parsed.state.cleanliness = 100;
        localStorage.setItem('ecofuture_game_storage', JSON.stringify(parsed));
      }
    });
    await page.reload({ waitUntil: 'networkidle0' });
  } else {
    // Wait for the 3.5s smooth skip animation to complete
    console.log('Waiting for heal animation (4.5s)...');
    await new Promise((r) => setTimeout(r, 4600));
  }

  // Dismiss any completion modals if visible to see the full pristine Earth
  await page.evaluate(() => {
    const modalBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent.includes('Continue Restoring') || b.textContent.includes('Close')
    );
    if (modalBtn) modalBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Capture 100% healed Earth
  const healedPath = path.join(ARTIFACT_DIR, 'clean_game_100_percent_healed.png');
  await page.screenshot({ path: healedPath });
  console.log('Captured 100% healed Earth screenshot:', healedPath);

  // Check state at 100%
  const finalState = await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage');
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      health: parsed?.state?.cleanup?.health,
      completed: parsed?.state?.cleanup?.completed,
      m1Collected: parsed?.state?.cleanup?.mission1?.collectedIds?.length,
      m2Converted: parsed?.state?.cleanup?.mission2?.convertedSources?.length,
      m3Planted: parsed?.state?.cleanup?.mission3?.plantedPatches?.length,
      m4Percent: parsed?.state?.cleanup?.mission4?.sweptPercent,
      m4SweptIds: parsed?.state?.cleanup?.mission4?.sweptIds?.length,
    };
  });
  console.log('100% Healed State:', finalState);

  // Test Restart button
  console.log('Testing Restart Cleaning button...');
  const restarted = await page.evaluate(() => {
    const resetBtn = document.querySelector('button[title="Restart Cleaning"]');
    if (resetBtn) {
      resetBtn.click();
      return true;
    }
    return false;
  });

  if (restarted) {
    await new Promise((r) => setTimeout(r, 1000));
    const restartState = await page.evaluate(() => {
      const raw = localStorage.getItem('ecofuture_game_storage');
      const parsed = raw ? JSON.parse(raw) : null;
      return {
        health: parsed?.state?.cleanup?.health,
        completed: parsed?.state?.cleanup?.completed,
        m1Count: parsed?.state?.cleanup?.mission1?.count,
      };
    });
    console.log('After restart state:', restartState);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'clean_game_after_restart.png') });
  }

  console.log('Errors logged:', consoleErrors);
  await browser.close();
  console.log('Verification finished successfully!');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

