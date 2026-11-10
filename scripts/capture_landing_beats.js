import puppeteer from 'puppeteer-core';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Beat 0
  await page.screenshot({ path: `${ARTIFACT_DIR}/final_beat0.png` });

  // Scroll to beat 1
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1, behavior: 'instant' }));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: `${ARTIFACT_DIR}/final_beat1.png` });

  // Scroll to beat 2
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 2, behavior: 'instant' }));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: `${ARTIFACT_DIR}/final_beat2.png` });

  // Scroll to beat 3
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 3, behavior: 'instant' }));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: `${ARTIFACT_DIR}/final_beat3.png` });

  console.log('All 4 beats captured successfully');
  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
