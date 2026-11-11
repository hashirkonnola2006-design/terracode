import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\.chrome_ocean_test_profile';
const SCREENSHOTS_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\tests\\screenshots';
const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\3d441c89-ae93-41db-9cb5-83b072e258ec';
const PORT = 9260;

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
    await send('Runtime.enable');

    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        sessionStorage.setItem('terraheal_intro_played', 'true');
      `,
    });

    console.log('Navigating to http://localhost:5173/clean...');
    await send('Page.navigate', { url: 'http://localhost:5173/clean' });
    await new Promise((r) => setTimeout(r, 3500));

    // Dismiss tutorial and select Mission 4 (Oceans)
    await send('Runtime.evaluate', {
      expression: `(() => {
        if (window.__ECO_STORE__) {
          window.__ECO_STORE__.getState().dismissTutorial();
          window.__ECO_STORE__.getState().setActiveMission(4);
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    // Check store state before sweep
    const initialCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const store = window.__ECO_STORE__ ? window.__ECO_STORE__.getState() : null;
        return {
          hasStore: !!store,
          cleanliness: store?.cleanup?.health,
          mission4Percent: store?.cleanup?.mission4?.sweptPercent,
          mission4Target: store?.cleanup?.mission4?.target,
          mission4Completed: store?.cleanup?.mission4?.completed
        };
      })()`,
      returnByValue: true,
    });
    console.log('Initial Store State:', initialCheck.result.value);

    // Capture initial clean screen showing beacon and plastic items
    const initialShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'clean_initial_ocean.png'), Buffer.from(initialShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'clean_initial_ocean.png'), Buffer.from(initialShot.data, 'base64'));
    console.log('✓ clean_initial_ocean.png captured');

    // Swoop 1: Clean Indian Ocean Gyre around (756, 889)
    console.log('Swooping Indian Ocean Gyre (710-820, 840-920)...');
    for (let x = 710; x <= 820; x += 15) {
      for (let y = 840; y <= 920; y += 15) {
        await send('Input.dispatchMouseEvent', {
          type: 'mousePressed',
          x,
          y,
          button: 'left',
          clickCount: 1,
        });
        await send('Input.dispatchMouseEvent', {
          type: 'mouseReleased',
          x,
          y,
          button: 'left',
        });
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    await new Promise((r) => setTimeout(r, 600));

    // Rotate Earth slightly by dragging across center to bring next gyre into view
    console.log('Rotating globe to expose Atlantic gyre...');
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: 1100,
      y: 500,
      button: 'left',
      buttons: 1,
    });
    for (let dx = 0; dx <= 300; dx += 25) {
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: 1100 + dx,
        y: 500,
        button: 'left',
        buttons: 1,
      });
      await new Promise((r) => setTimeout(r, 20));
    }
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: 1400,
      y: 500,
      button: 'left',
      buttons: 0,
    });

    await new Promise((r) => setTimeout(r, 600));

    // Swoop across center-top where Atlantic gyre now rotates into
    console.log('Swooping rotated ocean patch...');
    for (let x = 850; x <= 1100; x += 20) {
      for (let y = 350; y <= 550; y += 25) {
        await send('Input.dispatchMouseEvent', {
          type: 'mousePressed',
          x,
          y,
          button: 'left',
          clickCount: 1,
        });
        await send('Input.dispatchMouseEvent', {
          type: 'mouseReleased',
          x,
          y,
          button: 'left',
        });
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    await new Promise((r) => setTimeout(r, 800));

    // Check store state after mouse sweep
    const sweepCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const store = window.__ECO_STORE__ ? window.__ECO_STORE__.getState() : null;
        return {
          cleanliness: store?.cleanup?.health,
          mission4Percent: store?.cleanup?.mission4?.sweptPercent,
          mission4Target: store?.cleanup?.mission4?.target,
          mission4Progress: store?.cleanup?.mission4?.progress,
          mission4Completed: store?.cleanup?.mission4?.completed,
          sweptCount: store?.cleanup?.mission4?.sweptIds?.length
        };
      })()`,
      returnByValue: true,
    });
    console.log('Post-Sweep Store State:', sweepCheck.result.value);

    // Capture screenshot after sweep
    const postShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'clean_post_sweep.png'), Buffer.from(postShot.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'clean_post_sweep.png'), Buffer.from(postShot.data, 'base64'));
    console.log('✓ clean_post_sweep.png captured');

    console.log('Ocean swoop test completed successfully!');
  } finally {
    proc.kill();
  }
}

run().catch(console.error);
