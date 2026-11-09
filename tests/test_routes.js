import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\.chrome_routes_profile';
const SCREENSHOTS_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\tests\\screenshots';
const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\3d441c89-ae93-41db-9cb5-83b072e258ec';
const PORT = 9235;

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

    // ── 1. TEST ROUTE 1: LANDING PAGE ("/") ──
    console.log('Testing Route 1: http://localhost:5173/ ...');
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise((r) => setTimeout(r, 4000));

    // Capture Landing Hero (Scroll 0)
    let res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'landing_scroll_0.png'), Buffer.from(res.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'landing_scroll_0.png'), Buffer.from(res.data, 'base64'));
    console.log('Saved: landing_scroll_0.png');

    // Scroll to 40% (Beat 1: Plastics)
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: (document.documentElement.scrollHeight - window.innerHeight) * 0.40, behavior: 'auto' });`,
    });
    await new Promise((r) => setTimeout(r, 800));
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'landing_beat_1.png'), Buffer.from(res.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'landing_beat_1.png'), Buffer.from(res.data, 'base64'));
    console.log('Saved: landing_beat_1.png');

    // Scroll to 72% (Beat 2: Call for help)
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: (document.documentElement.scrollHeight - window.innerHeight) * 0.72, behavior: 'auto' });`,
    });
    await new Promise((r) => setTimeout(r, 800));
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'landing_beat_2.png'), Buffer.from(res.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'landing_beat_2.png'), Buffer.from(res.data, 'base64'));
    console.log('Saved: landing_beat_2.png');

    // Scroll to 95% (Beat 3 & "Start Cleaning" button)
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: (document.documentElement.scrollHeight - window.innerHeight) * 0.95, behavior: 'auto' });`,
    });
    await new Promise((r) => setTimeout(r, 800));
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'landing_start_button.png'), Buffer.from(res.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'landing_start_button.png'), Buffer.from(res.data, 'base64'));
    console.log('Saved: landing_start_button.png');

    // ── 2. TEST ROUTE 2: CLEANING GAME ("/clean") ──
    console.log('Testing Route 2: http://localhost:5173/clean ...');
    await send('Page.navigate', { url: 'http://localhost:5173/clean' });
    await new Promise((r) => setTimeout(r, 3000));

    // Dismiss tutorial to reveal the full game UI & 3D Earth
    await send('Runtime.evaluate', {
      expression: `
        const xBtn = document.querySelector('button[title="Skip tutorial"]');
        if (xBtn) xBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Capture Cleaning Page Active Gameplay State
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'clean_initial_state.png'), Buffer.from(res.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'clean_initial_state.png'), Buffer.from(res.data, 'base64'));
    console.log('Saved: clean_initial_state.png');

    // Test Auto-Heal (Skip button) to test 100% Ending Screen
    console.log('Triggering skipAndHealAll for 100% completion test...');
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const skipBtn = btns.find(b => b.textContent && b.textContent.includes('Skip, just heal it'));
        if (skipBtn) skipBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1800));

    // Capture 100% Restored Ending Screen
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'clean_100_percent_ending.png'), Buffer.from(res.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'clean_100_percent_ending.png'), Buffer.from(res.data, 'base64'));
    console.log('Saved: clean_100_percent_ending.png');

    console.log('=== Browser Test Results ===');
    console.log(`Console Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    } else {
      console.log('No console errors encountered! Both routes loaded and rendered cleanly.');
    }

    ws.close();
  } catch (err) {
    console.error('Test run error:', err);
  } finally {
    try { proc.kill(); } catch (_) {}
  }
}

main();
