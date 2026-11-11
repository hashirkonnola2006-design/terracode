import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\.chrome_can_profile';
const SCREENSHOTS_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\tests\\screenshots';
const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\3d441c89-ae93-41db-9cb5-83b072e258ec';
const PORT = 9229;

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

    // Bypass intro loader on fresh test profile
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        try {
          sessionStorage.setItem('terraheal_intro_played', 'true');
        } catch (_) {}
      `
    });

    console.log('Navigating to http://localhost:5173/solutions...');
    await send('Page.navigate', { url: 'http://localhost:5173/solutions' });
    // Wait for 3D textures, shaders & debris to settle
    await new Promise((r) => setTimeout(r, 3000));

    // 1. Capture Full Hero View
    const heroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'hero_dirty_earth_coke.png'), Buffer.from(heroShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'hero_dirty_earth_coke.png'), Buffer.from(heroShot.data, 'base64'));
    console.log('Captured hero_dirty_earth_coke.png');

    // 2. Zoom in / crop specifically on the Coca-Cola can
    // Clip: x ~ 1400, y ~ 450, w ~ 450, h ~ 450
    const canCrop = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 1350, y: 450, width: 500, height: 450, scale: 1 }
    });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'coke_can_detail.png'), Buffer.from(canCrop.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'coke_can_detail.png'), Buffer.from(canCrop.data, 'base64'));
    console.log('Captured coke_can_detail.png');

    // 3. Zoom in on Earth
    const earthCrop = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 450, y: 350, width: 1050, height: 700, scale: 1 }
    });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'dirty_earth_detail.png'), Buffer.from(earthCrop.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'dirty_earth_detail.png'), Buffer.from(earthCrop.data, 'base64'));
    console.log('Captured dirty_earth_detail.png');

    ws.close();
    console.log('Done!');
  } finally {
    proc.kill();
    try { fs.rmSync(PROFILE_DIR, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
