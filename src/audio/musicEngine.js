// ═══════════════════════════════════════════════════════════════
// TERRAHEAL — PROCEDURAL "PIXEL x SPACE" CHIPTUNE AUDIO ENGINE
// ═══════════════════════════════════════════════════════════════
// 100% Procedural Web Audio API — Zero external audio files.
// Dreamy, space chiptune ambience: Mass Effect synth warmth meets NES/Game Boy arpeggios.
// Features: Lookahead scheduling, adaptive layers, healing-linked brightness,
// full effects chain (reverb, delay, compressor), and pixel UI sound effects.

// ═══════════════════════════════════════════════════════════════
// USER CONFIGURATION: BPM, SCALES & CHORD PROGRESSIONS
// (Edit these constants to customize the soundtrack)
// ═══════════════════════════════════════════════════════════════

export const MUSIC_CONFIG = {
  // Tempo in Beats Per Minute
  BPM: 104,

  // Default gain levels (0.0 to 1.0)
  DEFAULT_MUSIC_VOLUME: 0.25,
  DEFAULT_SFX_VOLUME: 0.70,

  // Root frequencies in Hz
  NOTES: {
    C2: 65.41, D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, B2: 123.47,
    C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, B3: 246.94,
    C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, B4: 493.88,
    C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, Bb5: 932.33, B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760.00,
  },

  // Chords for each section of the site:
  // 1. HERO (Dark, lonely, atmospheric D Dorian / A Minor)
  HERO_CHORDS: [
    { name: 'Dm9',   root: 73.42,  pad: [146.83, 220.00, 261.63, 329.63], arp: [146.83, 220.00, 261.63, 329.63, 440.00, 523.25] },
    { name: 'Bbmaj7',root: 58.27,  pad: [116.54, 174.61, 220.00, 293.66], arp: [116.54, 174.61, 220.00, 293.66, 349.23, 440.00] },
    { name: 'Cadd9', root: 65.41,  pad: [130.81, 196.00, 293.66, 329.63], arp: [130.81, 196.00, 293.66, 329.63, 392.00, 587.33] },
    { name: 'Am7',   root: 55.00,  pad: [110.00, 164.81, 261.63, 293.66], arp: [110.00, 164.81, 261.63, 293.66, 440.00, 523.25] },
  ],

  // 2. PILLARS (Transitioning toward resolution, warm & thoughtful)
  PILLARS_CHORDS: [
    { name: 'Dm7',   root: 73.42,  pad: [146.83, 220.00, 261.63, 349.23], arp: [146.83, 220.00, 261.63, 349.23, 440.00, 523.25] },
    { name: 'Fmaj7', root: 87.31,  pad: [174.61, 220.00, 261.63, 329.63], arp: [174.61, 220.00, 261.63, 329.63, 440.00, 523.25] },
    { name: 'Gsus4', root: 98.00,  pad: [196.00, 261.63, 293.66, 392.00], arp: [196.00, 261.63, 293.66, 392.00, 523.25, 587.33] },
    { name: 'Cmaj7', root: 65.41,  pad: [130.81, 196.00, 246.94, 329.63], arp: [130.81, 196.00, 246.94, 329.63, 392.00, 493.88] },
  ],

  // 3. PLAY GAMES (Hopeful, triumphant, bright F Lydian / C Major)
  PLAY_CHORDS: [
    { name: 'Fmaj9', root: 87.31,  pad: [174.61, 220.00, 261.63, 329.63], arp: [174.61, 261.63, 329.63, 392.00, 523.25, 659.25] },
    { name: 'Gadd9', root: 98.00,  pad: [196.00, 246.94, 293.66, 392.00], arp: [196.00, 293.66, 392.00, 493.88, 587.33, 783.99] },
    { name: 'Em7',   root: 82.41,  pad: [164.81, 196.00, 246.94, 329.63], arp: [164.81, 246.94, 329.63, 392.00, 493.88, 659.25] },
    { name: 'Am7',   root: 110.00, pad: [220.00, 261.63, 329.63, 392.00], arp: [220.00, 261.63, 329.63, 392.00, 523.25, 659.25] },
  ],

  // High sparkle star frequencies
  SPARKLE_NOTES: [587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00],
};

class ProceduralMusicEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.isPlaying = false;
    this.hasUserInteracted = false;

    // Volume states (restored from localStorage)
    this.musicVolume = MUSIC_CONFIG.DEFAULT_MUSIC_VOLUME;
    this.sfxVolume = MUSIC_CONFIG.DEFAULT_SFX_VOLUME;
    this.savedMuteState = true;

    // Mood & Adaptive state
    this.activeSection = 'hero'; // 'hero' | 'pillars' | 'play' | 'game'
    this.healRatio = 0.0;        // 0.0 to 1.0
    this.duckingFactor = 1.0;    // Dims music slightly when game sound effects trigger

    // Scheduler state
    this.schedulerTimer = null;
    this.currentStep = 0;        // 16th-note step counter
    this.nextNoteTime = 0.0;
    this.currentChordIndex = 0;
    this.barsPerChord = 2;       // 32 16th-notes per chord (~4.6 seconds at 104 BPM)

    // Master nodes
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.masterFilter = null;
    this.compressor = null;
    this.delayNode = null;
    this.delayGain = null;
    this.reverbConvolver = null;

    // Sub-layer gains for adaptive mixing
    this.padGain = null;
    this.arpGain = null;
    this.bassGain = null;
    this.drumsGain = null;
    this.sparkleGain = null;

    // Active pad oscillators to allow smooth crossfading
    this.activePadOscs = [];

    // State listener callbacks
    this.listeners = new Set();

    this.loadPersistedSettings();
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION & AUTOPLAY COMPLIANCE
  // ═══════════════════════════════════════════════════════════════

  loadPersistedSettings() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('terraheal_audio_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.muted === 'boolean') this.isMuted = parsed.muted;
        if (typeof parsed.musicVolume === 'number') this.musicVolume = parsed.musicVolume;
        if (typeof parsed.sfxVolume === 'number') this.sfxVolume = parsed.sfxVolume;
      }
    } catch (_) {}
  }

  saveSettings() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('terraheal_audio_settings', JSON.stringify({
        muted: this.isMuted,
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
      }));
    } catch (_) {}
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master Compressor to prevent any clipping
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.01, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      // Master Output Filter (Warm analog roll-off)
      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
      this.masterFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

      // Master Gains
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.musicGain = this.ctx.createGain();
      const initialMusicVol = this.isMuted ? 0.0 : this.musicVolume;
      this.musicGain.gain.setValueAtTime(initialMusicVol, this.ctx.currentTime);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.isMuted ? 0.0 : this.sfxVolume, this.ctx.currentTime);

      // Layer Gains
      this.padGain = this.ctx.createGain();
      this.padGain.gain.setValueAtTime(0.70, this.ctx.currentTime);

      this.arpGain = this.ctx.createGain();
      this.arpGain.gain.setValueAtTime(0.20, this.ctx.currentTime);

      this.bassGain = this.ctx.createGain();
      this.bassGain.gain.setValueAtTime(0.40, this.ctx.currentTime);

      this.drumsGain = this.ctx.createGain();
      this.drumsGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.sparkleGain = this.ctx.createGain();
      this.sparkleGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

      // Space Delay (3/16th dotted feedback delay)
      this.delayNode = this.ctx.createDelay();
      const beatSec = 60 / MUSIC_CONFIG.BPM;
      this.delayNode.delayTime.setValueAtTime(beatSec * 0.75, this.ctx.currentTime);

      this.delayGain = this.ctx.createGain();
      this.delayGain.gain.setValueAtTime(0.32, this.ctx.currentTime);

      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);

      // Routing: Delay Loop
      this.delayNode.connect(delayFilter);
      delayFilter.connect(this.delayGain);
      this.delayGain.connect(this.delayNode);
      this.delayGain.connect(this.musicGain);

      // Layer -> Music Master
      this.padGain.connect(this.musicGain);
      this.arpGain.connect(this.musicGain);
      this.arpGain.connect(this.delayNode);
      this.bassGain.connect(this.musicGain);
      this.drumsGain.connect(this.musicGain);
      this.sparkleGain.connect(this.delayNode);
      this.sparkleGain.connect(this.musicGain);

      // Procedural Space Reverb Impulse
      this.setupReverb();

      // Master Pipeline
      this.musicGain.connect(this.masterFilter);
      this.sfxGain.connect(this.compressor);
      this.masterFilter.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Setup Tab Visibility Listener
      this.setupVisibilityListener();
    } catch (e) {
      console.warn('Web Audio initialization error:', e);
    }
  }

  // Generate lightweight procedural space reverb impulse (saves 0 bytes of external assets)
  setupReverb() {
    if (!this.ctx) return;
    try {
      const rate = this.ctx.sampleRate;
      const length = rate * 2.2; // 2.2 seconds space tail
      const decay = 2.4;
      const impulse = this.ctx.createBuffer(2, length, rate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
        const factor = Math.exp(-i / (rate * (decay / 4)));
        left[i] = (Math.random() * 2 - 1) * factor;
        right[i] = (Math.random() * 2 - 1) * factor;
      }

      this.reverbConvolver = this.ctx.createConvolver();
      this.reverbConvolver.buffer = impulse;

      const reverbGain = this.ctx.createGain();
      reverbGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

      this.padGain.connect(this.reverbConvolver);
      this.sparkleGain.connect(this.reverbConvolver);
      this.reverbConvolver.connect(reverbGain);
      reverbGain.connect(this.musicGain);
    } catch (_) {}
  }

  setupVisibilityListener() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.ctx && this.ctx.state === 'running') {
          this.ctx.suspend().catch(() => {});
        }
      } else {
        if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
          this.ctx.resume().catch(() => {});
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // USER INTERACTION HOOK (BROWSER AUTOPLAY COMPLIANCE)
  // ═══════════════════════════════════════════════════════════════

  handleFirstInteraction() {
    if (this.hasUserInteracted) return;
    this.hasUserInteracted = true;
    this.init();
    if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
      this.ctx.resume().catch(() => {});
    }
    // If user previously left sound unmuted in localStorage, start playing
    if (!this.isMuted && !this.isPlaying) {
      this.start();
    }
    this.notify();
  }

  // ═══════════════════════════════════════════════════════════════
  // CONTROLS & API
  // ═══════════════════════════════════════════════════════════════

  start() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // Lookahead timer (checks every 25ms and schedules notes up to 100ms in advance)
    this.schedulerTimer = setInterval(() => this.scheduleLookahead(), 25);
    this.applyAdaptiveMood();
    this.notify();
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.fadePadOut();
    this.notify();
  }

  toggle() {
    this.handleFirstInteraction();
    const nextMuted = !this.isMuted;
    this.setMuted(nextMuted);
    return !nextMuted;
  }

  setMuted(muted) {
    this.isMuted = muted;
    this.saveSettings();

    if (!this.ctx) {
      this.notify();
      return;
    }

    const now = this.ctx.currentTime;
    if (muted) {
      // 0.5s smooth fade out
      this.musicGain.gain.setTargetAtTime(0.0001, now, 0.15);
      this.sfxGain.gain.setTargetAtTime(0.0001, now, 0.15);
    } else {
      if (!this.isPlaying) this.start();
      // 0.5s smooth fade in
      this.musicGain.gain.setTargetAtTime(this.musicVolume * this.duckingFactor, now, 0.18);
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, now, 0.18);
    }
    this.notify();
  }

  setVolume(musicVol = 0.25, sfxVol = 0.70) {
    this.musicVolume = Math.max(0.0, Math.min(1.0, musicVol));
    this.sfxVolume = Math.max(0.0, Math.min(1.0, sfxVol));
    this.saveSettings();

    if (this.ctx && !this.isMuted) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.setTargetAtTime(this.musicVolume * this.duckingFactor, now, 0.08);
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, now, 0.08);
    }
    this.notify();
  }

  setMusicVolume(vol) {
    this.setVolume(vol, this.sfxVolume);
  }

  setSfxVolume(vol) {
    this.setVolume(this.musicVolume, vol);
  }

  // ═══════════════════════════════════════════════════════════════
  // ADAPTIVE MUSIC & STORYTELLING
  // ═══════════════════════════════════════════════════════════════

  setSection(sectionName) {
    if (this.activeSection === sectionName) return;
    this.activeSection = sectionName;
    this.applyAdaptiveMood();
  }

  setHealAmount(healthPercent) {
    const ratio = Math.max(0.0, Math.min(1.0, healthPercent / 100));
    if (Math.abs(this.healRatio - ratio) < 0.02) return;
    this.healRatio = ratio;
    this.applyAdaptiveMood();
  }

  applyAdaptiveMood() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const timeConstant = 0.8; // Smooth 2.5s crossfade curve

    let targetPad = 0.70;
    let targetArp = 0.16;
    let targetBass = 0.35;
    let targetDrums = 0.0;
    let targetCutoff = 1200 + this.healRatio * 1800; // Opens up as planet heals

    if (this.activeSection === 'hero' || this.activeSection === 'damage') {
      // Hero & Damage: Pad & sparkles dominate, dark, slow, contemplative
      targetPad = 0.78;
      targetArp = 0.08;
      targetBass = 0.18;
      targetDrums = 0.0;
      targetCutoff = 900 + this.healRatio * 1100;
    } else if (this.activeSection === 'pillars') {
      // Pillars: Arpeggio and bass fade in, thoughtful momentum, warmer chords
      targetPad = 0.60;
      targetArp = 0.24;
      targetBass = 0.38;
      targetDrums = 0.16; // Soft hi-hat
      targetCutoff = 1600 + this.healRatio * 1800;
    } else if (this.activeSection === 'play') {
      // Play Games: Full energy with percussion, hopeful, triumphant
      targetPad = 0.50;
      targetArp = 0.32;
      targetBass = 0.44;
      targetDrums = 0.45; // Full light kick + hi-hat groove
      targetCutoff = 2400 + this.healRatio * 3200;
    } else if (this.activeSection === 'game') {
      // Inside active games: Ducked, loop-friendly, leaves room for sound effects
      targetPad = 0.40;
      targetArp = 0.18;
      targetBass = 0.28;
      targetDrums = 0.22;
      targetCutoff = 1400 + this.healRatio * 1600;
    }

    if (this.padGain) this.padGain.gain.setTargetAtTime(targetPad, now, timeConstant);
    if (this.arpGain) this.arpGain.gain.setTargetAtTime(targetArp, now, timeConstant);
    if (this.bassGain) this.bassGain.gain.setTargetAtTime(targetBass, now, timeConstant);
    if (this.drumsGain) this.drumsGain.gain.setTargetAtTime(targetDrums, now, timeConstant);
    if (this.masterFilter) this.masterFilter.frequency.setTargetAtTime(targetCutoff, now, timeConstant);
  }

  getCurrentChordList() {
    if (this.activeSection === 'play') {
      return MUSIC_CONFIG.PLAY_CHORDS;
    } else if (this.activeSection === 'pillars') {
      return MUSIC_CONFIG.PILLARS_CHORDS;
    }
    return MUSIC_CONFIG.HERO_CHORDS;
  }

  // ═══════════════════════════════════════════════════════════════
  // LOOKAHEAD SCHEDULER (PRECISE 16TH-NOTE SEQUENCING)
  // ═══════════════════════════════════════════════════════════════

  scheduleLookahead() {
    if (!this.ctx || !this.isPlaying) return;
    const stepDuration = (60 / MUSIC_CONFIG.BPM) / 4; // 16th-note duration (~0.144s)
    const scheduleAheadTime = 0.12;

    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime, stepDuration);
      this.nextNoteTime += stepDuration;
      this.currentStep++;
    }
  }

  scheduleStep(step, time, stepDuration) {
    const chordList = this.getCurrentChordList();
    const chordDurationSteps = this.barsPerChord * 16;
    const chordIdx = Math.floor(step / chordDurationSteps) % chordList.length;
    const chord = chordList[chordIdx];
    const stepInChord = step % chordDurationSteps;
    const stepInBar = step % 16;

    // 1. Pad Trigger (Triggers at start of each chord with long crossfade)
    if (stepInChord === 0) {
      this.triggerPadChord(chord, time, chordDurationSteps * stepDuration);
    }

    // 2. Bass (Root on beat 1, Fifth on beat 3)
    if (stepInBar === 0) {
      this.triggerBass(chord.root, time, stepDuration * 3.5);
    } else if (stepInBar === 8) {
      this.triggerBass(chord.root * 1.5, time, stepDuration * 3.5); // Fifth
    }

    // 3. Chiptune Arpeggio (Fast 16th-notes)
    if (this.activeSection !== 'hero' || step % 2 === 0) {
      // In hero section, play 8th-notes to stay dreamy; elsewhere, full 16ths
      const arpNotes = chord.arp;
      // Classic ascending/descending ping-pong arpeggiator pattern
      const pattern = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 4, 3, 5, 4];
      const noteIdx = pattern[stepInBar % pattern.length] % arpNotes.length;
      const freq = arpNotes[noteIdx];
      this.triggerArp(freq, time, stepDuration * 0.85);
    }

    // 4. Percussion
    if (this.activeSection === 'play' || this.activeSection === 'game') {
      // Soft kick on beat 1 and beat 3
      if (stepInBar === 0 || stepInBar === 8) {
        this.triggerKick(time);
      }
      // Light hi-hat on 8th note upbeats (steps 2, 6, 10, 14)
      if (stepInBar % 4 === 2) {
        this.triggerHiHat(time, 0.03);
      }
    } else if (this.activeSection === 'pillars') {
      // Ultra-gentle hi-hat on beat 2 and 4
      if (stepInBar === 4 || stepInBar === 12) {
        this.triggerHiHat(time, 0.02);
      }
    }

    // 5. Star Sparkle Twinkle (Probabilistic occasional star blip)
    if (Math.random() < 0.06 + this.healRatio * 0.08) {
      const sparkleNotes = MUSIC_CONFIG.SPARKLE_NOTES;
      const freq = sparkleNotes[Math.floor(Math.random() * sparkleNotes.length)];
      this.triggerSparkle(freq, time + Math.random() * 0.04);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // INSTRUMENT SYNTHESIZERS
  // ═══════════════════════════════════════════════════════════════

  // 1. Pad: Detuned triangle + soft saw through lowpass
  triggerPadChord(chord, time, duration) {
    if (!this.ctx || !this.padGain) return;
    this.fadePadOut(time);

    const padNotes = chord.pad;
    const chordOscs = [];

    padNotes.forEach((freq, idx) => {
      // Detuned oscillator pair for lush space width
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq * 1.0025, time); // Subtle detune

      // Soft envelope (1.2s attack, sustained, 2.0s release)
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.08 / padNotes.length, time + 1.2);
      gain.gain.setValueAtTime(0.08 / padNotes.length, time + duration - 1.5);
      gain.gain.linearRampToValueAtTime(0.0001, time + duration + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.padGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration + 0.6);
      osc2.stop(time + duration + 0.6);

      // Memory cleanup
      osc1.onended = () => { osc1.disconnect(); gain.disconnect(); };
      osc2.onended = () => { osc2.disconnect(); };

      chordOscs.push({ gain, osc1, osc2, stopTime: time + duration + 0.6 });
    });

    this.activePadOscs = chordOscs;
  }

  fadePadOut(time) {
    const fadeTime = time || (this.ctx ? this.ctx.currentTime : 0);
    this.activePadOscs.forEach(({ gain, osc1, osc2 }) => {
      try {
        gain.gain.cancelScheduledValues(fadeTime);
        gain.gain.setTargetAtTime(0.0001, fadeTime, 0.4);
        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch (_) {}
        }, 1000);
      } catch (_) {}
    });
    this.activePadOscs = [];
  }

  // 2. Chiptune Arpeggio: Square wave with short envelope & vibrato
  triggerArp(freq, time, duration) {
    if (!this.ctx || !this.arpGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);

      // Gentle lowpass to keep chiptune warm rather than harsh
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800 + this.healRatio * 2000, time);

      // Fast chiptune pluck envelope
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.arpGain);

      osc.start(time);
      osc.stop(time + duration + 0.02);

      osc.onended = () => {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    } catch (_) {}
  }

  // 3. Bass: Triangle wave playing root-fifths
  triggerBass(freq, time, duration) {
    if (!this.ctx || !this.bassGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.18, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.bassGain);

      osc.start(time);
      osc.stop(time + duration + 0.02);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch (_) {}
  }

  // 4. Percussion: Soft sine pitch-drop kick
  triggerKick(time) {
    if (!this.ctx || !this.drumsGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, time);
      osc.frequency.exponentialRampToValueAtTime(36, time + 0.08);

      gain.gain.setValueAtTime(0.24, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      osc.connect(gain);
      gain.connect(this.drumsGain);

      osc.start(time);
      osc.stop(time + 0.14);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch (_) {}
  }

  // Percussion: Filtered white noise hi-hat
  triggerHiHat(time, vol = 0.03) {
    if (!this.ctx || !this.drumsGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.8;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.drumsGain);

      noise.start(time);
      noise.stop(time + 0.04);

      noise.onended = () => {
        noise.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    } catch (_) {}
  }

  // 5. Star Twinkle Sparkle: High sine blip through space delay
  triggerSparkle(freq, time) {
    if (!this.ctx || !this.sparkleGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

      osc.connect(gain);
      gain.connect(this.sparkleGain);

      osc.start(time);
      osc.stop(time + 0.20);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch (_) {}
  }

  // ═══════════════════════════════════════════════════════════════
  // PIXEL UI SOUND EFFECTS (ROUTED THROUGH SEPARATE SFX GAIN)
  // ═══════════════════════════════════════════════════════════════

  // Button hover: Very short soft blip
  playHover() {
    if (this.isMuted) return;
    this.handleFirstInteraction();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.035);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.045);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    } catch (_) {}
  }

  // Button click: Short two-note rising "coin" blip
  playClick() {
    if (this.isMuted) return;
    this.handleFirstInteraction();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.038); // E6

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.09);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    } catch (_) {}
  }

  // Section change: Soft whoosh using filtered noise
  playSectionWhoosh() {
    if (this.isMuted) return;
    this.handleFirstInteraction();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.22;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(260, now + 0.22);
      filter.Q.setValueAtTime(1.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.23);
      noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
    } catch (_) {}
  }

  // Game success: Rising 3-note arpeggio (C5 -> E5 -> G5)
  playSuccess() {
    if (this.isMuted) return;
    this.handleFirstInteraction();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        const t = now + idx * 0.05;
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.15);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      });
    } catch (_) {}
  }

  // Game fail: Short descending buzz
  playFail() {
    if (this.isMuted) return;
    this.handleFirstInteraction();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.14);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.18);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    } catch (_) {}
  }

  // Backwards-compatible game SFX
  playPop(pitchMult = 1.0) {
    if (this.isMuted) return;
    this.handleFirstInteraction();
    if (!this.ctx || !this.sfxGain) return;
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
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.12);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    } catch (_) {}
  }

  playConvert() {
    if (this.isMuted) return;
    this.handleFirstInteraction();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [587.33, 739.99, 880.0, 1174.66];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        const startTime = now + idx * 0.04;
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startTime);
        osc.stop(startTime + 0.38);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      });
    } catch (_) {}
  }

  playSprout() {
    if (this.isMuted) return;
    this.handleFirstInteraction();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [329.63, 440.0, 659.25];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        const startTime = now + idx * 0.05;
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startTime);
        osc.stop(startTime + 0.30);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      });
    } catch (_) {}
  }

  playSweep() {
    this.playSectionWhoosh();
  }

  playMilestone() {
    if (this.isMuted) return;
    this.handleFirstInteraction();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        const startTime = now + idx * 0.06;
        gain.gain.setValueAtTime(0.16, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startTime);
        osc.stop(startTime + 0.70);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      });
    } catch (_) {}
  }

  playCollect() {
    this.playPop(1.15);
  }

  updateAmbientProgress(cleanliness) {
    this.setHealAmount(cleanliness);
  }

  triggerHaptic(duration = 20) {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch (_) {}
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // STATE SUBSCRIPTIONS & REACT SYNC
  // ═══════════════════════════════════════════════════════════════

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  getState() {
    return {
      isMuted: this.isMuted,
      isPlaying: this.isPlaying,
      hasUserInteracted: this.hasUserInteracted,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      activeSection: this.activeSection,
      healRatio: this.healRatio,
    };
  }
}

export const musicEngine = new ProceduralMusicEngine();
export const sound = musicEngine; // Seamless drop-in replacement for existing sound imports
export default musicEngine;

