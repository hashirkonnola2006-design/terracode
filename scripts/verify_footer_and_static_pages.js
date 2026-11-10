import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function verifyAll() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 1. Verify Footer on Hub (/solutions) at 1920, 1440, 768, 390, 360 px
  const viewports = [
    { w: 1920, h: 1080, name: 'hub_footer_1920' },
    { w: 1440, h: 900, name: 'hub_footer_1440' },
    { w: 768, h: 1024, name: 'hub_footer_768' },
    { w: 390, h: 844, name: 'hub_footer_390' },
    { w: 360, h: 740, name: 'hub_footer_360' },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.w, height: vp.h });
    await page.goto('http://localhost:5173/solutions', { waitUntil: 'networkidle2' });
    // Scroll to footer
    await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (footer) footer.scrollIntoView();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Check horizontal scroll
    const hasHScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`[${vp.name}] Horizontal scroll detected:`, hasHScroll);

    const footerHandle = await page.$('footer');
    if (footerHandle) {
      await footerHandle.screenshot({
        path: path.join(ARTIFACT_DIR, `${vp.name}.png`),
      });
      console.log(`Saved ${vp.name}.png`);
    }
  }

  // 2. Open all 4 static pages at 1440 and 390 px
  const staticRoutes = [
    { path: '/terms', name: 'terms', expectedTitle: 'Terms | TerraHeal' },
    { path: '/privacy', name: 'privacy', expectedTitle: 'Privacy | TerraHeal' },
    { path: '/sources', name: 'sources', expectedTitle: 'Sources | TerraHeal' },
    { path: '/credits', name: 'credits', expectedTitle: 'Credits | TerraHeal' },
  ];

  for (const route of staticRoutes) {
    // Test Desktop 1440
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 400));

    // Check title
    const title = await page.title();
    console.log(`[${route.name}] Title:`, title, '(Expected:', route.expectedTitle, ')');

    // Confirm NO canvas / WebGL on page
    const canvasCount = await page.evaluate(() => document.querySelectorAll('canvas').length);
    console.log(`[${route.name}] WebGL Canvas Count (must be 0):`, canvasCount);

    // Screenshot desktop full page
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `page_${route.name}_1440.png`),
      fullPage: true,
    });
    console.log(`Saved page_${route.name}_1440.png`);

    // Test Mobile 390
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 400));

    // Check horizontal scroll
    const mobileHScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`[${route.name}-mobile] Horizontal scroll:`, mobileHScroll);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `page_${route.name}_390.png`),
      fullPage: false,
    });
    console.log(`Saved page_${route.name}_390.png`);
  }

  // 3. Test Back Link Navigation on Static Page
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/solutions', { waitUntil: 'networkidle2' });
  await page.click('footer a[href="/terms"]');
  await new Promise((r) => setTimeout(r, 400));
  console.log('Navigated to /terms via footer link. Current URL:', page.url());

  // Click Back button
  const backBtn = await page.$('header button[aria-label="Go back to previous page"]');
  if (backBtn) {
    await backBtn.click();
    await new Promise((r) => setTimeout(r, 400));
    console.log('Clicked Back. Current URL:', page.url());
  }

  // 4. Test Reset All Progress button & modal
  await page.goto('http://localhost:5173/solutions', { waitUntil: 'networkidle2' });
  // Set fake scores
  await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage') || '{}';
    const cur = JSON.parse(raw);
    if (!cur.state) cur.state = {};
    if (!cur.state.quiz) cur.state.quiz = {};
    cur.state.quiz.score = 9;
    cur.state.quiz.health = 90;
    localStorage.setItem('ecofuture_game_storage', JSON.stringify(cur));
  });

  // Scroll to footer and click RESET ALL PROGRESS
  await page.evaluate(() => {
    const footer = document.querySelector('footer');
    if (footer) footer.scrollIntoView();
  });
  await new Promise((r) => setTimeout(r, 400));

  const resetBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('footer button'));
    return btns.find((b) => b.textContent.includes('RESET ALL PROGRESS'));
  });

  if (resetBtn) {
    await resetBtn.click();
    console.log('Clicked RESET ALL PROGRESS');
    await new Promise((r) => setTimeout(r, 400));

    // Screenshot modal
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'reset_confirm_modal.png'),
      fullPage: false,
    });
    console.log('Saved reset_confirm_modal.png');

    // Confirm reset
    const confirmBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent.trim() === 'Reset All');
    });
    if (confirmBtn) {
      await confirmBtn.click();
      console.log('Clicked Reset All confirm button');
      await new Promise((r) => setTimeout(r, 400));

      const afterState = await page.evaluate(() => {
        const raw = localStorage.getItem('ecofuture_game_storage') || '{}';
        return JSON.parse(raw);
      });
      console.log('After reset, quiz score is:', afterState?.state?.quiz?.score, '(Expected: 0)');
    }
  }

  // 5. Test Keyboard Tab Focus Rings on Footer Links
  await page.goto('http://localhost:5173/terms', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const footer = document.querySelector('footer');
    if (footer) footer.scrollIntoView();
  });
  // Press Tab a few times
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
  }
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'footer_keyboard_focus.png'),
    fullPage: false,
  });
  console.log('Saved footer_keyboard_focus.png');

  console.log('Console Errors captured during run:', consoleErrors);
  await browser.close();
}

verifyAll().catch(console.error);

