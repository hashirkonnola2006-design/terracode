import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function testZoom() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/quiz', { waitUntil: 'networkidle2' });

  // Click Start Quiz
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const start = btns.find((b) => (b.textContent || '').toLowerCase().includes('start quiz'));
    if (start) start.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Answer 10 questions with Digit1 + Enter
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Digit1');
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 300));
  }

  // Wait for results screen transition
  await new Promise((r) => setTimeout(r, 1800));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'quiz_results_earth_zoom_verified_1920.png') });
  console.log('Saved quiz_results_earth_zoom_verified_1920.png');

  // Also test 1440x900
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'quiz_results_earth_zoom_verified_1440.png') });
  console.log('Saved quiz_results_earth_zoom_verified_1440.png');

  await browser.close();
  console.log('Verification completed successfully!');
}

testZoom().catch((err) => {
  console.error(err);
  process.exit(1);
});
