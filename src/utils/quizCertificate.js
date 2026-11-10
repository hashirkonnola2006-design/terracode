// ═══════════════════════════════════════════════════════════════
// TERRAHEAL ZERO-WASTE QUIZ — CERTIFICATE GENERATOR
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

  // Pairs of leaves along the stem
  const leafCount = 7;
  for (let i = 1; i <= leafCount; i++) {
    const t = i / (leafCount + 1);
    const px = (1 - t) * (1 - t) * baseX + 2 * (1 - t) * t * (baseX - 35 * dir) + t * t * (baseX - 12 * dir);
    const py = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * (baseY - 65) + t * t * (baseY - 130);

    const tx = 2 * (1 - t) * (-35 * dir) + 2 * t * (23 * dir);
    const ty = 2 * (1 - t) * (-65) + 2 * t * (-65);
    const stemAngle = Math.atan2(ty, tx);

    [-0.58, 0.58].forEach((offsetAngle) => {
      const leafAngle = stemAngle + offsetAngle * dir;
      const leafLen = 22 * (0.8 + 0.35 * Math.sin(t * Math.PI));
      const leafW = 7.5;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(leafAngle);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(leafW, -leafLen * 0.45, 0, -leafLen);
      ctx.quadraticCurveTo(-leafW, -leafLen * 0.45, 0, 0);
      ctx.fill();
      ctx.restore();
    });
  }
  ctx.restore();
}

/**
 * Generates the full 1080x1440 certificate on a Canvas and returns a PNG Blob.
 *
 * @param {Object} options
 * @param {number} options.score - Quiz score (0 to 10)
 * @param {number} options.health - Earth health percentage (0 to 100)
 * @param {string} [options.playerName] - Optional player name
 * @param {string} options.quote - Inspiring quote matching the tier
 * @returns {Promise<Blob>}
 */
export async function generateQuizCertificateBlob({ score, health, playerName = '', quote = '' }) {
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

  // 4. Small caps line: — CERTIFICATE OF ACHIEVEMENT —
  ctx.font = '500 17px "Outfit", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '5px';
  ctx.fillText('— CERTIFICATE OF ACHIEVEMENT —', CX, 280);
  ctx.letterSpacing = '0px';

  // Thin flanking lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(110, 274);
  ctx.lineTo(210, 274);
  ctx.moveTo(W - 210, 274);
  ctx.lineTo(W - 110, 274);
  ctx.stroke();

  // 5. Title: "Zero-Waste" in white + "Quiz" in accent green, perfectly centered
  ctx.font = '700 70px "Playfair Display", serif';
  const part1 = 'Zero-Waste ';
  const part2 = 'Quiz';
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

  // Name green line (always drawn, blank for signing or digital completion)
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(CX - 280, 595);
  ctx.lineTo(CX + 280, 595);
  ctx.stroke();

  // 8. Large Score Badge & Heal Bar
  ctx.font = '700 68px "Playfair Display", serif';
  ctx.fillStyle = '#0becc2';
  ctx.textAlign = 'center';
  ctx.fillText(`${score} / 10`, CX, 695);

  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillStyle = '#5df7d9';
  ctx.letterSpacing = '1px';
  ctx.fillText(`EARTH HEALED ${health}%`, CX, 735);
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
  ctx.roundRect(barX, barY, Math.max(10, (health / 100) * barW), barH, 4);
  ctx.fill();

  // 9. Body Text (3 centered lines)
  ctx.font = '300 25px "Outfit", sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.fillText(`scored ${score} of 10 in the Zero-Waste Quiz`, CX, 840);
  ctx.fillText(`and healed ${health}% of the Earth.`, CX, 880);

  if (quote) {
    ctx.font = 'italic 400 23px "Playfair Display", serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`"${quote}"`, CX, 935);
  }

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
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Downloads the TerraHeal Zero-Waste Quiz certificate.
 *
 * @param {Object} params
 * @param {number} params.score
 * @param {number} params.health
 * @param {string} [params.playerName]
 * @param {string} params.quote
 * @param {Function} [params.onToast] - Toast notification callback
 */
export async function downloadQuizCertificate({ score, health, playerName, quote, onToast }) {
  const blob = await generateQuizCertificateBlob({ score, health, playerName, quote });
  const filename = `TerraHeal-Zero-Waste-Quiz-${score}-of-10.png`;
  triggerBlobDownload(blob, filename);
  if (onToast) onToast('Certificate downloaded');
}

/**
 * Shares the TerraHeal Zero-Waste Quiz certificate with native file sharing
 * or falls back to downloading image and copying text to clipboard.
 *
 * @param {Object} params
 * @param {number} params.score
 * @param {number} params.health
 * @param {string} [params.playerName]
 * @param {string} params.quote
 * @param {Function} [params.onToast] - Toast notification callback
 */
export async function shareQuizCertificate({ score, health, playerName, quote, onToast }) {
  const blob = await generateQuizCertificateBlob({ score, health, playerName, quote });
  const filename = `TerraHeal-Zero-Waste-Quiz-${score}-of-10.png`;
  const quizUrl = `${window.location.origin}/quiz`;
  const shareText = `I scored ${score}/10 on the TerraHeal Zero-Waste Quiz and healed ${health}% of the Earth! Can you do better? ${quizUrl}`;

  const certFile = new File([blob], filename, { type: 'image/png' });

  // Check if browser supports sharing files
  const canShareFiles = typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [certFile] });

  if (canShareFiles && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'My TerraHeal certificate',
        text: shareText,
        files: [certFile],
      });
      return;
    } catch (err) {
      // AbortError indicates user cancelled native share dialog
      if (err.name === 'AbortError') {
        return;
      }
      console.warn('Native file share failed, falling back:', err);
    }
  }

  // Fallback for desktop or environments that don't support file sharing:
  // 1. Download certificate image
  triggerBlobDownload(blob, filename);

  // 2. Copy share text to clipboard
  try {
    await navigator.clipboard.writeText(shareText);
  } catch (_) {}

  // 3. Show instruction toast
  if (onToast) {
    onToast('Certificate saved. Share text copied. Attach the image in WhatsApp.');
  }
}
