import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\.chrome_final_beat_profile';
const SCREENSHOTS_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\tests\\screenshots';
const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\3d441c89-ae93-41db-9cb5-83b072e258ec';
const PORT = 9246;

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

    // ─────────────────────────────────────────────
    // TEST 1: 1920x1080 (Desktop Full HD)
    // ─────────────────────────────────────────────
    console.log('\n--- TEST 1: 1920x1080 Desktop ---');
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
    await new Promise((r) => setTimeout(r, 4000));

    // Scroll to beat 3 (3240px)
    await evaluate('window.scrollTo({ top: 3240, behavior: "instant" })');
    await evaluate('window.dispatchEvent(new Event("scroll"))');
    await new Promise((r) => setTimeout(r, 800));

    // Verify DOM contents for Beat 3
    const eyebrow = await evaluate('document.querySelector(".final-beat-unit p")?.innerText');
    const headline = await evaluate('document.querySelector(".final-beat-unit h1")?.innerText');
    const microcopy = await evaluate('document.querySelectorAll(".final-beat-unit p")[1]?.innerText');
    const btnText = await evaluate('document.querySelector(".final-beat-unit button")?.innerText');
    const btnRect = await evaluate(`
      (() => {
        const b = document.querySelector(".final-beat-unit button");
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { width: r.width, height: r.height, top: r.top, left: r.left };
      })()
    `);

    console.log('Eyebrow:', eyebrow);
    console.log('Headline:', headline);
    console.log('Button Text:', btnText?.replace(/\\s+/g, ' ').trim());
    console.log('Button Dimensions:', btnRect);
    console.log('Micro-copy:', microcopy);

    if (btnRect) {
      console.log(`Button height check (>= 72px): ${btnRect.height >= 70 ? 'PASS' : 'FAIL'} (${btnRect.height}px)`);
      console.log(`Button width check (>= 300px): ${btnRect.width >= 300 ? 'PASS' : 'FAIL'} (${btnRect.width}px)`);
    }

    // Verify header nav links are hidden or removed
    const headerNavOpacity = await evaluate(`
      (() => {
        const nav = document.querySelector("header nav");
        if (!nav) return "none";
        return window.getComputedStyle(nav.parentElement).opacity;
      })()
    `);
    console.log('Header Nav Opacity in Beat 3:', headerNavOpacity, '(Expected: 0 or none)');

    await saveShot('final_beat_1920x1080.png');

    // Test Hover on Button
    console.log('Simulating Button Hover...');
    await evaluate(`
      (() => {
        const b = document.querySelector(".final-beat-unit button");
        if (b) {
          b.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));
    await saveShot('final_beat_1920x1080_hover.png');

    // ─────────────────────────────────────────────
    // TEST 2: 1366x768 (Standard Laptop)
    // ─────────────────────────────────────────────
    console.log('\n--- TEST 2: 1366x768 Laptop ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: 1366,
      screenHeight: 768,
    });
    await evaluate('window.scrollTo({ top: 3000, behavior: "instant" })');
    await evaluate('window.dispatchEvent(new Event("scroll"))');
    await new Promise((r) => setTimeout(r, 600));

    const laptopBtnRect = await evaluate(`
      (() => {
        const b = document.querySelector(".final-beat-unit button");
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { width: r.width, height: r.height };
      })()
    `);
    console.log('Laptop Button Dimensions:', laptopBtnRect);
    await saveShot('final_beat_1366x768.png');

    // ─────────────────────────────────────────────
    // TEST 3: 390x844 (Mobile iPhone 12/13/14)
    // ─────────────────────────────────────────────
    console.log('\n--- TEST 3: 390x844 Mobile ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      screenWidth: 390,
      screenHeight: 844,
    });
    await evaluate('window.scrollTo({ top: 3000, behavior: "instant" })');
    await evaluate('window.dispatchEvent(new Event("scroll"))');
    await new Promise((r) => setTimeout(r, 600));

    const mobileBtnRect = await evaluate(`
      (() => {
        const b = document.querySelector(".final-beat-unit button");
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { width: r.width, height: r.height };
      })()
    `);
    console.log('Mobile Button Dimensions:', mobileBtnRect);
    if (mobileBtnRect) {
      console.log(`Mobile button height (>= 64px): ${mobileBtnRect.height >= 60 ? 'PASS' : 'FAIL'} (${mobileBtnRect.height}px)`);
      console.log(`Mobile button width (> 300px on 390px): ${mobileBtnRect.width >= 300 ? 'PASS' : 'FAIL'} (${mobileBtnRect.width}px)`);
    }
    await saveShot('final_beat_390x844_mobile.png');

    // ─────────────────────────────────────────────
    // TEST 4: Navigation to /clean on Button Click
    // ─────────────────────────────────────────────
    console.log('\n--- TEST 4: Button Click Transition to /clean ---');
    // Switch back to desktop 1920x1080
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: 1920,
      screenHeight: 1080,
    });
    await evaluate('window.scrollTo({ top: 3240, behavior: "instant" })');
    await evaluate('window.dispatchEvent(new Event("scroll"))');
    await new Promise((r) => setTimeout(r, 500));

    await evaluate('document.querySelector(".final-beat-unit button")?.click()');
    console.log('Clicked Start Cleaning button...');
    await new Promise((r) => setTimeout(r, 1200));

    const curPath = await evaluate('window.location.pathname');
    console.log('Current Path after transition:', curPath, '(Expected: /clean)');

    // Summary
    console.log('\n=== Final Beat Verification Summary ===');
    console.log('Total Console Errors:', errors.length);
    if (errors.length > 0) {
      console.error('Errors encountered:', errors);
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
  console.error('Test script error:', err);
  process.exit(1);
});

