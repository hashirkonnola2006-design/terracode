import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\.chrome_six_pillars_profile';
const SCREENSHOTS_DIR = 'C:\\Users\\Lenovo\\Documents\\terracode\\tests\\screenshots';
const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\3d441c89-ae93-41db-9cb5-83b072e258ec';
const PORT = 9252;

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
    const consoleLogs = [];

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id)(data.result);
        pending.delete(data.id);
      }
      if (data.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push(data.params);
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
      source: `sessionStorage.setItem('terraheal_intro_played', 'true');`,
    });

    console.log('Navigating to http://localhost:5173/solutions...');
    await send('Page.navigate', { url: 'http://localhost:5173/solutions' });
    await new Promise((r) => setTimeout(r, 3500));

    // Scroll to #solutions explicitly
    await send('Runtime.evaluate', {
      expression: `document.getElementById('solutions')?.scrollIntoView({ behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Test 1: Desktop 1920x1080 Dimensions & Fit
    const desktopMetrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('solutions');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          height: rect.height,
          scrollHeight: el.scrollHeight,
          windowHeight: window.innerHeight,
          fitsInScreen: rect.height <= 820
        };
      })()`,
      returnByValue: true,
    });
    console.log('1920x1080 Metrics:', desktopMetrics.result.value);

    // Capture Desktop 01 Reduce
    const shot1920 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'pillars_1920_reduce.png'), Buffer.from(shot1920.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'pillars_1920_reduce.png'), Buffer.from(shot1920.data, 'base64'));
    console.log('✓ pillars_1920_reduce.png captured');

    // Test 2: Click pillar 03 Recycle & verify content update
    await send('Runtime.evaluate', {
      expression: `(() => {
        const tab = document.getElementById('pillar-tab-recycle');
        if (tab) tab.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const recycleCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const panel = document.querySelector('[role="tabpanel"]');
        return {
          title: panel ? panel.querySelector('h3')?.textContent : null,
          isRecycle: panel ? panel.querySelector('h3')?.textContent.includes('Recycle') : false
        };
      })()`,
      returnByValue: true,
    });
    console.log('Clicked 03 Recycle check:', recycleCheck.result.value);

    const shotRecycle = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'pillars_1920_recycle.png'), Buffer.from(shotRecycle.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'pillars_1920_recycle.png'), Buffer.from(shotRecycle.data, 'base64'));
    console.log('✓ pillars_1920_recycle.png captured');

    // Test 3: Keyboard navigation test (ArrowDown from Recycle -> Compost)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const tab = document.getElementById('pillar-tab-recycle');
        if (tab) {
          tab.focus();
          const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
          tab.dispatchEvent(event);
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const keyCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const panel = document.querySelector('[role="tabpanel"]');
        return panel ? panel.querySelector('h3')?.textContent : null;
      })()`,
      returnByValue: true,
    });
    console.log('After ArrowDown from Recycle:', keyCheck.result.value);

    // Test 4: Compact Desktop 1280x720
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Runtime.evaluate', {
      expression: `document.getElementById('solutions')?.scrollIntoView({ behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const metrics720 = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('solutions');
        const rect = el.getBoundingClientRect();
        return {
          height: rect.height,
          scrollHeight: el.scrollHeight,
          windowHeight: window.innerHeight,
          fitsWithin720: rect.height <= 720
        };
      })()`,
      returnByValue: true,
    });
    console.log('1280x720 Metrics:', metrics720.result.value);

    const shot720 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'pillars_1280x720.png'), Buffer.from(shot720.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'pillars_1280x720.png'), Buffer.from(shot720.data, 'base64'));
    console.log('✓ pillars_1280x720.png captured');

    // Test 5: Standard Laptop 1440x900
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Runtime.evaluate', {
      expression: `document.getElementById('solutions')?.scrollIntoView({ behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const metrics900 = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('solutions');
        const rect = el.getBoundingClientRect();
        return {
          height: rect.height,
          scrollHeight: el.scrollHeight,
          windowHeight: window.innerHeight,
          fitsWithin900: rect.height <= 820
        };
      })()`,
      returnByValue: true,
    });
    console.log('1440x900 Metrics:', metrics900.result.value);

    // Test 6: Mobile Phone 390x844
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send('Runtime.evaluate', {
      expression: `document.getElementById('solutions')?.scrollIntoView({ behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Check horizontal overflow
    const mobileMetrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const docScrollWidth = document.documentElement.scrollWidth;
        const windowWidth = window.innerWidth;
        const openPanels = document.querySelectorAll('[id^="mobile-panel-"]');
        return {
          docScrollWidth,
          windowWidth,
          noHorizontalScroll: docScrollWidth <= windowWidth,
          openPanelsCount: openPanels.length,
          openPanelId: openPanels[0]?.id
        };
      })()`,
      returnByValue: true,
    });
    console.log('Mobile (390x844) Metrics:', mobileMetrics.result.value);

    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'pillars_mobile_390x844.png'), Buffer.from(shotMobile.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'pillars_mobile_390x844.png'), Buffer.from(shotMobile.data, 'base64'));
    console.log('✓ pillars_mobile_390x844.png captured');

    // Test 7: Mobile Accordion Switch (Click 02 Reuse)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button[aria-controls^="mobile-panel-"]'));
        const reuseBtn = buttons.find(b => b.textContent.includes('Reuse'));
        if (reuseBtn) reuseBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const mobileAccordionCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const openPanels = document.querySelectorAll('[id^="mobile-panel-"]');
        return {
          openPanelsCount: openPanels.length,
          openPanelId: openPanels[0]?.id
        };
      })()`,
      returnByValue: true,
    });
    console.log('After tapping 02 Reuse on mobile:', mobileAccordionCheck.result.value);

    // Test 8: Tablet 768x1024
    await send('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send('Runtime.evaluate', {
      expression: `document.getElementById('solutions')?.scrollIntoView({ behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const tabletMetrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const docScrollWidth = document.documentElement.scrollWidth;
        const windowWidth = window.innerWidth;
        const openPanels = document.querySelectorAll('[id^="mobile-panel-"]');
        return {
          docScrollWidth,
          windowWidth,
          noHorizontalScroll: docScrollWidth <= windowWidth,
          openPanelsCount: openPanels.length
        };
      })()`,
      returnByValue: true,
    });
    console.log('Tablet (768x1024) Metrics:', tabletMetrics.result.value);

    const shotTablet = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'pillars_tablet_768x1024.png'), Buffer.from(shotTablet.data, 'base64'));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'pillars_tablet_768x1024.png'), Buffer.from(shotTablet.data, 'base64'));
    console.log('✓ pillars_tablet_768x1024.png captured');

    console.log('All automated checks and screenshots completed!');
  } finally {
    proc.kill();
  }
}

run().catch(console.error);
