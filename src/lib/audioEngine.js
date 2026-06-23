// Web Audio Engine — manages multiple concurrent audio layers
// Uses Web Audio API for mixing, fading, and independent volume control

class AudioEngine {
  constructor() {
    this.activeSounds = new Map(); // id -> { source, gainNode, isPlaying, volume }
    this.masterVolume = 0.8;
    this.listeners = new Set();
    this.audioContext = null;
    this.masterGain = null;
  }

  _ensureContext() {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  getState() {
    const sounds = {};
    this.activeSounds.forEach((val, key) => {
      sounds[key] = { isPlaying: val.isPlaying, volume: val.volume, title: val.title };
    });
    return { activeSounds: sounds, masterVolume: this.masterVolume };
  }

  // Generate a tone-based sound using Web Audio API oscillators
  _generateTone(soundId) {
    this._ensureContext();
    const ctx = this.audioContext;
    
    // Different tone parameters for different sound types
    const toneMap = {
      // Atmosphere — drones and ambient
      'rain_heavy': { type: 'brown', freq: 200, filterFreq: 400 },
      'rain_light': { type: 'brown', freq: 300, filterFreq: 600 },
      'wind_howling': { type: 'brown', freq: 100, filterFreq: 200 },
      'wind_gentle': { type: 'pink', freq: 150, filterFreq: 300 },
      'thunder': { type: 'brown', freq: 50, filterFreq: 100 },
      'ocean_waves': { type: 'brown', freq: 80, filterFreq: 250 },
      'fire_crackling': { type: 'brown', freq: 500, filterFreq: 2000 },
      'clock_ticking': { type: 'pulse', freq: 2, filterFreq: 800 },
      'dripping_water': { type: 'pulse', freq: 0.5, filterFreq: 2000 },
      'creaking_wood': { type: 'brown', freq: 60, filterFreq: 150 },
      'footsteps_slow': { type: 'pulse', freq: 0.8, filterFreq: 500 },
      'chains_rattling': { type: 'brown', freq: 300, filterFreq: 3000 },
      'fog_ambience': { type: 'pink', freq: 80, filterFreq: 200 },
      'library_quiet': { type: 'pink', freq: 200, filterFreq: 250 },
      'train_moving': { type: 'brown', freq: 40, filterFreq: 120 },
      'church_bells': { type: 'sine', freq: 440, filterFreq: 5000 },
      'arctic_wind': { type: 'brown', freq: 60, filterFreq: 150 },
      'jungle_ambient': { type: 'pink', freq: 400, filterFreq: 3000 },
      'desert_wind': { type: 'brown', freq: 90, filterFreq: 180 },
      'underground': { type: 'brown', freq: 30, filterFreq: 80 },

      // Horror
      'whisper_voices': { type: 'pink', freq: 200, filterFreq: 800 },
      'heavy_breathing': { type: 'brown', freq: 100, filterFreq: 300 },
      'heartbeat_slow': { type: 'sine', freq: 1.2, filterFreq: 200, isBeat: true },
      'heartbeat_fast': { type: 'sine', freq: 2.5, filterFreq: 200, isBeat: true },
      'scratching': { type: 'brown', freq: 1000, filterFreq: 4000 },
      'eerie_music_box': { type: 'sine', freq: 523, filterFreq: 3000 },
      'reverse_speech': { type: 'sawtooth', freq: 150, filterFreq: 600 },
      'metal_scraping': { type: 'sawtooth', freq: 200, filterFreq: 1500 },
      'moaning': { type: 'sine', freq: 180, filterFreq: 400 },

      // Creatures
      'cultist_chant': { type: 'sawtooth', freq: 110, filterFreq: 400 },
      'deep_one_gurgle': { type: 'brown', freq: 60, filterFreq: 200 },
      'shoggoth_mass': { type: 'brown', freq: 25, filterFreq: 60 },
      'elder_thing': { type: 'sine', freq: 40, filterFreq: 100 },
      'ghoul_snarl': { type: 'sawtooth', freq: 80, filterFreq: 300 },
      'mi_go_buzz': { type: 'sawtooth', freq: 400, filterFreq: 2000 },
      'nightgaunt': { type: 'pink', freq: 50, filterFreq: 120 },
      'byakhee_screech': { type: 'sawtooth', freq: 800, filterFreq: 5000 },

      // Madness
      'sanity_loss': { type: 'sawtooth', freq: 100, filterFreq: 800 },
      'distortion': { type: 'sawtooth', freq: 60, filterFreq: 500 },
      'tinnitus': { type: 'sine', freq: 4000, filterFreq: 8000 },
      'laughter_mad': { type: 'sawtooth', freq: 300, filterFreq: 2000 },
      'cosmic_drone': { type: 'sine', freq: 30, filterFreq: 60 },
      'multiple_voices': { type: 'sawtooth', freq: 200, filterFreq: 1000 },

      // Events
      'door_open_creak': { type: 'brown', freq: 120, filterFreq: 400 },
      'door_slam': { type: 'brown', freq: 40, filterFreq: 200 },
      'glass_break': { type: 'brown', freq: 2000, filterFreq: 8000 },
      'explosion': { type: 'brown', freq: 30, filterFreq: 100 },
      'gunshot': { type: 'brown', freq: 100, filterFreq: 5000 },
      'collapse': { type: 'brown', freq: 20, filterFreq: 60 },
      'chase_music': { type: 'sawtooth', freq: 140, filterFreq: 600 },
      'combat_drums': { type: 'sine', freq: 3, filterFreq: 300, isBeat: true },
      'investigation': { type: 'sine', freq: 220, filterFreq: 500 },
      'discovery': { type: 'sine', freq: 330, filterFreq: 1000 },
      'lock_pick': { type: 'brown', freq: 600, filterFreq: 3000 },
      'falling': { type: 'brown', freq: 40, filterFreq: 150 },
      'distant_scream': { type: 'sawtooth', freq: 500, filterFreq: 2000 },

      // Jump scares
      'jump_slam': { type: 'brown', freq: 30, filterFreq: 100 },
      'jump_scream': { type: 'sawtooth', freq: 600, filterFreq: 5000 },
      'jump_shatter': { type: 'brown', freq: 3000, filterFreq: 10000 },
      'jump_roar': { type: 'sawtooth', freq: 80, filterFreq: 400 },
      'jump_whisper': { type: 'pink', freq: 300, filterFreq: 1200 },
      'jump_bang': { type: 'brown', freq: 50, filterFreq: 200 },
    };

    const params = toneMap[soundId] || { type: 'brown', freq: 100, filterFreq: 300 };

    // Create noise or oscillator based on type
    let sourceNode;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = params.filterFreq;
    filter.Q.value = 1;

    if (params.type === 'brown' || params.type === 'pink') {
      // Generate noise
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (params.type === 'brown') {
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        } else {
          data[i] = white * 0.5;
        }
      }
      sourceNode = ctx.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.loop = true;
    } else if (params.isBeat) {
      // Create rhythmic pulse
      const beatDuration = 2;
      const bufferSize = ctx.sampleRate * beatDuration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      const beatInterval = Math.floor(ctx.sampleRate / params.freq);
      for (let i = 0; i < bufferSize; i++) {
        const beatPhase = i % beatInterval;
        if (beatPhase < ctx.sampleRate * 0.08) {
          const t = beatPhase / (ctx.sampleRate * 0.08);
          data[i] = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 5) * 0.8;
        } else {
          data[i] = 0;
        }
      }
      sourceNode = ctx.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.loop = true;
    } else {
      sourceNode = ctx.createOscillator();
      sourceNode.type = params.type;
      sourceNode.frequency.value = params.freq;
    }

