import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function testSolutionsHeroAndNav() {
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

  // Check 1: 1920x1080
  console.log('Testing 1920x1080...');
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5173/solutions', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'solutions_hero_1920.png') });

  // Check 2: 1440x900
  console.log('Testing 1440x900...');
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'solutions_hero_1440.png') });

  // Check 3: 768x1024 (Tablet)
  console.log('Testing 768x1024...');
  await page.setViewport({ width: 768, height: 1024 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'solutions_hero_768.png') });

  // Check 4: 390x844 (Mobile)
  console.log('Testing 390x844...');
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'solutions_hero_390.png') });

  // Verify START CLEANING button removal
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 400));
  const hasStartCleaningBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.some((b) => b.textContent.includes('START CLEANING'));
  });
  console.log('Start Cleaning button in hero (should be false):', hasStartCleaningBtn);

  // Test Nav: Scroll down to Six Pillars / Solutions
  console.log('Testing Solutions nav click...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('header nav button'));
    const solBtn = btns.find((b) => b.textContent.trim() === 'Solutions');
    if (solBtn) solBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const scrollAfterSolutions = await page.evaluate(() => window.scrollY);
  console.log('ScrollY after clicking Solutions:', scrollAfterSolutions);

  // Test Nav: Scroll to Play Games
  console.log('Testing Play Games nav click...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('header nav button'));
    const playBtn = btns.find((b) => b.textContent.trim().includes('Play'));
    if (playBtn) playBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const scrollAfterPlay = await page.evaluate(() => window.scrollY);
  console.log('ScrollY after clicking Play Games:', scrollAfterPlay);

  // Test Nav: Click Home while scrolled down
  console.log('Testing Home nav click while scrolled down...');
  const currentUrlBeforeHome = page.url();
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('header nav button'));
    const homeBtn = btns.find((b) => b.textContent.trim() === 'Home');
    if (homeBtn) homeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  const scrollAfterHome = await page.evaluate(() => window.scrollY);
  const currentUrlAfterHome = page.url();

  console.log('URL before Home click:', currentUrlBeforeHome);
  console.log('URL after Home click:', currentUrlAfterHome);
  console.log('ScrollY after clicking Home (should be 0 or near 0):', scrollAfterHome);

  // Check WebGL context count
  const webglContextCount = await page.evaluate(() => {
    return document.querySelectorAll('canvas').length;
  });
  console.log('Active canvas count on /solutions (should be 1):', webglContextCount);

  console.log('Console errors:', consoleErrors);
  await browser.close();
  console.log('All checks finished successfully!');
}

testSolutionsHeroAndNav().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
