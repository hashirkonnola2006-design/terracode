import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\.chrome_sections_profile';
const SCREENSHOTS_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\tests\\screenshots';
const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\3d441c89-ae93-41db-9cb5-83b072e258ec';
const PORT = 9228;

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function main() {
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
    for (let i = 0; i < 30; i++) {
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

    console.log('Navigating to http://localhost:5173/solutions...');
    await send('Page.navigate', { url: 'http://localhost:5173/solutions' });
    await new Promise((r) => setTimeout(r, 2500));

    // Capture Hero
    const heroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, '01_hero.png'), Buffer.from(heroShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, '01_hero.png'), Buffer.from(heroShot.data, 'base64'));
    console.log('Captured 01_hero.png');

    // Scroll to #damage
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('damage')?.scrollIntoView({ behavior: 'instant' });
      `
    });
    await new Promise((r) => setTimeout(r, 1200));
    const damageShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, '02_damage.png'), Buffer.from(damageShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, '02_damage.png'), Buffer.from(damageShot.data, 'base64'));
    console.log('Captured 02_damage.png');

    // Scroll to #solutions (Six Pillars)
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('solutions')?.scrollIntoView({ behavior: 'instant' });
      `
    });
    await new Promise((r) => setTimeout(r, 1200));
    const pillarsShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, '03_pillars.png'), Buffer.from(pillarsShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, '03_pillars.png'), Buffer.from(pillarsShot.data, 'base64'));
    console.log('Captured 03_pillars.png');

    // Scroll down slightly inside pillars to see healed rows
    await send('Runtime.evaluate', {
      expression: `
        window.scrollBy(0, 500);
      `
    });
    await new Promise((r) => setTimeout(r, 1000));
    const pillarsMidShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, '03_pillars_mid.png'), Buffer.from(pillarsMidShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, '03_pillars_mid.png'), Buffer.from(pillarsMidShot.data, 'base64'));
    console.log('Captured 03_pillars_mid.png');

    // Scroll to #impact (Your Impact)
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('impact')?.scrollIntoView({ behavior: 'instant' });
      `
    });
    await new Promise((r) => setTimeout(r, 1200));
    const impactShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, '04_impact.png'), Buffer.from(impactShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, '04_impact.png'), Buffer.from(impactShot.data, 'base64'));
    console.log('Captured 04_impact.png');

    // Scroll to #play (Play Games)
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('play')?.scrollIntoView({ behavior: 'instant' });
      `
    });
    await new Promise((r) => setTimeout(r, 1200));
    const playShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, '05_play.png'), Buffer.from(playShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, '05_play.png'), Buffer.from(playShot.data, 'base64'));
    console.log('Captured 05_play.png');

    ws.close();
    console.log('All screenshots captured successfully.');
  } finally {
    proc.kill();
    try { fs.rmSync(PROFILE_DIR, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