    // Add subtle LFO modulation for more organic feel
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1 + Math.random() * 0.3;
    lfoGain.gain.value = params.filterFreq * 0.3;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    sourceNode.connect(filter);
    filter.connect(gainNode);

    return { sourceNode, gainNode, lfo };
  }

  play(soundId, title, volume = 0.5, loop = true) {
    this._ensureContext();

    // If already playing, just update volume
    if (this.activeSounds.has(soundId)) {
      this.setVolume(soundId, volume);
      return;
    }

    const { sourceNode, gainNode, lfo } = this._generateTone(soundId);
    gainNode.connect(this.masterGain);

    sourceNode.start();
    // Fade in
    gainNode.gain.setTargetAtTime(volume * 0.3, this.audioContext.currentTime, 0.5);

    if (!loop) {
      sourceNode.loop = false;
    }

    this.activeSounds.set(soundId, {
      source: sourceNode,
      gainNode,
      lfo,
      isPlaying: true,
      volume,
      title,
      loop,
    });
    this._notify();
  }

  stop(soundId, fadeTime = 0.5) {
    const sound = this.activeSounds.get(soundId);
    if (!sound) return;

    const { gainNode, source, lfo } = sound;
    const ctx = this.audioContext;
    gainNode.gain.setTargetAtTime(0, ctx.currentTime, fadeTime / 3);

    setTimeout(() => {
      try {
        source.stop();
        lfo.stop();
      } catch (e) { /* already stopped */ }
      this.activeSounds.delete(soundId);
      this._notify();
    }, fadeTime * 1000);

    sound.isPlaying = false;
    this._notify();
  }

  stopAll(fadeTime = 1) {
    const ids = [...this.activeSounds.keys()];
    ids.forEach(id => this.stop(id, fadeTime));
  }

  setVolume(soundId, volume) {
    const sound = this.activeSounds.get(soundId);
    if (!sound) return;
    sound.volume = volume;
    sound.gainNode.gain.setTargetAtTime(volume * 0.3, this.audioContext.currentTime, 0.1);
    this._notify();
  }

  setMasterVolume(volume) {
    this.masterVolume = volume;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
    }
    this._notify();
  }

  isPlaying(soundId) {
    return this.activeSounds.has(soundId) && this.activeSounds.get(soundId).isPlaying;
  }

  // Trigger a one-shot sound (jump scare, event)
  trigger(soundId, title) {
    this._ensureContext();
    const { sourceNode, gainNode, lfo } = this._generateTone(soundId);
    gainNode.connect(this.masterGain);
    gainNode.gain.setValueAtTime(0.8, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
    sourceNode.start();
    setTimeout(() => {
      try { sourceNode.stop(); lfo.stop(); } catch(e) {}
    }, 2500);
  }

  // Panic mode — blast everything
  panic() {
    this._ensureContext();
    // Trigger multiple jarring sounds
    this.trigger('jump_slam', 'SLAM');
    setTimeout(() => this.trigger('jump_scream', 'SCREAM'), 100);
    // Vibrate if available
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  }
}

export const audioEngine = new AudioEngine();