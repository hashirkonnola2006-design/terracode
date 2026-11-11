// ═══════════════════════════════════════════════════════════════
// TERRAHEAL CLEANUP MISSION — CERTIFICATE OF PLANETARY RESTORATION
// ═══════════════════════════════════════════════════════════════

import logoSvgRaw from '../assets/logo/terraheal-logo.svg?raw';

/**
 * Ensures all typography used in the certificate is fully loaded before rendering to Canvas.
 */
async function ensureFontsLoaded() {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load('700 70px "Playfair Display"'),
      document.fonts.load('italic 600 46px "Playfair Display"'),
      document.fonts.load('italic 400 23px "Playfair Display"'),
      document.fonts.load('300 25px "Outfit"'),
      document.fonts.load('500 21px "Outfit"'),
      document.fonts.load('600 20px "JetBrains Mono"'),
    ]);
  } catch (_) {
    // Fall back gracefully if font loading throws
  }
  await document.fonts.ready;
}

/**
 * Draws vintage indented concave frame on 2D canvas context.
 */
function drawIndentedFrame(ctx, x, y, w, h, r, strokeStyle, lineWidth) {
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();

  // Top edge
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  // Top-right concave arc
  ctx.arc(x + w, y, r, Math.PI, 0.5 * Math.PI, true);
  // Right edge
  ctx.lineTo(x + w, y + h - r);
  // Bottom-right concave arc
  ctx.arc(x + w, y + h, r, 1.5 * Math.PI, Math.PI, true);
  // Bottom edge
  ctx.lineTo(x + r, y + h);
  // Bottom-left concave arc
  ctx.arc(x, y + h, r, 0, 1.5 * Math.PI, true);
  // Left edge
  ctx.lineTo(x, y + r);
  // Top-left concave arc
  ctx.arc(x, y, r, 0.5 * Math.PI, 0, true);

  ctx.stroke();

  // Corner decorative diagonal accents
  const d = r * 0.4;
  ctx.lineWidth = lineWidth * 0.75;
  ctx.beginPath();
  // Top-left
  ctx.moveTo(x + 5, y + 5);
  ctx.lineTo(x + 5 + d, y + 5 + d);
  // Top-right
  ctx.moveTo(x + w - 5, y + 5);
  ctx.lineTo(x + w - 5 - d, y + 5 + d);
  // Bottom-right
  ctx.moveTo(x + w - 5, y + h - 5);
  ctx.lineTo(x + w - 5 - d, y + h - 5 - d);
  // Bottom-left
  ctx.moveTo(x + 5, y + h - 5);
  ctx.lineTo(x + 5 + d, y + h - 5 - d);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws laurel branch wreaths flanking the title.
 */
function drawLaurelBranch(ctx, baseX, baseY, isLeft) {
  ctx.save();
  const dir = isLeft ? 1 : -1;
  ctx.strokeStyle = '#10b981';
  ctx.fillStyle = '#10b981';
  ctx.lineWidth = 2.4;

  // Central curving stem
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX - 35 * dir, baseY - 65, baseX - 12 * dir, baseY - 130);
  ctx.stroke();

  // Tip leaf at head of stem
  ctx.save();
  ctx.translate(baseX - 12 * dir, baseY - 130);
  ctx.rotate(isLeft ? 0.2 : -0.2);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -10, 0, -22);
  ctx.quadraticCurveTo(-6, -10, 0, 0);
  ctx.fill();
  ctx.restore();

  // Leaf pairs along the stem
  const pairs = [
    { t: 0.22, rot: 0.85, size: 13 },
    { t: 0.45, rot: 0.75, size: 15 },
    { t: 0.68, rot: 0.65, size: 16 },
    { t: 0.90, rot: 0.55, size: 15 },
  ];

  pairs.forEach(({ t, rot, size }) => {
    // Quadratic bezier point calculation: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
    const p0x = baseX;
    const p0y = baseY;
    const p1x = baseX - 35 * dir;
    const p1y = baseY - 65;
    const p2x = baseX - 12 * dir;
    const p2y = baseY - 130;

    const px = (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * p1x + t * t * p2x;
    const py = (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;

    // Outer leaf (curving away)
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot * -dir);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.4, -size * 0.5, 0, -size);
    ctx.quadraticCurveTo(-size * 0.4, -size * 0.5, 0, 0);
    ctx.fill();
    ctx.restore();

    // Inner leaf (curving toward stem/title)
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate((rot - 0.4) * dir);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.35, -size * 0.45, 0, -size * 0.9);
    ctx.quadraticCurveTo(-size * 0.35, -size * 0.45, 0, 0);
    ctx.fill();
    ctx.restore();
  });

  ctx.restore();
}

