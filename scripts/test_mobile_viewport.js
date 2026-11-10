import puppeteer from 'puppeteer-core';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function testMobile() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl'],
    defaultViewport: { width: 390, height: 844 } // launch directly in mobile
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/quiz', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('On Quiz page in mobile viewport');
  const storeState = await page.evaluate(() => {
    return window.__ECO_STORE__ ? window.__ECO_STORE__.getState().quiz : 'no store';
  });
  console.log('Store state on load:', storeState);

  await page.screenshot({ path: `${ARTIFACT_DIR}/test_mobile_direct.png` });
  await browser.close();
}

testMobile().catch(console.error);
