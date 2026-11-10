import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function verifyQuizCertificateUI() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Visit Quiz page
  await page.goto('http://localhost:5173/quiz', { waitUntil: 'networkidle2' });

  // 2. Set quiz state with version 3
  await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage');
    const data = raw ? JSON.parse(raw) : { state: {}, version: 3 };
    data.version = 3;
    if (!data.state) data.state = {};
    if (!data.state.quiz) data.state.quiz = {};

    data.state.quiz.completed = true;
    data.state.quiz.score = 8;
    data.state.quiz.health = 80;
    data.state.quiz.healRegions = [
      { lat: 0, lon: 0, radius: 0.2 },
      { lat: 20, lon: -40, radius: 0.2 }
    ];
    localStorage.setItem('ecofuture_game_storage', JSON.stringify(data));
  });

  // Reload to rehydrate
  await page.goto('http://localhost:5173/quiz', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));

  // Type name into input
  const nameInputSelector = '#cert-name-input';
  await page.waitForSelector(nameInputSelector, { timeout: 8000 });
  await page.type(nameInputSelector, 'Elena Rostova', { delay: 40 });

  // Check localStorage value
  const savedName = await page.evaluate(() => localStorage.getItem('terraheal_cert_name'));
  console.log('Saved name in localStorage:', savedName);

  // Take screenshot of results screen with name input and buttons
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'quiz_results_with_certificate_controls.png'),
    fullPage: false,
  });
  console.log('Saved quiz_results_with_certificate_controls.png');

  // Click Download Certificate
  const downloadBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find((b) => b.textContent.includes('Download Certificate'));
  });

  if (downloadBtn) {
    await downloadBtn.click();
    console.log('Clicked Download Certificate');
    await new Promise((r) => setTimeout(r, 1500));

    // Screenshot after click to see toast
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'quiz_results_with_toast.png'),
      fullPage: false,
    });
    console.log('Saved quiz_results_with_toast.png');
  }

  // Test 10/10 case to ensure Retake is hidden and Back to Hub is primary
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('ecofuture_game_storage') || '{}');
    data.version = 3;
    if (data.state && data.state.quiz) {
      data.state.quiz.score = 10;
      data.state.quiz.health = 100;
      localStorage.setItem('ecofuture_game_storage', JSON.stringify(data));
    }
  });
  await page.goto('http://localhost:5173/quiz', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'quiz_results_10_of_10.png'),
    fullPage: false,
  });
  console.log('Saved quiz_results_10_of_10.png');

  await browser.close();
}

verifyQuizCertificateUI().catch(console.error);