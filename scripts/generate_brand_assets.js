import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const BRAND_TEAL = '#0becc2';

const rows = [
  "......WWWWWT......",
  "....WWWTTWWTTT....",
  "...WWTTWTWTWTTW...",
  "..WWTTWTTTTTTWWWT.",
  ".WWWWTWWTTTTWTWWT.",
  "TWWWWWWTTTTTTWWWWT",
  "TWWWWWTTTTTTTTTTWW",
  "TTWTWTTTTTTTWWWWWW",
  "TTWWTWTTTTTWWWWWWW",
  "TTTWWTTTTTTWWWWWWW",
  "TTTTWWWWTTTTTTWWWT",
  ".TTTWWWWWTTTTTWWW.",
  ".TTTTWWWWTTTTTWWW.",
  "..TTTTWWTTTTTTWW..",
  "...TTTWTTTTTTTW...",
  "....TTWTTTTTTT....",
  "......TTTTTT......"
];

function generateMarkSvg(brandColor = BRAND_TEAL) {
  let rects = '';
  rows.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      if (ch === 'W') {
        rects += `  <rect x="${x}" y="${y}" width="1" height="1" fill="#ffffff"/>\n`;
      } else if (ch === 'T') {
        rects += `  <rect x="${x}" y="${y}" width="1" height="1" fill="${brandColor}"/>\n`;
      }
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 17" width="100%" height="100%" shape-rendering="crispEdges">
${rects}</svg>`;
}

function generateLogoSvg(brandColor = BRAND_TEAL) {
  let rects = '';
  rows.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      if (ch === 'W') {
        rects += `  <rect x="${x}" y="${y + 1}" width="1" height="1" fill="#ffffff"/>\n`;
      } else if (ch === 'T') {
        rects += `  <rect x="${x}" y="${y + 1}" width="1" height="1" fill="${brandColor}"/>\n`;
      }
    });
  });

  // Lockup: 18x17 mark + gap + TerraHeal text
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 20" width="100%" height="100%" shape-rendering="crispEdges">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&amp;display=swap');
      .wordmark { font-family: 'Pixelify Sans', sans-serif; font-size: 13px; font-weight: 700; dominant-baseline: middle; }
    </style>
  </defs>
  <g id="globe">
${rects}  </g>
  <text x="24" y="10.5" class="wordmark">
    <tspan fill="#ffffff">Terra</tspan><tspan fill="${brandColor}">Heal</tspan>
  </text>
</svg>`;
}

