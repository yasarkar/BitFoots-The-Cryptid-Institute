"use client";

/**
 * Procedural Web Audio Engine for Bitfoots Mini-App
 * Provides real-time Sonar SFX, Discovery Cues, and Generative Living Forest Ambience
 * without requiring external heavy audio assets.
 */

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;

  // Ambience nodes
  private isAmbienceRunning = false;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private ambienceLfo: OscillatorNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;

  // Cached settings
  private volume: number = 80; // 0 - 100
  private soundEnabled: boolean = true;
  private ambienceEnabled: boolean = true;
  private lastPingTime: number = 0;

  private init() {
    if (this.ctx || typeof window === "undefined") return;

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();

      // Master Gain: controls overall application volume
      this.masterGain = this.ctx.createGain();
      const normVol = (this.volume / 100);
      this.masterGain.gain.setValueAtTime(normVol * normVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.soundEnabled ? 1 : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Ambience Gain Bus
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.ambienceGain.connect(this.masterGain);

      // If ambience was requested before init, start it now
      if (this.ambienceEnabled && this.volume > 0) {
        this.startAmbience();
      }
    } catch (e) {
      console.warn("AudioManager initialization deferred or failed:", e);
    }
  }

  private ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Updates settings reactively from useGameSettings
   */
  public updateSettings(settings: {
    volume: number;
    soundEnabled: boolean;
    ambienceEnabled: boolean;
  }) {
    this.volume = Math.max(0, Math.min(100, settings.volume));
    this.soundEnabled = settings.soundEnabled;
    this.ambienceEnabled = settings.ambienceEnabled;

    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.ambienceGain) {
      // If initialized on demand, state is stored
      return;
    }

    const now = this.ctx.currentTime;
    const normVol = this.volume / 100;
    // Perceptual quadratic volume curve
    const targetMasterGain = normVol * normVol;

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(targetMasterGain, now, 0.05);

    // SFX toggle
    this.sfxGain.gain.cancelScheduledValues(now);
    this.sfxGain.gain.setTargetAtTime(this.soundEnabled ? 1 : 0, now, 0.05);

    // Ambience management
    if (this.ambienceEnabled && this.volume > 0) {
      if (!this.isAmbienceRunning) {
        this.startAmbience();
      } else {
        this.ambienceGain.gain.cancelScheduledValues(now);
        this.ambienceGain.gain.setTargetAtTime(0.35, now, 0.5);
      }
    } else {
      if (this.isAmbienceRunning) {
        this.stopAmbience();
      }
    }
  }

  /**
   * Generates a procedural living forest wind & atmospheric cryptid hum soundscape
   */
  private startAmbience() {
    if (!this.ctx || !this.ambienceGain || this.isAmbienceRunning) return;

    try {
      this.isAmbienceRunning = true;
      const now = this.ctx.currentTime;

      // 1. Create Pink/Brownish Noise Buffer for wind
      const bufferSize = this.ctx.sampleRate * 3;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.1;
        b2 = 0.85 * b2 + white * 0.2;
        output[i] = (b0 + b1 + b2) * 0.15;
      }

      this.ambienceSource = this.ctx.createBufferSource();
      this.ambienceSource.buffer = noiseBuffer;
      this.ambienceSource.loop = true;

      // 2. BiquadFilter (Lowpass) modulated by LFO to simulate swirling forest gusts
      this.ambienceFilter = this.ctx.createBiquadFilter();
      this.ambienceFilter.type = "lowpass";
      this.ambienceFilter.frequency.setValueAtTime(320, now);
      this.ambienceFilter.Q.setValueAtTime(1.8, now);

      // 3. LFO (Low Frequency Oscillator) for wind variation
      this.ambienceLfo = this.ctx.createOscillator();
      this.ambienceLfo.frequency.setValueAtTime(0.12, now); // Slow wind swell cycle (~8 sec)
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(180, now);
      this.ambienceLfo.connect(lfoGain);
      lfoGain.connect(this.ambienceFilter.frequency);

      this.ambienceSource.connect(this.ambienceFilter);
      this.ambienceFilter.connect(this.ambienceGain);

      // 4. Subtle Mysterious Drone (warm sub-tones for eerie atmosphere)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = "sine";
      this.droneOsc1.frequency.setValueAtTime(65.41, now); // C2

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = "sine";
      this.droneOsc2.frequency.setValueAtTime(98.0, now); // G2

      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.08, now);

      this.droneOsc1.connect(droneGain);
      this.droneOsc2.connect(droneGain);
      droneGain.connect(this.ambienceGain);

      // Start all sound generators
      this.ambienceSource.start(now);
      this.ambienceLfo.start(now);
      this.droneOsc1.start(now);
      this.droneOsc2.start(now);

      // Smooth fade in over 1.2 seconds
      this.ambienceGain.gain.cancelScheduledValues(now);
      this.ambienceGain.gain.setValueAtTime(0, now);
      this.ambienceGain.gain.linearRampToValueAtTime(0.35, now + 1.2);
    } catch (e) {
      console.warn("Could not start ambience engine:", e);
      this.isAmbienceRunning = false;
    }
  }

  /**
   * Smoothly fades out and cleans up ambience nodes
   */
  private stopAmbience() {
    if (!this.ctx || !this.ambienceGain || !this.isAmbienceRunning) return;

    this.isAmbienceRunning = false;
    const now = this.ctx.currentTime;

    // Smooth fade out
    this.ambienceGain.gain.cancelScheduledValues(now);
    this.ambienceGain.gain.linearRampToValueAtTime(0.001, now + 0.6);

    setTimeout(() => {
      try {
        this.ambienceSource?.stop();
        this.ambienceLfo?.stop();
        this.droneOsc1?.stop();
        this.droneOsc2?.stop();

        this.ambienceSource?.disconnect();
        this.ambienceLfo?.disconnect();
        this.droneOsc1?.disconnect();
        this.droneOsc2?.disconnect();
        this.ambienceFilter?.disconnect();

        this.ambienceSource = null;
        this.ambienceLfo = null;
        this.droneOsc1 = null;
        this.droneOsc2 = null;
        this.ambienceFilter = null;
      } catch {
        // Safe cleanup ignore
      }
    }, 650);
  }

  // =========================================================================
  // SOUND EFFECTS (SFX)
  // =========================================================================

  /**
   * High-tech Sonar Ping / Footprint Anomaly Discovery
   */
  public playFootprintCollect() {
    if (!this.soundEnabled || this.volume === 0) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Primary crystalline sine chirp
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // E6

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);

    // Subtle resonance echo
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(1760, now + 0.04);
    subGain.gain.setValueAtTime(0.15, now + 0.04);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(now + 0.04);
    subOsc.stop(now + 0.26);
  }

  /**
   * Secret Cryptid Silhouette Spotted - Eerie Harmonious Chime
   */
  public playSecretDiscovered() {
    if (!this.soundEnabled || this.volume === 0) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const noteTime = now + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.36);
    });
  }

  /**
   * Correct Lore Anomaly Answer - Ascending Major Triad
   */
  public playLoreCorrect() {
    if (!this.soundEnabled || this.volume === 0) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.31);
    });
  }

  /**
   * Incorrect Lore Anomaly Answer - Low Frequency Alert Buzz
   */
  public playLoreIncorrect() {
    if (!this.soundEnabled || this.volume === 0) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.25);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * Chapter Completed / Mission Extraction Victory Fanfare
   */
  public playChapterComplete() {
    if (!this.soundEnabled || this.volume === 0) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const melody = [
      { f: 440, d: 0.12 },  // A4
      { f: 554.37, d: 0.12 }, // C#5
      { f: 659.25, d: 0.14 }, // E5
      { f: 880, d: 0.35 },    // A5
    ];

    let offset = 0;
    melody.forEach((note) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + note.d + 0.05);
      offset += note.d * 0.9;
    });
  }

  /**
   * Expedition Launched / Radar Power Up
   */
  public playGameStart() {
    if (!this.soundEnabled || this.volume === 0) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * UI Click / Subtle Sonar Tap (used for slider test and button feedback)
   */
  public playUiClick() {
    if (!this.soundEnabled || this.volume === 0) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.04);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Sector Roulette Dial: mechanical detent tick while the index arm spins
   */
  public playRouletteTick() {
    if (!this.soundEnabled || this.volume === 0) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.setValueAtTime(1.4, now);

    osc.type = "square";
    osc.frequency.setValueAtTime(1180, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.045);

    gain.gain.setValueAtTime(0.075, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Sector Roulette Dial: satisfying two-step lock when the arm settles on a sector
   */
  public playRouletteLock() {
    if (!this.soundEnabled || this.volume === 0) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    [660, 990].forEach((frequency, index) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = now + index * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(frequency, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.17);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.19);
    });
  }

  /**
   * Sector Roulette Dial: low refusal buzz for classified / sealed sectors
   */
  public playRouletteDenied() {
    if (!this.soundEnabled || this.volume === 0) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, now);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(196, now);
    osc.frequency.linearRampToValueAtTime(118, now + 0.22);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playVolumeTestPing() {
    if (!this.soundEnabled || this.volume === 0) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.04);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }
}

// Singleton export
export const audioManager = new AudioManager();
