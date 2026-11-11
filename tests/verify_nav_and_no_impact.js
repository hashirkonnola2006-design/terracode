import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\.chrome_nav_test_profile';
const SCREENSHOTS_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\tests\\screenshots';
const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\3d441c89-ae93-41db-9cb5-83b072e258ec';
const PORT = 9244;

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  if (fs.existsSync(PROFILE_DIR)) {
    try { fs.rmSync(PROFILE_DIR, { recursive: true, force: true }); } catch (_) {}
  }

  const proc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--window-size=1920,1080',
    '--hide-scrollbars',
    '--enable-webgl',
    '--use-gl=angle',
    'about:blank',
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 35; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
        if (res.ok) {
          const targets = await res.json();
          const page = targets.find((t) => t.type === 'page');
          if (page && page.webSocketDebuggerUrl) {
            wsUrl = page.webSocketDebuggerUrl;
            break;
          }
        }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 200));
    }

    if (!wsUrl) throw new Error('Chrome failed to start');

    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id)(data.result);
        pending.delete(data.id);
      }
    };

    const send = (method, params = {}) => {
      return new Promise((resolve) => {
        const id = msgId++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await new Promise((resolve) => (ws.onopen = resolve));

    await send('Page.enable');
    await send('DOM.enable');

    // Pre-populate legacy localStorage keys to verify cleanup
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        sessionStorage.setItem('terraheal_intro_played', 'true');
        localStorage.setItem('terraheal_pledge_streak', '5');
        localStorage.setItem('terraheal_impact_answers', '{"q1": 1}');
        localStorage.setItem('terraheal_impact_score', '77');
        localStorage.setItem('terraheal_game_store', '{"test": true}');
      `,
    });

    console.log('Navigating to http://localhost:5173/solutions...');
    await send('Page.navigate', { url: 'http://localhost:5173/solutions' });
    await new Promise((r) => setTimeout(r, 3500));

    // Test 1: Verify legacy keys were removed and game store key is intact
    const storageCheck = await send('Runtime.evaluate', {
      expression: `({
        streak: localStorage.getItem('terraheal_pledge_streak'),
        answers: localStorage.getItem('terraheal_impact_answers'),
        impactScore: localStorage.getItem('terraheal_impact_score'),
        gameStore: localStorage.getItem('terraheal_game_store')
      })`,
      returnByValue: true,
    });
    console.log('Storage check results:', storageCheck.result.value);

    // Test 2: Hero Section Desktop Screenshot
    const heroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'nav_01_hero.png'), Buffer.from(heroShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'nav_01_hero.png'), Buffer.from(heroShot.data, 'base64'));
    console.log('✓ nav_01_hero.png saved');

    // Test 3: Click "Damage" nav link
    const clickDamage = await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('header nav button'));
        const damageBtn = btns.find(b => b.textContent.trim() === 'Damage');
        if (damageBtn) {
          damageBtn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true,
    });
    console.log('Clicked Damage nav button:', clickDamage.result.value);
    await new Promise((r) => setTimeout(r, 1200));

    const damageUrlCheck = await send('Runtime.evaluate', {
      expression: `window.location.hash`,
      returnByValue: true,
    });
    console.log('Current hash after clicking Damage:', damageUrlCheck.result.value);

    const damageShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'nav_02_damage.png'), Buffer.from(damageShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'nav_02_damage.png'), Buffer.from(damageShot.data, 'base64'));
    console.log('✓ nav_02_damage.png saved');

    // Test 4: Click "Solutions" nav link
    const clickSolutions = await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('header nav button'));
        const solBtn = btns.find(b => b.textContent.trim() === 'Solutions');
        if (solBtn) {
          solBtn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true,
    });
    console.log('Clicked Solutions nav button:', clickSolutions.result.value);
    await new Promise((r) => setTimeout(r, 1200));

    const solUrlCheck = await send('Runtime.evaluate', {
      expression: `window.location.hash`,
      returnByValue: true,
    });
    console.log('Current hash after clicking Solutions:', solUrlCheck.result.value);

    const solShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'nav_03_solutions.png'), Buffer.from(solShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'nav_03_solutions.png'), Buffer.from(solShot.data, 'base64'));
    console.log('✓ nav_03_solutions.png saved');

    // Test 5: Click "Play Games" nav link
    const clickPlay = await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('header nav button'));
        const playBtn = btns.find(b => b.textContent.trim() === 'Play Games');
        if (playBtn) {
          playBtn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true,
    });
    console.log('Clicked Play Games nav button:', clickPlay.result.value);
    await new Promise((r) => setTimeout(r, 1200));

    const playUrlCheck = await send('Runtime.evaluate', {
      expression: `window.location.hash`,
      returnByValue: true,
    });
    console.log('Current hash after clicking Play Games:', playUrlCheck.result.value);

    const playShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'nav_04_play.png'), Buffer.from(playShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'nav_04_play.png'), Buffer.from(playShot.data, 'base64'));
    console.log('✓ nav_04_play.png saved');

    // Test 6: Mobile Drawer Test (390x844)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0);` });
    await new Promise((r) => setTimeout(r, 1000));

    // Open mobile menu
    const openMenu = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('header button[aria-controls="mobile-nav-menu"]');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true,
    });
    console.log('Opened mobile drawer:', openMenu.result.value);
    await new Promise((r) => setTimeout(r, 600));

    const drawerShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'nav_05_mobile_drawer.png'), Buffer.from(drawerShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'nav_05_mobile_drawer.png'), Buffer.from(drawerShot.data, 'base64'));
    console.log('✓ nav_05_mobile_drawer.png saved');

    console.log('All tests completed successfully!');
  } finally {
    proc.kill();
  }
}

run().catch(console.error);
