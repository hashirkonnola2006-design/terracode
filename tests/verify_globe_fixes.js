import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\.chrome_fixes_profile';
const SCREENSHOTS_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\tests\\screenshots';
const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\3d441c89-ae93-41db-9cb5-83b072e258ec';
const PORT = 9238;

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
          const page = targets.find(t => t.type === 'page');
          if (page && page.webSocketDebuggerUrl) {
            wsUrl = page.webSocketDebuggerUrl;
            break;
          }
        }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 200));
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

    await new Promise((resolve) => ws.onopen = resolve);

    await send('Page.enable');
    await send('DOM.enable');

    // Bypass intro loader via Page script before navigation
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        sessionStorage.setItem('terraheal_intro_played', 'true');
      `
    });

    console.log('Navigating to http://localhost:5173/solutions...');
    await send('Page.navigate', { url: 'http://localhost:5173/solutions' });
    await new Promise((r) => setTimeout(r, 3500));

    // 1. Hero Desktop
    const heroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'fix_01_hero.png'), Buffer.from(heroShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'fix_01_hero.png'), Buffer.from(heroShot.data, 'base64'));
    console.log('✓ fix_01_hero.png captured');

    // 2. The Damage Desktop
    await send('Runtime.evaluate', {
      expression: `document.getElementById('damage')?.scrollIntoView({ behavior: 'instant' });`
    });
    await new Promise((r) => setTimeout(r, 1500));
    const damageShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'fix_02_damage.png'), Buffer.from(damageShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'fix_02_damage.png'), Buffer.from(damageShot.data, 'base64'));
    console.log('✓ fix_02_damage.png captured');

    // 3. Six Pillars Desktop
    await send('Runtime.evaluate', {
      expression: `document.getElementById('solutions')?.scrollIntoView({ behavior: 'instant' });`
    });
    await new Promise((r) => setTimeout(r, 1500));
    const pillarsShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'fix_03_pillars.png'), Buffer.from(pillarsShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'fix_03_pillars.png'), Buffer.from(pillarsShot.data, 'base64'));
    console.log('✓ fix_03_pillars.png captured');

    // 4. Your Impact Desktop
    await send('Runtime.evaluate', {
      expression: `document.getElementById('impact')?.scrollIntoView({ behavior: 'instant' });`
    });
    await new Promise((r) => setTimeout(r, 1500));
    const impactShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'fix_04_impact.png'), Buffer.from(impactShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'fix_04_impact.png'), Buffer.from(impactShot.data, 'base64'));
    console.log('✓ fix_04_impact.png captured');

    // 5. Play Games Desktop
    await send('Runtime.evaluate', {
      expression: `document.getElementById('play')?.scrollIntoView({ behavior: 'instant' });`
    });
    await new Promise((r) => setTimeout(r, 1500));
    const playShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'fix_05_play.png'), Buffer.from(playShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'fix_05_play.png'), Buffer.from(playShot.data, 'base64'));
    console.log('✓ fix_05_play.png captured');

    // 6. Mobile Emulation (390x844)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, 0);`
    });
    await new Promise((r) => setTimeout(r, 1500));
    const mobileHeroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'fix_mobile_hero.png'), Buffer.from(mobileHeroShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'fix_mobile_hero.png'), Buffer.from(mobileHeroShot.data, 'base64'));
    console.log('✓ fix_mobile_hero.png captured');

    // Mobile Pillars
    await send('Runtime.evaluate', {
      expression: `document.getElementById('solutions')?.scrollIntoView({ behavior: 'instant' });`
    });
    await new Promise((r) => setTimeout(r, 1500));
    const mobilePillarsShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'fix_mobile_pillars.png'), Buffer.from(mobilePillarsShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'fix_mobile_pillars.png'), Buffer.from(mobilePillarsShot.data, 'base64'));
    console.log('✓ fix_mobile_pillars.png captured');

    console.log('All screenshots captured successfully!');
  } finally {
    proc.kill();
  }
}

run().catch(console.error);