/**
 * Generates the full 1080x1440 certificate on a Canvas and returns a PNG Blob.
 *
 * @param {Object} options
 * @param {string} [options.playerName] - Optional player name
 * @param {number} [options.itemsCollected] - Total debris/items cleaned
 * @param {number} [options.co2Absorbed] - CO2 in kg
 * @returns {Promise<Blob>}
 */
export async function generateCleanCertificateBlob({ playerName = '', itemsCollected = 28, co2Absorbed = 2400 }) {
  await ensureFontsLoaded();

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');

  const W = 1080;
  const H = 1440;
  const CX = W / 2;

  // 1. Dark Background (#05080c)
  ctx.fillStyle = '#05080c';
  ctx.fillRect(0, 0, W, H);

  // Subtle dark teal radial gradient in center
  const bgGrad = ctx.createRadialGradient(CX, 550, 60, CX, 550, 750);
  bgGrad.addColorStop(0, '#0a1618');
  bgGrad.addColorStop(1, '#05080c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Vintage Frames with Indented Concave Corners
  // Outer frame (muted dark teal)
  drawIndentedFrame(ctx, 44, 44, W - 88, H - 88, 38, 'rgba(16, 56, 48, 0.9)', 2);

  // Inner frame (vibrant accent green)
  drawIndentedFrame(ctx, 68, 68, W - 136, H - 136, 32, '#10b981', 2.5);

  // 3. TerraHeal Pixel Logo (drawn sharp with imageSmoothingEnabled = false)
  try {
    const logoImg = new Image();
    const svgBlob = new Blob([logoSvgRaw], { type: 'image/svg+xml;charset=utf-8' });
    const logoUrl = URL.createObjectURL(svgBlob);
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
      logoImg.src = logoUrl;
    });

    const logoW = 320;
    const logoH = 80;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(logoImg, CX - logoW / 2, 125, logoW, logoH);
    ctx.imageSmoothingEnabled = true;
    URL.revokeObjectURL(logoUrl);
  } catch (err) {
    console.warn('Failed to draw SVG logo to certificate canvas:', err);
  }

  // 4. Small caps line: — CERTIFICATE OF PLANETARY RESTORATION —
  ctx.font = '500 17px "Outfit", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '5px';
  ctx.fillText('— CERTIFICATE OF PLANETARY RESTORATION —', CX, 280);
  ctx.letterSpacing = '0px';

  // Thin flanking lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(90, 274);
  ctx.lineTo(190, 274);
  ctx.moveTo(W - 190, 274);
  ctx.lineTo(W - 90, 274);
  ctx.stroke();

  // 5. Title: "Earth " in white + "Restored" in accent green
  ctx.font = '700 70px "Playfair Display", serif';
  const part1 = 'Earth ';
  const part2 = 'Restored';
  const w1 = ctx.measureText(part1).width;
  const w2 = ctx.measureText(part2).width;
  const totalTitleW = w1 + w2;
  const titleStartX = CX - totalTitleW / 2;
  const titleY = 390;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(part1, titleStartX, titleY);

  ctx.fillStyle = '#10b981';
  ctx.fillText(part2, titleStartX + w1, titleY);

  // Laurel branch wreaths flanking the title
  drawLaurelBranch(ctx, titleStartX - 40, titleY + 25, true);
  drawLaurelBranch(ctx, titleStartX + totalTitleW + 40, titleY + 25, false);

  // 6. Ribbon Banner: "This is to certify that"
  const ribW = 410;
  const ribH = 46;
  const ribX = CX - ribW / 2;
  const ribY = 455;
  const notch = 18;

  ctx.save();
  ctx.fillStyle = '#061517';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(ribX, ribY);
  ctx.lineTo(ribX + ribW, ribY);
  ctx.lineTo(ribX + ribW - notch, ribY + ribH / 2);
  ctx.lineTo(ribX + ribW, ribY + ribH);
  ctx.lineTo(ribX, ribY + ribH);
  ctx.lineTo(ribX + notch, ribY + ribH / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.font = '500 21px "Outfit", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('This is to certify that', CX, ribY + 31);
  ctx.restore();

  // 7. Player Name & Green Horizontal Line
  const trimmedName = (playerName || '').trim();
  if (trimmedName) {
    ctx.font = 'italic 600 46px "Playfair Display", serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(trimmedName, CX, 565);
  }

  // Name green line (always drawn)
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(CX - 280, 595);
  ctx.lineTo(CX + 280, 595);
  ctx.stroke();

  // 8. Large Badge & 100% Heal Bar
  ctx.font = '700 68px "Playfair Display", serif';
  ctx.fillStyle = '#0becc2';
  ctx.textAlign = 'center';
  ctx.fillText('100% RESTORED', CX, 695);

  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillStyle = '#5df7d9';
  ctx.letterSpacing = '1.5px';
  ctx.fillText('MISSION: PLANETARY RESTORATION', CX, 735);
  ctx.letterSpacing = '0px';

  // Progress bar
  const barW = 340;
  const barH = 7;
  const barX = CX - barW / 2;
  const barY = 755;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 4);
  ctx.fill();

  ctx.fillStyle = '#0becc2';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 4);
  ctx.fill();

  // 9. Body Text
  ctx.font = '300 25px "Outfit", sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.fillText('has successfully restored Planet Earth to 100% health,', CX, 840);
  ctx.fillText('clearing orbital debris, transitioning to renewable energy,', CX, 880);
  ctx.fillText('reforesting biomes, and cleansing oceanic gyres.', CX, 920);

  // 10. Divider with Twin Leaf
  const divY = 1040;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(CX - 180, divY);
  ctx.lineTo(CX - 30, divY);
  ctx.moveTo(CX + 30, divY);
  ctx.lineTo(CX + 180, divY);
  ctx.stroke();

  // Twin leaf sprout in center
  ctx.save();
  ctx.fillStyle = '#10b981';
  ctx.translate(CX, divY);
  // Left leaf
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.quadraticCurveTo(-18, -4, -16, -20);
  ctx.quadraticCurveTo(-4, -14, 0, 4);
  ctx.fill();
  // Right leaf
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.quadraticCurveTo(18, -4, 16, -20);
  ctx.quadraticCurveTo(4, -14, 0, 4);
  ctx.fill();
  ctx.restore();

  // 11. Footer: Date & Brand Line
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  ctx.font = '500 18px "JetBrains Mono", monospace';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText(dateStr, CX, 1180);

  ctx.font = '500 20px "Outfit", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.letterSpacing = '3px';
  ctx.fillText('TerraHeal · Green Tomorrow', CX, 1220);
  ctx.letterSpacing = '0px';

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export to blob failed'));
    }, 'image/png');
  });
}

