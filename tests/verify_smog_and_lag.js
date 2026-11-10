import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\.chrome_perf_test_profile';
const SCREENSHOTS_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\tests\\screenshots';
const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\3d441c89-ae93-41db-9cb5-83b072e258ec';
const PORT = 9250;

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

    const errors = [];
    ws.addEventListener('message', (msg) => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        if (data.params.type === 'error') {
          errors.push(data.params.args.map((a) => a.value || a.description).join(' '));
        }
      }
    });

    console.log('Navigating to http://localhost:5173/ ...');
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise((r) => setTimeout(r, 4000));

    // Install frame time recorder
    await send('Runtime.evaluate', {
      expression: `
        window.__frameDeltas = [];
        let prev = performance.now();
        let recording = false;
        window.__startRecording = () => { window.__frameDeltas = []; prev = performance.now(); recording = true; };
        window.__stopRecording = () => { recording = false; };
        function onFrame(now) {
          if (recording) {
            window.__frameDeltas.push(now - prev);
          }
          prev = now;
          requestAnimationFrame(onFrame);
        }
        requestAnimationFrame(onFrame);
      `,
    });

    const saveShot = async (name) => {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SCREENSHOTS_DIR, name), Buffer.from(res.data, 'base64'));
      fs.writeFileSync(path.join(ARTIFACT_DIR, name), Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${name}`);
    };

    // Save Slide 1 (Beat 0)
    await saveShot('redesign_smog_beat0.png');

    // Scroll to Slide 2 (Beat 1)
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 1080, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));` });
    await new Promise((r) => setTimeout(r, 600));
    await saveShot('redesign_smog_beat1.png');

    // Scroll to Slide 3 (Beat 2)
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 2160, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));` });
    await new Promise((r) => setTimeout(r, 600));
    await saveShot('redesign_smog_beat2.png');

    // Scroll to Slide 4 (Beat 3)
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 3240, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));` });
    await new Promise((r) => setTimeout(r, 800));
    await saveShot('redesign_smog_beat3.png');

    // Start benchmark: continuous rapid scrolling up and down
    console.log('Running rapid scroll performance benchmark...');
    await send('Runtime.evaluate', { expression: `window.__startRecording()` });

    for (let cycle = 0; cycle < 3; cycle++) {
      // Scroll down
      for (let y = 0; y <= 3240; y += 180) {
        await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y}); window.dispatchEvent(new Event('scroll'));` });
        await new Promise((r) => setTimeout(r, 16));
      }
      // Scroll up
      for (let y = 3240; y >= 0; y -= 180) {
        await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y}); window.dispatchEvent(new Event('scroll'));` });
        await new Promise((r) => setTimeout(r, 16));
      }
    }

    await send('Runtime.evaluate', { expression: `window.__stopRecording()` });

    const benchmark = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const d = window.__frameDeltas;
          if (!d.length) return { avg: 0, fps: 0, count: 0 };
          const avg = d.reduce((a, b) => a + b, 0) / d.length;
          const sorted = [...d].sort((a, b) => a - b);
          const p95 = sorted[Math.floor(sorted.length * 0.95)];
          const fps = 1000 / avg;
          return { avg: avg.toFixed(2), p95: p95.toFixed(2), fps: fps.toFixed(1), count: d.length };
        })()
      `,
      returnByValue: true,
    });

    console.log('\n=== Scroll Performance Benchmark Result ===');
    console.log(benchmark.result?.value);

    console.log('\n=== Console Errors ===');
    console.log('Error Count:', errors.length);
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

main().catch(console.error);
