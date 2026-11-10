import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function verifyHubAndQuiz() {
  console.log('Launching browser to verify Hub, Quiz, and independent Earth states...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
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

  // 1. Visit /solutions directly
  console.log('Navigating to http://localhost:5173/solutions...');
  await page.goto('http://localhost:5173/solutions', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));

  console.log('Capturing Hub Page Hero and 6 Solutions cards...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hub_page_solutions.png') });

  // Scroll to #play section
  console.log('Scrolling to #play games section...');
  await page.evaluate(() => {
    const el = document.getElementById('play');
    if (el) el.scrollIntoView();
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hub_page_play_cards.png') });

  // 2. Click "Play" on Cleanup Mission -> /clean
  console.log('Navigating to Cleanup Mission (/clean)...');
  await page.click('button.btn-aerospace-primary');
  await new Promise((r) => setTimeout(r, 1200));
  console.log('Current URL after click:', page.url());

  // Dismiss tutorial if open so it does not block anything
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const dismissBtn = btns.find((b) => b.title === 'Skip tutorial' || b.textContent.includes('Got It'));
    if (dismissBtn) dismissBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Check "Back to hub" button exists on /clean
  const hubBtnOnClean = await page.$('button[title="Return to Solutions Hub"]');
  console.log('Back to Hub button exists on /clean:', !!hubBtnOnClean);

  // Auto-heal cleanup to 50% via store update to test state isolation
  console.log('Setting Cleanup game health to 50%...');
  await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage') || '{}';
    const state = JSON.parse(raw);
    state.state = state.state || {};
    state.state.cleanup = state.state.cleanup || {};
    state.state.cleanup.health = 50;
    state.state.tutorialDismissed = true;
    localStorage.setItem('ecofuture_game_storage', JSON.stringify(state));
  });

  // Click "Back to Hub"
  console.log('Clicking "Back to Hub" button...');
  await page.evaluate(() => {
    const hubBtn = document.querySelector('button[title="Return to Solutions Hub"]');
    if (hubBtn) hubBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  console.log('Current URL after returning to hub:', page.url());

  // Verify Hub Earth is still 0% and Cleanup card shows 50%
  const cardHealths = await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage') || '{}';
    const s = JSON.parse(raw).state || {};
    return {
      cleanupHealth: s.cleanup ? s.cleanup.health : 0,
      quizHealth: s.quiz ? s.quiz.health : 0,
    };
  });
  console.log('State in Hub:', cardHealths);

  // 3. Play Quiz Game -> /quiz
  console.log('Navigating to Zero-Waste Quiz (/quiz)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const quizBtn = btns.find((b) => b.textContent.includes('Play Quiz') || b.textContent.includes('Retake Quiz'));
    if (quizBtn) quizBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  console.log('Current URL in quiz:', page.url());

  console.log('Capturing Quiz Intro screen...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'quiz_screen_intro.png') });

  // Click Start Quiz
  const startQuizBtn = await page.$('button.btn-aerospace-primary');
  if (startQuizBtn) await startQuizBtn.click();
  await new Promise((r) => setTimeout(r, 800));

  console.log('Capturing Question 1 screen...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'quiz_screen_q1.png') });

  // Answer question 1 by clicking the correct option ("Reduce")
  console.log('Answering question 1...');
  await page.evaluate(() => {
    const optionBtns = Array.from(document.querySelectorAll('button')).filter((b) =>
      ['Reduce', 'Glass', 'Nutrient-rich soil', 'They tangle and jam sorting machines'].some((k) =>
        b.textContent.includes(k)
      )
    );
    if (optionBtns.length > 0) {
      optionBtns[0].click();
    } else {
      // Fallback: click first option button
      const allBtns = Array.from(document.querySelectorAll('button'));
      const opt = allBtns.find((b) => b.className.includes('border text-left'));
      if (opt) opt.click();
    }
  });
  await new Promise((r) => setTimeout(r, 600));

  console.log('Capturing Answered Question 1 (Explanation card visible)...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'quiz_q1_correct_explanation.png') });

  // Advance through remaining questions
  console.log('Advancing through remaining questions...');
  for (let q = 2; q <= 10; q++) {
    // Click Next Question
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find((b) => b.textContent.includes('Next Question') || b.textContent.includes('View Results'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // Answer current question
    await page.evaluate(() => {
      const allBtns = Array.from(document.querySelectorAll('button'));
      const opt = allBtns.find((b) => b.className.includes('border text-left') && !b.disabled);
      if (opt) opt.click();
    });
    await new Promise((r) => setTimeout(r, 500));
  }

  // Click View Results
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const resBtn = btns.find((b) => b.textContent.includes('View Results'));
    if (resBtn) resBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  console.log('Capturing Quiz Results screen...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'quiz_screen_results.png') });

  // Verify Quiz Earth Health vs Cleanup Health
  const finalState = await page.evaluate(() => {
    const raw = localStorage.getItem('ecofuture_game_storage') || '{}';
    const s = JSON.parse(raw).state || {};
    return {
      cleanupHealth: s.cleanup ? s.cleanup.health : 0,
      quizHealth: s.quiz ? s.quiz.health : 0,
      quizScore: s.quiz ? s.quiz.score : 0,
      quizBestScore: s.quiz ? s.quiz.bestScore : 0,
      quizCompleted: s.quiz ? s.quiz.completed : false,
    };
  });
  console.log('Final State Comparison (Independent verification):', finalState);

  // 4. Test Game 3 Placeholder (/game-3)
  console.log('Navigating to Game 3 Placeholder (/game-3)...');
  await page.goto('http://localhost:5173/game-3', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  console.log('Capturing Game 3 Placeholder screen...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'game_3_placeholder.png') });

  // 5. Test "Back to Hub" from Game 3
  console.log('Clicking "Back to Hub" from Game 3...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const hub = btns.find((b) => b.textContent.includes('Back to Hub') || b.textContent.includes('Return to Solutions Hub'));
    if (hub) hub.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  console.log('Current URL after Game 3 Return to Hub:', page.url());

  console.log('Total console errors recorded:', consoleErrors.length);
  await browser.close();
  console.log('All Hub and Quiz verification checks complete!');
}

verifyHubAndQuiz().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
