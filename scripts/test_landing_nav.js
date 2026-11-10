import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function testLandingNav() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

  // Scroll to bottom (final beat)
  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 800));

  console.log('Finding Start Cleaning button on final beat...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const startBtn = btns.find((b) => b.textContent.includes('START CLEANING'));
    if (startBtn) startBtn.click();
  });

  // Wait for the 700ms zoom/fade transition
  await new Promise((r) => setTimeout(r, 1200));
  console.log('Current URL after Start Cleaning click:', page.url());

  if (!page.url().includes('/solutions')) {
    throw new Error(`Expected URL to include /solutions, but got: ${page.url()}`);
  }
  console.log('Landing navigation test passed!');
  await browser.close();
}

testLandingNav().catch(console.error);

