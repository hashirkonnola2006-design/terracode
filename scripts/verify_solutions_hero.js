import puppeteer from 'puppeteer-core';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function verifySolutionsHero() {
  console.log('--- STARTING SOLUTIONS HERO VISUAL VERIFICATION ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('Console error:', msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.toString());
    console.error('Page error:', err);
  });

  // Navigate to /solutions
  await page.goto('http://localhost:5173/solutions', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2200));

  // 1. Capture 1920x1080 Hero screenshot
  console.log('Capturing 1920x1080 screenshot...');
  await page.screenshot({ path: `${ARTIFACT_DIR}/solutions_hero_1920x1080.png` });

  // 2. Capture 1440x900 Hero screenshot
  console.log('Capturing 1440x900 screenshot...');
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${ARTIFACT_DIR}/solutions_hero_1440x900.png` });

  // 3. Capture 768x1024 Tablet Hero screenshot
  console.log('Capturing 768x1024 screenshot...');
  await page.setViewport({ width: 768, height: 1024 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${ARTIFACT_DIR}/solutions_hero_768x1024.png` });

  // 4. Capture 390x844 Mobile Hero screenshot
  console.log('Capturing 390x844 screenshot...');
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${ARTIFACT_DIR}/solutions_hero_390x844.png` });

  // 5. Test Scroll to Pillars
  console.log('Testing scroll to pillars...');
  await page.setViewport({ width: 1920, height: 1080 });
  await new Promise((r) => setTimeout(r, 400));
  const scrolled = await page.evaluate(() => {
    const scrollBtn = document.querySelector('[aria-label="Scroll to Six Pillars"]');
    if (scrollBtn) {
      scrollBtn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked scroll button:', scrolled);
  await new Promise((r) => setTimeout(r, 1200));
  const scrollPos = await page.evaluate(() => window.scrollY);
  console.log('Window scrollY after click:', scrollPos);
  await page.screenshot({ path: `${ARTIFACT_DIR}/solutions_after_scroll_to_pillars.png` });

  // 6. Test Navigation to /clean from Start Cleaning button
  console.log('Testing START CLEANING button click...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 500));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const startBtn = btns.find((b) => (b.textContent || '').includes('START CLEANING'));
    if (startBtn) startBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  const currentUrl = page.url();
  console.log('Current URL after clicking START CLEANING:', currentUrl);

  // 7. Verify WebGL context cleanup
  const webglState = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    return { canvasCount: canvases.length };
  });
  console.log('Canvases on /clean:', webglState);

  console.log(`\nTotal console errors recorded: ${consoleErrors.length}`);
  consoleErrors.forEach((e) => console.error('Logged Error:', e));

  await browser.close();
  console.log('--- SOLUTIONS HERO VERIFICATION COMPLETE ---');
}

verifySolutionsHero().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
