import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function testRestart() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/clean', { waitUntil: 'networkidle2' });

  // Start with 100%
  await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage') || '{}';
    const state = JSON.parse(raw);
    state.state = state.state || {};
    state.state.tutorialDismissed = true;
    state.state.cleanliness = 100;
    state.state.finished = true;
    localStorage.setItem('ecofuture_game_storage', JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));

  console.log('Finding Restart / Play Again button...');
  // Click top bar Restart button (which is z-50) or EndingScreen Play Again
  const restartBtn = await page.$('button[title="Restart Cleaning"]');
  if (restartBtn) {
    await restartBtn.click();
    console.log('Restart button clicked!');
  } else {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((el) => el.textContent.includes('Play Again'));
      if (b) b.click();
    });
  }

  await new Promise((r) => setTimeout(r, 1000));
  const val = await page.evaluate(() => {
    const el = document.querySelector('span.font-mono.tabular-nums');
    return el ? el.textContent : null;
  });
  console.log('Cleanliness after restart:', val);

  const storedClean = await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage') || '{}';
    return JSON.parse(raw).state.cleanliness;
  });
  console.log('Stored Cleanliness in localStorage after restart:', storedClean);

  await browser.close();
}

testRestart().catch(console.error);

