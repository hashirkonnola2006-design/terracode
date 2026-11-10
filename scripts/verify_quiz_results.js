import puppeteer from 'puppeteer-core';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity/brain/3d441c89-ae93-41db-9cb5-83b072e258ec';
const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function verifyQuizResults() {
  console.log('--- STARTING ZERO-WASTE QUIZ RESULTS SCREEN VERIFICATION ---');

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

  // Navigate to /quiz
  await page.goto('http://localhost:5173/quiz', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));

  // Helper to answer 10 questions with desired number of correct answers
  async function playQuiz(correctCount) {
    // Click Start Quiz if on intro
    const clickedStart = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const start = btns.find((b) => (b.textContent || '').toLowerCase().includes('start quiz'));
      if (start) {
        start.click();
        return true;
      }
      return false;
    });
    if (clickedStart) {
      await new Promise((r) => setTimeout(r, 600));
    }

    for (let i = 0; i < 10; i++) {
      const qInfo = await page.evaluate(() => {
        const store = window.__ECO_STORE__ ? window.__ECO_STORE__.getState() : null;
        if (!store) return null;
        const curQ = store.quiz.shuffledQuestions[store.quiz.currentQuestion];
        return {
          id: curQ.id,
          correct: curQ.correct,
          options: curQ.options,
        };
      });

      const shouldBeCorrect = i < correctCount;
      const targetOption = qInfo
        ? (shouldBeCorrect ? qInfo.correct : qInfo.options.find((o) => o !== qInfo.correct))
        : null;

      // Click option button
      await page.evaluate((targetText, shouldCorrect) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const optBtns = btns.filter((b) => b.className.includes('border text-left'));
        if (targetText) {
          const matched = optBtns.find((b) => (b.textContent || '').includes(targetText));
          if (matched) {
            matched.click();
            return;
          }
        }
        if (shouldCorrect && optBtns[0]) optBtns[0].click();
        else if (optBtns[1]) optBtns[1].click();
      }, targetOption, shouldBeCorrect);

      await new Promise((r) => setTimeout(r, 250));

      // Click "Next Question" or "View Results"
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const next = btns.find((b) => {
          const text = (b.textContent || '').toLowerCase();
          return text.includes('next question') || text.includes('view results');
        });
        if (next) next.click();
      });

      await new Promise((r) => setTimeout(r, 300));
    }

    // Wait for camera pullback & recap animation on results screen
    await new Promise((r) => setTimeout(r, 2600));
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 1: LOW SCORE (3/10) — Health 30%
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 1. Testing Low Score (3/10) ---');
  await playQuiz(3);

  const lowData = await page.evaluate(() => {
    const textContent = document.body.innerText;
    const btns = Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim());
    const store = window.__ECO_STORE__.getState();
    return {
      scoreMatched: textContent.includes('3 / 10'),
      healthMatched: textContent.includes('30%'),
      hasPlayCleanup: btns.some((b) => b.toLowerCase().includes('cleanup')),
      hasRetake: btns.some((b) => b.toLowerCase().includes('retake quiz')),
      hasBackToHub: btns.some((b) => b.toLowerCase().includes('back to hub')),
      hasShareScore: btns.some((b) => b.toLowerCase().includes('share score')),
      bodyText: textContent,
      quizHealth: store.quiz.health,
      quizScore: store.quiz.score,
      cleanupHealth: store.cleanup.health,
    };
  });

  console.log('Low score state:', {
    scoreMatched: lowData.scoreMatched,
    healthMatched: lowData.healthMatched,
    quizScore: lowData.quizScore,
    quizHealth: lowData.quizHealth,
    hasPlayCleanup: lowData.hasPlayCleanup,
    hasRetake: lowData.hasRetake,
    hasBackToHub: lowData.hasBackToHub,
    hasShareScore: lowData.hasShareScore,
    cleanupHealth: lowData.cleanupHealth,
  });

  const lowQuotePresent = [
    'The Earth is in trouble',
    'Every effort matters',
    'The planet needs stronger action',
  ].some((q) => lowData.bodyText.includes(q));
  console.log('Low tier quote present:', lowQuotePresent);

  const lowDeficitPresent = lowData.bodyText.includes('70% more to fully heal the Earth');
  console.log('Deficit line (70% more):', lowDeficitPresent);

  await page.screenshot({ path: `${ARTIFACT_DIR}/quiz_results_low_score_desktop.png` });

  // Mobile screenshot for low score
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${ARTIFACT_DIR}/quiz_results_low_score_mobile.png` });
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 600));

  // ══════════════════════════════════════════════════════════════
  // TEST 2: HIGH SCORE (8/10) — Health 80%
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 2. Testing High Score (8/10) ---');
  // Click Retake Quiz
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const retake = btns.find((b) => (b.textContent || '').toLowerCase().includes('retake quiz'));
    if (retake) retake.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await playQuiz(8);

  const highData = await page.evaluate(() => {
    const textContent = document.body.innerText;
    const btns = Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim());
    const store = window.__ECO_STORE__.getState();
    return {
      scoreMatched: textContent.includes('8 / 10'),
      healthMatched: textContent.includes('80%'),
      hasPlayCleanup: btns.some((b) => b.toLowerCase().includes('cleanup')),
      hasRetake: btns.some((b) => b.toLowerCase().includes('retake quiz')),
      hasBackToHub: btns.some((b) => b.toLowerCase().includes('back to hub')),
      hasShareScore: btns.some((b) => b.toLowerCase().includes('share score')),
      bodyText: textContent,
      quizHealth: store.quiz.health,
      quizScore: store.quiz.score,
      cleanupHealth: store.cleanup.health,
    };
  });

  console.log('High score state:', {
    scoreMatched: highData.scoreMatched,
    healthMatched: highData.healthMatched,
    quizScore: highData.quizScore,
    quizHealth: highData.quizHealth,
    hasPlayCleanup: highData.hasPlayCleanup,
    hasRetake: highData.hasRetake,
    hasBackToHub: highData.hasBackToHub,
    hasShareScore: highData.hasShareScore,
    cleanupHealth: highData.cleanupHealth,
  });

  const goodQuotePresent = [
    'Well done. The planet is breathing easier',
    'Almost there. You are a true guardian',
    'Great work. A few more answers',
  ].some((q) => highData.bodyText.includes(q));
  console.log('Good tier quote present:', goodQuotePresent);

  const highDeficitPresent = highData.bodyText.includes('20% more to fully heal the Earth');
  console.log('Deficit line (20% more):', highDeficitPresent);

  await page.screenshot({ path: `${ARTIFACT_DIR}/quiz_results_high_score_desktop.png` });

  // Mobile screenshot for high score
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${ARTIFACT_DIR}/quiz_results_high_score_mobile.png` });
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 600));

  // ══════════════════════════════════════════════════════════════
  // TEST 3: PERFECT SCORE (10/10) — Health 100%
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 3. Testing Perfect Score (10/10) ---');
  // Click Retake Quiz
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const retake = btns.find((b) => (b.textContent || '').toLowerCase().includes('retake quiz'));
    if (retake) retake.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await playQuiz(10);

  const perfectData = await page.evaluate(() => {
    const textContent = document.body.innerText;
    const btns = Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim());
    const store = window.__ECO_STORE__.getState();
    return {
      scoreMatched: textContent.includes('10 / 10'),
      healthMatched: textContent.includes('100%'),
      hasPlayCleanup: btns.some((b) => b.toLowerCase().includes('cleanup')),
      hasRetake: btns.some((b) => b.toLowerCase().includes('retake quiz')),
      hasBackToHub: btns.some((b) => b.toLowerCase().includes('back to hub')),
      hasShareScore: btns.some((b) => b.toLowerCase().includes('share score')),
      bodyText: textContent,
      quizHealth: store.quiz.health,
      quizScore: store.quiz.score,
      cleanupHealth: store.cleanup.health,
    };
  });

  console.log('Perfect score state:', {
    scoreMatched: perfectData.scoreMatched,
    healthMatched: perfectData.healthMatched,
    quizScore: perfectData.quizScore,
    quizHealth: perfectData.quizHealth,
    hasPlayCleanup: perfectData.hasPlayCleanup,
    hasRetake: perfectData.hasRetake, // MUST BE FALSE on 10/10!
    hasBackToHub: perfectData.hasBackToHub,
    hasShareScore: perfectData.hasShareScore,
    cleanupHealth: perfectData.cleanupHealth,
  });

  const perfectQuotePresent = perfectData.bodyText.includes('A perfect score. The Earth is fully healed, and you did it.');
  console.log('Perfect tier quote present:', perfectQuotePresent);

  await page.screenshot({ path: `${ARTIFACT_DIR}/quiz_results_perfect_desktop.png` });

  // Mobile screenshot for perfect score
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${ARTIFACT_DIR}/quiz_results_perfect_mobile.png` });
  await page.setViewport({ width: 1440, height: 900 });

  // ══════════════════════════════════════════════════════════════
  // TEST 4: DRAGGING EARTH ON RESULTS SCREEN
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 4. Testing Earth Drag Rotation ---');
  const canvasBox = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: rect.x + rect.width * 0.75, y: rect.y + rect.height * 0.5 };
  });

  if (canvasBox) {
    await page.mouse.move(canvasBox.x, canvasBox.y);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x - 140, canvasBox.y + 40, { steps: 10 });
    await page.mouse.up();
    console.log('Mouse drag performed on Earth canvas successfully.');
  }

  // ══════════════════════════════════════════════════════════════
  // TEST 5: CLEANUP GAME IS UNAFFECTED
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 5. Verifying Cleanup Game Independence ---');
  // Click Back to Hub
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const hubBtn = btns.find((b) => (b.textContent || '').toLowerCase().includes('back to hub'));
    if (hubBtn) hubBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Navigate to /clean
  await page.goto('http://localhost:5173/clean', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  const cleanState = await page.evaluate(() => {
    const s = window.__ECO_STORE__.getState();
    return {
      cleanupHealth: s.cleanup.health,
      quizHealth: s.quiz.health,
      quizBestScore: s.quiz.bestScore,
    };
  });
  console.log('Verified Cleanup Game state:', cleanState);

  console.log(`\nTotal console errors recorded: ${consoleErrors.length}`);
  consoleErrors.forEach((e) => console.error('Logged Error:', e));

  await browser.close();
  console.log('--- VERIFICATION COMPLETE ---');
}

verifyQuizResults().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
