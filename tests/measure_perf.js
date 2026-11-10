import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\.chrome_perf_profile';
const PORT = 9249;

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

    console.log('Navigating to http://localhost:5173/ ...');
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise((r) => setTimeout(r, 3500));

    // Install rAF frame timing measurement
    await send('Runtime.evaluate', {
      expression: `
        window.__frameTimes = [];
        let lastTime = performance.now();
        function loop(now) {
          window.__frameTimes.push(now - lastTime);
          lastTime = now;
          if (window.__frameTimes.length > 500) window.__frameTimes.shift();
          requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
      `,
    });

    // Simulate active scrolling
    for (let y = 0; y <= 3240; y += 120) {
      await send('Runtime.evaluate', {
        expression: `window.scrollTo(0, ${y}); window.dispatchEvent(new Event('scroll'));`,
      });
      await new Promise((r) => setTimeout(r, 16));
    }

    const perfData = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const times = window.__frameTimes.slice(20);
          const avg = times.reduce((a, b) => a + b, 0) / times.length;
          const max = Math.max(...times);
          const p95 = times.sort((a,b)=>a-b)[Math.floor(times.length * 0.95)];
          return { avg, max, p95, count: times.length };
        })()
      `,
      returnByValue: true,
    });

    console.log('Performance Measurement:', perfData.result?.value);
    ws.close();
  } finally {
    proc.kill();
    try { fs.rmSync(PROFILE_DIR, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch(console.error);
