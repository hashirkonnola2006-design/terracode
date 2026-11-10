import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\.chrome_polluted_profile';
const SCREENSHOTS_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\tests\\screenshots';
const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\3d441c89-ae93-41db-9cb5-83b072e258ec';
const PORT = 9248;

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
    await new Promise((r) => { ws.onopen = r; });

    let id = 0;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
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
    await send('Log.enable');

    const errors = [];
    ws.addEventListener('message', (msg) => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        if (data.params.type === 'error') {
          errors.push(data.params.args.map((a) => a.value || a.description).join(' '));
        }
      }
    });

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: 1920,
      screenHeight: 1080,
    });

    console.log('Navigating to http://localhost:5173/ ...');
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise((r) => setTimeout(r, 4500));

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      return res.result?.value;
    };

    const saveShot = async (name) => {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SCREENSHOTS_DIR, name), Buffer.from(res.data, 'base64'));
      fs.writeFileSync(path.join(ARTIFACT_DIR, name), Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${name}`);
    };

    // 1. Beat 0
    console.log('\n--- BEAT 0: Hero Damaged Earth ---');
    const b0Headline = await evaluate('document.querySelector(".beat-unit h1")?.innerText');
    console.log('Beat 0 Headline:', b0Headline);
    await saveShot('polluted_hero_beat0.png');

    // 2. Beat 1
    console.log('\n--- BEAT 1: Plastic Crisis (1080px scroll) ---');
    await evaluate('window.scrollTo({ top: 1080, behavior: "instant" })');
    await evaluate('window.dispatchEvent(new Event("scroll"))');
    await new Promise((r) => setTimeout(r, 800));
    const b1Headline = await evaluate('document.querySelector(".beat-unit h1")?.innerText');
    console.log('Beat 1 Headline:', b1Headline);
    await saveShot('polluted_plastic_beat1.png');

    // 3. Beat 2
    console.log('\n--- BEAT 2: Forests & Air (2160px scroll) ---');
    await evaluate('window.scrollTo({ top: 2160, behavior: "instant" })');
    await evaluate('window.dispatchEvent(new Event("scroll"))');
    await new Promise((r) => setTimeout(r, 800));
    const b2Headline = await evaluate('document.querySelector(".beat-unit h1")?.innerText');
    console.log('Beat 2 Headline:', b2Headline);
    await saveShot('polluted_forests_beat2.png');

    // 4. Beat 3: Final screen
    console.log('\n--- BEAT 3: Final Screen (Heal it with your own hands) ---');
    await evaluate('window.scrollTo({ top: 3240, behavior: "instant" })');
    await evaluate('window.dispatchEvent(new Event("scroll"))');
    await new Promise((r) => setTimeout(r, 1000));
    const b3Headline = await evaluate('document.querySelector(".final-beat-unit h1")?.innerText');
    const b3Btn = await evaluate('document.querySelector(".final-beat-unit button")?.innerText');
    const b3Micro = await evaluate('document.querySelectorAll(".final-beat-unit p")[1]?.innerText');
    console.log('Beat 3 Headline:', b3Headline);
    console.log('Beat 3 Button:', b3Btn?.replace(/\\s+/g, ' ').trim());
    console.log('Beat 3 Microcopy:', b3Micro);

    // Verify sonar rings are not present
    const sonarRings = await evaluate('document.querySelectorAll(".sonar-ring-1, .sonar-ring-2").length');
    console.log('Sonar ripple rings in DOM:', sonarRings, '(Expected: 0)');

    await saveShot('polluted_final_beat3.png');

    console.log('\n=== Test Summary ===');
    console.log('Total Console Errors:', errors.length);
    if (errors.length > 0) {
      console.error('Errors:', errors);
    } else {
      console.log('PASS: 0 console errors!');
    }

    ws.close();
  } finally {
    proc.kill();
    try { fs.rmSync(PROFILE_DIR, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