async function generateAllAssets() {
  fs.mkdirSync('src/assets/logo', { recursive: true });
  fs.mkdirSync('public', { recursive: true });

  const markSvg = generateMarkSvg(BRAND_TEAL);
  const logoSvg = generateLogoSvg(BRAND_TEAL);

  fs.writeFileSync('src/assets/logo/terraheal-mark.svg', markSvg);
  fs.writeFileSync('src/assets/logo/terraheal-logo.svg', logoSvg);
  fs.writeFileSync('public/terraheal-mark.svg', markSvg);
  fs.writeFileSync('public/terraheal-logo.svg', logoSvg);

  // Favicon SVG with #050505 rounded-square background
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges">
  <rect width="32" height="32" rx="7" fill="#050505"/>
  <g transform="translate(7, 7.5)">
${generateMarkSvg(BRAND_TEAL).replace(/<svg[^>]*>|<\/svg>/g, '')}
  </g>
</svg>`;
  fs.writeFileSync('public/favicon.svg', faviconSvg);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Generate favicon-32.png (32x32)
  await page.setViewport({ width: 32, height: 32, deviceScaleFactor: 1 });
  await page.setContent(`
    <html style="background:transparent; margin:0; padding:0; overflow:hidden;">
      <body style="margin:0; padding:0; overflow:hidden;">
        ${faviconSvg}
      </body>
    </html>
  `);
  await page.screenshot({ path: 'public/favicon-32.png', omitBackground: true });
  // Also copy to favicon.png
  fs.copyFileSync('public/favicon-32.png', 'public/favicon.png');

  // 2. Generate apple-touch-icon.png (180x180)
  await page.setViewport({ width: 180, height: 180, deviceScaleFactor: 1 });
  const icon180Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180" shape-rendering="crispEdges">
    <rect width="180" height="180" rx="36" fill="#050505"/>
    <g transform="translate(36, 40) scale(6)">
      ${generateMarkSvg(BRAND_TEAL).replace(/<svg[^>]*>|<\/svg>/g, '')}
    </g>
  </svg>`;
  await page.setContent(`
    <html style="background:transparent; margin:0; padding:0; overflow:hidden;">
      <body style="margin:0; padding:0; overflow:hidden;">
        ${icon180Svg}
      </body>
    </html>
  `);
  await page.screenshot({ path: 'public/apple-touch-icon.png', omitBackground: true });

  // 3. Generate icon-512.png (512x512)
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
  const icon512Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
    <rect width="512" height="512" rx="100" fill="#050505"/>
    <g transform="translate(100, 114) scale(17.3)">
      ${generateMarkSvg(BRAND_TEAL).replace(/<svg[^>]*>|<\/svg>/g, '')}
    </g>
  </svg>`;
  await page.setContent(`
    <html style="background:transparent; margin:0; padding:0; overflow:hidden;">
      <body style="margin:0; padding:0; overflow:hidden;">
        ${icon512Svg}
      </body>
    </html>
  `);
  await page.screenshot({ path: 'public/icon-512.png', omitBackground: true });

  // 4. Generate og-image.png (1200x630)
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            width:1200px; height:630px;
            background:#050505;
            display:flex; flex-direction:column;
            align-items:center; justify-content:center;
            font-family:'Pixelify Sans', sans-serif;
            color:white;
            position:relative;
            overflow:hidden;
          }
          .stars {
            position:absolute; inset:0;
            background-image:
              radial-gradient(1px 1px at 80px 120px, #ffffff, transparent),
              radial-gradient(1.5px 1.5px at 240px 80px, #cbd5e1, transparent),
              radial-gradient(1px 1px at 500px 190px, #0becc2, transparent),
              radial-gradient(1.5px 1.5px at 850px 140px, #ffffff, transparent),
              radial-gradient(1px 1px at 1100px 220px, #38bdf8, transparent),
              radial-gradient(1px 1px at 180px 480px, #ffffff, transparent),
              radial-gradient(1.5px 1.5px at 420px 520px, #94a3b8, transparent),
              radial-gradient(1px 1px at 780px 450px, #0becc2, transparent),
              radial-gradient(1.5px 1.5px at 1040px 490px, #ffffff, transparent);
            opacity:0.6;
          }
          .glow {
            position:absolute;
            width:600px; height:300px;
            background:radial-gradient(ellipse at center, rgba(11,236,194,0.12) 0%, transparent 70%);
            top:50%; left:50%; transform:translate(-50%, -50%);
            filter:blur(40px);
          }
          .lockup {
            display:flex; align-items:center; gap:36px;
            z-index:10;
          }
          .mark-box {
            width:108px; height:102px;
            image-rendering:pixelated;
          }
          .text-box {
            font-size:92px; font-weight:700;
            letter-spacing:0.02em;
            line-height:1;
          }
          .tagline {
            margin-top:38px;
            font-family:'JetBrains Mono', monospace;
            font-size:22px;
            letter-spacing:0.24em;
            text-transform:uppercase;
            color:rgba(255,255,255,0.7);
            z-index:10;
          }
          .tagline span {
            color:#0becc2;
          }
        </style>
      </head>
      <body>
        <div class="stars"></div>
        <div class="glow"></div>
        <div class="lockup">
          <div class="mark-box">
            ${generateMarkSvg(BRAND_TEAL)}
          </div>
          <div class="text-box">
            <span>Terra</span><span style="color:#0becc2;">Heal</span>
          </div>
        </div>
        <div class="tagline">Heal the planet by <span>playing.</span></div>
      </body>
    </html>
  `);

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'public/og-image.png' });
  await browser.close();

  console.log('All brand assets successfully generated!');
}

generateAllAssets().catch(console.error);
