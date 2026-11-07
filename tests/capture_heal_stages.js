import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\.chrome_heal_profile';
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
    await new Promise(r => { ws.onopen = r; });

    let id = 0;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const curId = ++id;
      const handler = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === curId) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: 1920,
      screenHeight: 1080,
    });

    console.log('Navigating to http://localhost:5173/?debug=1 ...');
    await send('Page.navigate', { url: 'http://localhost:5173/?debug=1' });

    console.log('Waiting 5s for full texture caching & shader compilation...');
    await new Promise(r => setTimeout(r, 5000));

    const stages = [0.0, 0.25, 0.50, 0.75, 1.0];

    for (const val of stages) {
      console.log(`Setting heal progress to ${val} ...`);
      await send('Runtime.evaluate', {
        expression: `if (window.__setHeal) window.__setHeal(${val});`,
      });

      // Allow 800ms for Three.js render loop to draw multiple frames
      await new Promise(r => setTimeout(r, 800));

      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');

      const filename = `heal_${val.toFixed(2)}.png`;
      const outPath1 = path.join(SCREENSHOTS_DIR, filename);
      fs.writeFileSync(outPath1, buffer);

      const outPath2 = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(outPath2, buffer);

      console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
    }

    console.log('All heal stages captured successfully!');
    ws.close();
  } finally {
    proc.kill();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