/**
 * Triggers direct browser download for a blob with a given filename.
 */
export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Downloads the TerraHeal Cleanup Mission certificate.
 */
export async function downloadCleanCertificate({ playerName = '', itemsCollected = 28, co2Absorbed = 2400, onToast } = {}) {
  const blob = await generateCleanCertificateBlob({ playerName, itemsCollected, co2Absorbed });
  const filename = playerName.trim()
    ? `TerraHeal-Restoration-Certificate-${playerName.trim().replace(/\s+/g, '_')}.png`
    : 'TerraHeal-Restoration-Certificate.png';
  triggerBlobDownload(blob, filename);
  if (onToast) onToast('Certificate downloaded');
}

/**
 * Shares the TerraHeal Cleanup Mission certificate with native file sharing if available.
 */
export async function shareCleanCertificate({ playerName = '', itemsCollected = 28, co2Absorbed = 2400, onToast } = {}) {
  const blob = await generateCleanCertificateBlob({ playerName, itemsCollected, co2Absorbed });
  const filename = 'TerraHeal-Restoration-Certificate.png';
  const file = new File([blob], filename, { type: 'image/png' });

  const shareText = `I just restored Planet Earth to 100% on TerraHeal! Cleaned orbital debris, restored native biomes, and cleansed the oceans. Join the mission: ${window.location.origin}/clean`;

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'My TerraHeal Restoration Certificate',
        text: shareText,
      });
      if (onToast) onToast('Certificate shared');
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('File share failed, falling back:', err);
    }
  }

  // Fallback: download image and copy text to clipboard
  triggerBlobDownload(blob, filename);
  try {
    await navigator.clipboard.writeText(shareText);
  } catch (_) {}
  if (onToast) {
    onToast('Certificate saved. Share text copied to clipboard!');
  }
}

