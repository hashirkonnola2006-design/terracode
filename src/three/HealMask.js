import * as THREE from 'three';

class HealMaskManager {
  constructor() {
    this.width = 512;
    this.height = 256;
    this.canvas = null;
    this.ctx = null;
    this.texture = null;
    this.init();
  }

  init() {
    if (typeof document === 'undefined') return;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false });

    // Fill with black (0.0 heal = fully polluted)
    this.clear();

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.generateMipmaps = false;
    this.texture.needsUpdate = true;
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);
    if (this.texture) this.texture.needsUpdate = true;
  }

  fill() {
    if (!this.ctx) return;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.width, this.height);
    if (this.texture) this.texture.needsUpdate = true;
  }

  /**
   * Paint a soft radial heal circle at spherical coordinates (lat, lon)
   * @param {number} lat - Latitude in degrees (-90 to +90)
   * @param {number} lon - Longitude in degrees (-180 to +180)
   * @param {number} radiusNorm - Normalized radius (0.05 to 0.25)
   * @param {number} alpha - Opacity (0.0 to 1.0)
   */
  paintRegion(lat, lon, radiusNorm = 0.12, alpha = 1.0) {
    if (!this.ctx) return;

    // Convert lat/lon to Canvas equirectangular pixel coordinates
    // u = (lon + 180) / 360 -> x = u * width
    // v = (90 - lat) / 180  -> y = v * height
    const cx = ((lon + 180) / 360) * this.width;
    const cy = ((90 - lat) / 180) * this.height;
    const rPixels = radiusNorm * this.width;

    // Draw radial gradient centered at (cx, cy)
    const drawSpot = (x, y) => {
      const grad = this.ctx.createRadialGradient(x, y, 0, x, y, rPixels);
      grad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(0.55, `rgba(255, 255, 255, ${alpha * 0.75})`);
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

      this.ctx.save();
      this.ctx.globalCompositeOperation = 'screen'; // Additive blending for overlapping heals
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(x, y, rPixels, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    };

    drawSpot(cx, cy);

    // Handle horizontal texture wrap across international date line (-180 / +180)
    if (cx - rPixels < 0) {
      drawSpot(cx + this.width, cy);
    } else if (cx + rPixels > this.width) {
      drawSpot(cx - this.width, cy);
    }

    if (this.texture) {
      this.texture.needsUpdate = true;
    }
  }

  restoreRegions(regions = []) {
    this.clear();
    if (!regions || regions.length === 0) return;
    regions.forEach((r) => {
      this.paintRegion(r.lat, r.lon, r.radius || 0.12, r.alpha || 1.0);
    });
  }

  getTexture() {
    return this.texture;
  }
}

export const healMask = new HealMaskManager();
export default healMask;

