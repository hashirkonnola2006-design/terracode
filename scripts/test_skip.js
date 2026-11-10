import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function testSkip() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/clean', { waitUntil: 'networkidle2' });

  // Dismiss tutorial in store
  await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage') || '{}';
    const state = JSON.parse(raw);
    state.state = state.state || {};
    state.state.tutorialDismissed = true;
    state.state.cleanliness = 0;
    localStorage.setItem('ecofuture_game_storage', JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));

  console.log('Clicking "Skip, just heal it" button...');
  const skipBtn = await page.$('button[title="Skip game and heal Earth automatically"]');
  if (!skipBtn) {
    throw new Error('Skip button not found!');
  }
  await skipBtn.click();

  // Monitor cleanliness over time
  for (let i = 1; i <= 8; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const val = await page.evaluate(() => {
      const el = document.querySelector('span.font-mono.tabular-nums');
      return el ? el.textContent : null;
    });
    console.log(`t = ${i * 0.5}s: Cleanliness = ${val}`);
  }

  await browser.close();
}

testSkip().catch(console.error);

