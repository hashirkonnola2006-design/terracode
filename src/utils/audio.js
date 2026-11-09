/**
 * ═══════════════════════════════════════════════════════════════
 * ECOFUTURE — PROCEDURAL WEB AUDIO SYNTHESIZER & HAPTICS
 * ═══════════════════════════════════════════════════════════════
 * 100% self-contained Web Audio API sound generator.
 * Zero external audio assets required. Zero network latency.
 * Complies with browser autoplay policies (starts on first click).
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.droneGain = null;
    this.droneFilter = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneStarted = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.droneGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.droneGain.gain.setTargetAtTime(muted ? 0.0 : 0.08, now, 0.2);
    }
  }

  // Soft pop sound on collecting orbital trash (+1, +3)
  playPop(pitchMult = 1.0) {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 480 * pitchMult;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * 1.6, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.09);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (_) {}
  }

  // Sparkle chime when an emission source / smog cloud is converted to clean energy
  playConvert() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6 (radiant major chord)

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        const startTime = now + idx * 0.04;
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.38);
      });
    } catch (_) {}
  }

  // Organic wood / marimba sprout sound when planting trees
  playSprout() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [329.63, 440.0, 659.25]; // E4, A4, E5

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        const startTime = now + idx * 0.05;
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.30);
      });
    } catch (_) {}
  }

  // Gentle water whoosh sweep sound for ocean plastic
  playSweep() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.20);
    } catch (_) {}
  }

  // Triumphant fanfare chord when a mission or the game completes
  playMilestone() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        const startTime = now + idx * 0.06;
        gain.gain.setValueAtTime(0.16, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.70);
      });
    } catch (_) {}
  }

  // Continuous ambient space drone that evolves with cleanliness
  startAmbientDrone(cleanliness = 0) {
    if (this.droneStarted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneGain = this.ctx.createGain();

      // Deep harmonic root (A1 55Hz & E2 82.4Hz)
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55, now);

      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(82.4, now);

      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(140 + cleanliness * 600, now);

      this.droneGain.gain.setValueAtTime(this.isMuted ? 0.0 : 0.06, now);

      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      this.droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);

      this.droneOsc1.start(now);
      this.droneOsc2.start(now);
      this.droneStarted = true;
    } catch (_) {}
  }

  updateAmbientProgress(cleanliness) {
    if (!this.droneStarted && !this.isMuted) {
      this.startAmbientDrone(cleanliness);
    }
    if (this.ctx && this.droneFilter) {
      const now = this.ctx.currentTime;
      // Filter opens up as cleanliness increases from 140Hz to 1200Hz (crystal harmonic glow)
      const targetFreq = 140 + (cleanliness / 100) * 900;
      this.droneFilter.frequency.setTargetAtTime(targetFreq, now, 0.4);
    }
  }

  triggerHaptic(duration = 20) {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch (_) {}
    }
  }
}

export const sound = new SoundManager();
export default sound;

