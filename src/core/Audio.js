// ============================================================================
// DANTE QUEST — Audio System (Genex SFX/Music + Web Audio Procedural Fallbacks)
// ============================================================================

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.musicAudio = null;
    this.sfxSlashAudio = null;
    this.enabled = true;
    this.musicVolume = 0.4;
    this.sfxVolume = 0.6;
    this.isInitialized = false;
    this.suspended = false;
    this.musicRequested = false;
    this.activeEffects = new Set();
    this.activeVoices = new Set();

    // Preload Genex generated assets
    this.loadGenexAssets();
  }

  init() {
    if (this.isInitialized) {
      if (!this.suspended && this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.isInitialized = true;
      }
    } catch (e) {
      console.warn('AudioContext not supported:', e);
    }
  }

  loadGenexAssets() {
    try {
      // Background battle music
      this.musicAudio = new Audio('/assets/dark-gothic-medieval-fantasy-survival-rp-cmvbl6pp.mp3');
      this.musicAudio.loop = true;
      this.musicAudio.volume = this.musicVolume;

      // Heavy Greatsword Slash
      this.sfxSlashAudio = new Audio('/assets/heavy-metal-greatsword-blade-slash-whoos-cmvbl6vb.mp3');
      this.sfxSlashAudio.volume = this.sfxVolume;

      // Fireball explosion
      this.sfxFireballAudio = new Audio('/assets/magic-fireball-explosion-blast-boom-impa-cmvbm8kr.mp3');
      this.sfxFireballAudio.volume = this.sfxVolume;

      // Zombie groan/snarl
      this.sfxZombieAudio = new Audio('/assets/undead-zombie-guttural-snarling-monster-cmvbm8s1.mp3');
      this.sfxZombieAudio.volume = this.sfxVolume * 0.7;

      // Lightning crackle
      this.sfxLightningAudio = new Audio('/assets/crackling-electric-lightning-strike-shoc-cmvbm8yc.mp3');
      this.sfxLightningAudio.volume = this.sfxVolume;
    } catch (err) {
      console.warn('Could not load Genex audio assets:', err);
    }
  }

  playMusic() {
    this.musicRequested = true;
    if (!this.enabled || this.suspended || !this.musicAudio) return;
    this.init();
    this.musicAudio.play().catch(e => {
      // Audio autoplay policy; will play on first click
    });
  }

  stopMusic() {
    this.musicRequested = false;
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.musicAudio?.pause();
      this.stopEffects();
      this.ctx?.suspend().catch(() => {});
    } else {
      if (!this.suspended) {
        this.init();
        if (this.musicRequested) this.playMusic();
      }
    }
    return this.enabled;
  }

  suspend() {
    this.suspended = true;
    this.musicAudio?.pause();
    this.stopEffects();
    this.ctx?.suspend().catch(() => {});
  }

  stopEffects() {
    for (const effect of this.activeEffects) effect.pause();
    this.activeEffects.clear();
    for (const voice of this.activeVoices) {
      try { voice.stop(); } catch { /* It may already have ended. */ }
    }
    this.activeVoices.clear();
  }

  resume() {
    this.suspended = false;
    if (!this.enabled) return;
    this.init();
    if (this.musicRequested) this.playMusic();
  }

  playEffect(audio, fallback = () => {}, volume = this.sfxVolume) {
    if (!this.enabled || this.suspended) return;
    if (!audio) return fallback();
    if (this.activeEffects.size >= 12) return;
    const effect = audio.cloneNode();
    effect.volume = volume;
    this.activeEffects.add(effect);
    effect.addEventListener('ended', () => this.activeEffects.delete(effect), { once: true });
    effect.play().catch(() => {
      this.activeEffects.delete(effect);
      if (this.enabled && !this.suspended) fallback();
    });
  }

  createVoice() {
    const voice = this.ctx.createOscillator();
    this.activeVoices.add(voice);
    voice.onended = () => this.activeVoices.delete(voice);
    return voice;
  }

  // --- Sound Effects ---

  playSlash() {
    this.playEffect(this.sfxSlashAudio, () => this.synthSlash());
  }

  playExplosion() {
    this.playEffect(this.sfxFireballAudio, () => this.synthExplosion());
  }

  playZombie() {
    this.playEffect(this.sfxZombieAudio, () => {}, this.sfxVolume * 0.7);
  }

  playLightning() {
    this.playEffect(this.sfxLightningAudio, () => this.synthCrit());
  }

  playHit() {
    if (!this.enabled || this.suspended) return;
    this.synthHit();
  }

  playCrit() {
    if (!this.enabled || this.suspended) return;
    this.synthCrit();
  }

  playLevelUp() {
    if (!this.enabled || this.suspended) return;
    this.synthLevelUp();
  }

  playGem() {
    if (!this.enabled || this.suspended) return;
    this.synthGem();
  }

  playDodge() {
    if (!this.enabled || this.suspended) return;
    this.synthDodge();
  }

  playBossRoar() {
    if (!this.enabled || this.suspended) return;
    this.synthBossRoar();
  }

  // --- Web Audio API Synth Generators (Instant zero-latency feedback) ---

  synthSlash() {
    if (!this.ctx || !this.enabled || this.suspended) return;
    try {
      const osc = this.createVoice();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(this.sfxVolume * 0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch (e) {}
  }

  synthHit() {
    if (!this.ctx || !this.enabled || this.suspended) return;
    try {
      const osc = this.createVoice();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(this.sfxVolume * 0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {}
  }

  synthCrit() {
    if (!this.ctx || !this.enabled || this.suspended) return;
    try {
      const osc = this.createVoice();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(this.sfxVolume * 0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.19);
    } catch (e) {}
  }

  synthGem() {
    if (!this.ctx || !this.enabled || this.suspended) return;
    try {
      const osc = this.createVoice();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(this.sfxVolume * 0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  synthLevelUp() {
    if (!this.ctx || !this.enabled || this.suspended) return;
    try {
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C, E, G, C, E
      notes.forEach((freq, idx) => {
        const osc = this.createVoice();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(this.sfxVolume * 0.4, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.26);
      });
    } catch (e) {}
  }

  synthDodge() {
    if (!this.ctx || !this.enabled || this.suspended) return;
    try {
      const osc = this.createVoice();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(this.sfxVolume * 0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.21);
    } catch (e) {}
  }

  synthBossRoar() {
    if (!this.ctx || !this.enabled || this.suspended) return;
    try {
      const osc = this.createVoice();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(this.sfxVolume * 0.7, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.85);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.9);
    } catch (e) {}
  }

  synthExplosion() {
    if (!this.ctx || !this.enabled || this.suspended) return;
    try {
      const osc = this.createVoice();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(this.sfxVolume * 0.6, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {}
  }
}

export const sound = new SoundSystem();
