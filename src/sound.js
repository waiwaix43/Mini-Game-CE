// EcoLink Industrial Park — Tactile Web Audio API Game Sound Effects (Zero External Assets)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  _ensureCtx() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _tone(freq, dur, type = 'sine', vol = 0.08, delay = 0, endFreq = null) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  click() {
    this._tone(520, 0.045, 'triangle', 0.05, 0, 380);
  }

  placeBuilding() {
    // Tactile concrete thud + warm confirmation pluck
    this._tone(130, 0.12, 'triangle', 0.12, 0, 62);
    this._tone(440, 0.09, 'sine', 0.06, 0.03, 554);
  }

  connectPipe() {
    // Liquid bubble-chime
    this._tone(392, 0.09, 'sine', 0.07, 0, 587);
    this._tone(587, 0.11, 'sine', 0.06, 0.06, 784);
  }

  connectRoad() {
    // Mechanical latch + upbeat tone
    this._tone(260, 0.07, 'triangle', 0.08, 0, 340);
    this._tone(523, 0.09, 'triangle', 0.05, 0.05, 659);
  }

  demolish() {
    this._tone(210, 0.12, 'sawtooth', 0.05, 0, 95);
  }

  error() {
    this._tone(220, 0.11, 'triangle', 0.07, 0, 165);
  }

  orderComplete() {
    // Warm pentatonic chime
    this._tone(523.25, 0.14, 'sine', 0.07, 0);
    this._tone(659.25, 0.16, 'sine', 0.07, 0.08);
    this._tone(783.99, 0.24, 'sine', 0.08, 0.16);
  }

  closedLoop() {
    // Celebratory harmonic chord
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => this._tone(n, 0.34, 'sine', 0.07, i * 0.07));
  }

  timeSkipStart() {
    // Rising time-warp whoosh + crisp chronometer chime
    this._tone(180, 0.32, 'sine', 0.07, 0, 720);
    this._tone(360, 0.28, 'triangle', 0.045, 0.04, 1080);
    this._tone(587.33, 0.16, 'sine', 0.05, 0.08, 880);
  }

  timeSkipTick(intensity = 0.5) {
    // Crisp accelerating chronometer tick
    const baseFreq = 540 + Math.max(0, Math.min(1, intensity)) * 420;
    this._tone(baseFreq, 0.032, 'triangle', 0.032, 0, baseFreq * 0.82);
  }

  timeSkipComplete() {
    // Bright resolution chord when time hits 00:00
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
    notes.forEach((n, i) => this._tone(n, 0.42, 'sine', 0.065, i * 0.045));
  }
}

export const sfx = new SoundEngine();
