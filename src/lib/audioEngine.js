// Web Audio Engine — manages multiple concurrent audio layers
// Uses Web Audio API for mixing, fading, and independent volume control

class AudioEngine {
  constructor() {
    this.activeSounds = new Map();
    this.masterVolume = 0.9;
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

  // Create noise buffer (white, pink, brown)
  _createNoiseBuffer(type, duration = 3) {
    const ctx = this.audioContext;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'white') {
        data[i] = white;
      } else if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else { // brown
        const v = (b0 + 0.02 * white) / 1.02;
        b0 = v;
        data[i] = v * 4;
      }
    }
    return buffer;
  }

  // Build audio graph for a specific sound
  _buildSoundGraph(soundId) {
    const ctx = this.audioContext;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;

    let nodes = []; // extra nodes to track for cleanup

    const connect = (src) => {
      src.connect(gainNode);
      gainNode.connect(this.masterGain);
    };

    // === ATMOSPHERE ===
    if (soundId === 'rain_heavy') {
      // Heavy rain: filtered brown noise, high frequency pass
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('brown', 4);
      src.loop = true;
      const hipass = ctx.createBiquadFilter();
      hipass.type = 'highpass';
      hipass.frequency.value = 600;
      const lopass = ctx.createBiquadFilter();
      lopass.type = 'lowpass';
      lopass.frequency.value = 8000;
      src.connect(hipass); hipass.connect(lopass); lopass.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [hipass, lopass] };
    }

    if (soundId === 'rain_light') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('pink', 3);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3000;
      filter.Q.value = 0.5;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'wind_howling') {
      // Howling wind: brown noise + slow pitch LFO
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('brown', 5);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 400;
      filter.Q.value = 3;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.15;
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
      lfo.start();
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, lfo, extraNodes: [filter, lfoGain] };
    }

    if (soundId === 'wind_gentle') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('pink', 4);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'thunder') {
      // Thunder: brown noise burst that decays
      const bufLen = ctx.sampleRate * 4;
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let b = 0;
      for (let i = 0; i < bufLen; i++) {
        const w = Math.random() * 2 - 1;
        b = (b + 0.02 * w) / 1.02;
        const decay = Math.exp(-i / (ctx.sampleRate * 1.5));
        d[i] = b * 4 * decay;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'ocean_waves') {
      // Ocean: brown noise with slow amplitude LFO (wave rhythm)
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('brown', 6);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 700;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.2;
      lfoGain.gain.value = 0.4;
      const wavegain = ctx.createGain();
      wavegain.gain.value = 0.6;
      lfo.connect(lfoGain); lfoGain.connect(wavegain.gain);
      lfo.start();
      src.connect(filter); filter.connect(wavegain); wavegain.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, lfo, extraNodes: [filter, lfoGain, wavegain] };
    }

    if (soundId === 'fire_crackling') {
      // Fire: pink noise, highpass for crackle texture
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('pink', 3);
      src.loop = true;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1000;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 5000;
      src.connect(hp); hp.connect(lp); lp.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [hp, lp] };
    }

    if (soundId === 'clock_ticking') {
      // Clock tick: repeated sharp impulse
      const bpm = 72;
      const interval = 60 / bpm;
      const bufLen = Math.floor(ctx.sampleRate * interval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const tickLen = Math.floor(ctx.sampleRate * 0.01);
      for (let i = 0; i < tickLen; i++) {
        d[i] = Math.sin(2 * Math.PI * 1200 * i / ctx.sampleRate) * Math.exp(-i / (ctx.sampleRate * 0.005));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [] };
    }

    if (soundId === 'dripping_water') {
      // Drip: periodic short tone
      const interval = 1.8;
      const bufLen = Math.floor(ctx.sampleRate * interval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const dripLen = Math.floor(ctx.sampleRate * 0.08);
      for (let i = 0; i < dripLen; i++) {
        const t = i / ctx.sampleRate;
        d[i] = Math.sin(2 * Math.PI * 900 * t) * Math.exp(-i / (ctx.sampleRate * 0.03));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [] };
    }

    if (soundId === 'creaking_wood') {
      // Creaking: sawtooth sweep, slow LFO pitch
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 120;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.3;
      lfoGain.gain.value = 60;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      lfo.start();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      osc.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo, extraNodes: [filter, lfoGain] };
    }

    if (soundId === 'footsteps_slow') {
      // Footstep: low thud every ~1.4 seconds
      const interval = 1.4;
      const bufLen = Math.floor(ctx.sampleRate * interval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const stepLen = Math.floor(ctx.sampleRate * 0.12);
      for (let i = 0; i < stepLen; i++) {
        const t = i / ctx.sampleRate;
        // Low thud
        d[i] = (Math.sin(2 * Math.PI * 60 * t) + Math.sin(2 * Math.PI * 120 * t) * 0.5) * Math.exp(-t * 30);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [] };
    }

    if (soundId === 'chains_rattling') {
      // Chains: high metallic noise bursts
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('white', 2);
      src.loop = true;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 3000;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 3;
      lfoGain.gain.value = 0.7;
      const ampGain = ctx.createGain();
      ampGain.gain.value = 0.3;
      lfo.connect(lfoGain); lfoGain.connect(ampGain.gain);
      lfo.start();
      src.connect(hp); hp.connect(ampGain); ampGain.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, lfo, extraNodes: [hp, lfoGain, ampGain] };
    }

    if (soundId === 'fog_ambience' || soundId === 'library_quiet') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('pink', 4);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'train_moving') {
      // Train: low rhythmic rumble
      const interval = 0.5;
      const bufLen = Math.floor(ctx.sampleRate * interval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let b = 0;
      for (let i = 0; i < bufLen; i++) {
        b = (b + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = b * 4;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 300;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'church_bells') {
      // Bell: sine tone with exponential decay
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 440;
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 880;
      const g2 = ctx.createGain();
      g2.gain.value = 0.4;
      osc2.connect(g2); g2.connect(gainNode);
      osc.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, extraNodes: [osc2, g2], lfo: osc2 };
    }

    if (soundId === 'arctic_wind') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('brown', 5);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 2;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 600;
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
      lfo.start();
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, lfo, extraNodes: [filter, lfoGain] };
    }

    if (soundId === 'jungle_ambient') {
      // Jungle: pink noise + high frequency chirps
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('pink', 3);
      src.loop = true;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2000;
      src.connect(hp); hp.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [hp] };
    }

    if (soundId === 'desert_wind') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('brown', 4);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'underground') {
      // Deep underground: very low drone
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 40;
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 55;
      const g2 = ctx.createGain();
      g2.gain.value = 0.5;
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('brown', 4);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 100;
      osc2.connect(g2); g2.connect(gainNode);
      osc.connect(gainNode);
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      osc2.start(); src.start();
      return { sourceNode: osc, gainNode, lfo: osc2, extraNodes: [g2, src, filter] };
    }

    // === HORROR ===
    if (soundId === 'whisper_voices') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('pink', 4);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1500;
      filter.Q.value = 4;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 3;
      lfoGain.gain.value = 800;
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
      lfo.start();
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, lfo, extraNodes: [filter, lfoGain] };
    }

    if (soundId === 'heavy_breathing') {
      // Breathing: periodic filtered noise burst
      const interval = 2.5;
      const bufLen = Math.floor(ctx.sampleRate * interval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let b0 = 0;
      const inhaleLen = Math.floor(ctx.sampleRate * 1.0);
      const exhaleStart = Math.floor(ctx.sampleRate * 1.2);
      const exhaleLen = Math.floor(ctx.sampleRate * 0.8);
      for (let i = 0; i < inhaleLen; i++) {
        const w = Math.random() * 2 - 1;
        b0 = (b0 + 0.04 * w) / 1.04;
        const env = Math.sin(Math.PI * i / inhaleLen);
        d[i] = b0 * 4 * env * 0.6;
      }
      for (let i = 0; i < exhaleLen; i++) {
        const w = Math.random() * 2 - 1;
        const v = (b0 + 0.03 * w) / 1.03;
        b0 = v;
        const env = Math.sin(Math.PI * i / exhaleLen);
        d[exhaleStart + i] = v * 4 * env * 0.4;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [] };
    }

    if (soundId === 'heartbeat_slow') {
      // Heartbeat: two-thump pattern at ~55bpm
      const bpm = 55;
      const beatInterval = 60 / bpm;
      const bufLen = Math.floor(ctx.sampleRate * beatInterval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const thump = (offset, freq, decay) => {
        const len = Math.floor(ctx.sampleRate * 0.12);
        for (let i = 0; i < len && offset + i < bufLen; i++) {
          const t = i / ctx.sampleRate;
          d[offset + i] += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / decay);
        }
      };
      thump(0, 70, 0.05);
      thump(Math.floor(ctx.sampleRate * 0.15), 50, 0.07);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [] };
    }

    if (soundId === 'heartbeat_fast') {
      const bufLen = Math.floor(ctx.sampleRate * (60 / 120));
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const thump = (offset, freq, decay) => {
        const len = Math.floor(ctx.sampleRate * 0.08);
        for (let i = 0; i < len && offset + i < bufLen; i++) {
          const t = i / ctx.sampleRate;
          d[offset + i] += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / decay);
        }
      };
      thump(0, 80, 0.04);
      thump(Math.floor(ctx.sampleRate * 0.1), 60, 0.05);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [] };
    }

    if (soundId === 'scratching') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('white', 2);
      src.loop = true;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2500;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 6;
      lfoGain.gain.value = 0.5;
      const ag = ctx.createGain();
      ag.gain.value = 0.5;
      lfo.connect(lfoGain); lfoGain.connect(ag.gain);
      lfo.start();
      src.connect(hp); hp.connect(ag); ag.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, lfo, extraNodes: [hp, lfoGain, ag] };
    }

    if (soundId === 'eerie_music_box') {
      // Music box: sine wave melody with decay
      const notes = [523, 659, 784, 659, 523, 440, 392, 440];
      const noteDur = 0.4;
      const bufLen = Math.floor(ctx.sampleRate * notes.length * noteDur);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      notes.forEach((freq, idx) => {
        const start = Math.floor(idx * noteDur * ctx.sampleRate);
        const len = Math.floor(noteDur * ctx.sampleRate);
        for (let i = 0; i < len; i++) {
          const t = i / ctx.sampleRate;
          d[start + i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 4) * 0.8;
        }
      });
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [] };
    }

    if (soundId === 'reverse_speech') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 150;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 4;
      lfoGain.gain.value = 80;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      lfo.start();
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 3;
      osc.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo, extraNodes: [filter, lfoGain] };
    }

    if (soundId === 'metal_scraping') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 220;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.5;
      lfoGain.gain.value = 100;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      lfo.start();
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      osc.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo, extraNodes: [filter, lfoGain] };
    }

    if (soundId === 'moaning') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 160;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.5;
      lfoGain.gain.value = 30;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      lfo.start();
      osc.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo, extraNodes: [lfoGain] };
    }

    if (soundId === 'distant_scream') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 600;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1500;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 5;
      lfoGain.gain.value = 100;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      lfo.start();
      osc.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo, extraNodes: [filter, lfoGain] };
    }

    // === CREATURES ===
    if (soundId === 'cultist_chant') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 110;
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 165;
      const g2 = ctx.createGain();
      g2.gain.value = 0.4;
      osc2.start(); osc2.connect(g2); g2.connect(gainNode);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      osc.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo: osc2, extraNodes: [g2, filter] };
    }

    if (soundId === 'deep_one_gurgle') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('brown', 2);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 300;
      filter.Q.value = 5;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 4;
      lfoGain.gain.value = 200;
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
      lfo.start();
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, lfo, extraNodes: [filter, lfoGain] };
    }

    if (soundId === 'shoggoth_mass') {
      // Very low, wet rumble
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('brown', 5);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 80;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 28;
      const og = ctx.createGain();
      og.gain.value = 0.5;
      osc.start(); osc.connect(og); og.connect(gainNode);
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, lfo: osc, extraNodes: [filter, og] };
    }

    if (soundId === 'byakhee_screech') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 900;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 8;
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      lfo.start();
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 500;
      osc.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo, extraNodes: [filter, lfoGain] };
    }

    if (soundId === 'elder_thing') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 38;
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 42;
      const g2 = ctx.createGain();
      g2.gain.value = 0.6;
      osc2.start(); osc2.connect(g2); g2.connect(gainNode);
      osc.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo: osc2, extraNodes: [g2] };
    }

    if (soundId === 'ghoul_snarl') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 85;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 6;
      lfoGain.gain.value = 40;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      lfo.start();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      osc.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo, extraNodes: [filter, lfoGain] };
    }

    if (soundId === 'mi_go_buzz') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 380;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 12;
      lfoGain.gain.value = 50;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      lfo.start();
      osc.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo, extraNodes: [lfoGain] };
    }

    if (soundId === 'nightgaunt') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('pink', 4);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 300;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    // === MADNESS ===
    if (soundId === 'sanity_loss') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 200;
      const ctx2 = this.audioContext;
      osc.frequency.setTargetAtTime(800, ctx2.currentTime, 0.5);
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 500;
      osc.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'distortion') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 80;
      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.value = 127;
      const g2 = ctx.createGain();
      g2.gain.value = 0.5;
      osc2.start(); osc2.connect(g2); g2.connect(gainNode);
      osc.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo: osc2, extraNodes: [g2] };
    }

    if (soundId === 'tinnitus') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 4200;
      osc.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, extraNodes: [] };
    }

    if (soundId === 'laughter_mad') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 320;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 7;
      lfoGain.gain.value = 100;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      lfo.start();
      osc.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo, extraNodes: [lfoGain] };
    }

    if (soundId === 'cosmic_drone') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 32;
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 48;
      const g2 = ctx.createGain();
      g2.gain.value = 0.4;
      osc2.start(); osc2.connect(g2); g2.connect(gainNode);
      osc.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo: osc2, extraNodes: [g2] };
    }

    if (soundId === 'multiple_voices') {
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth'; osc1.frequency.value = 180;
      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth'; osc2.frequency.value = 210;
      const osc3 = ctx.createOscillator();
      osc3.type = 'sawtooth'; osc3.frequency.value = 155;
      const g2 = ctx.createGain(); g2.gain.value = 0.4;
      const g3 = ctx.createGain(); g3.gain.value = 0.3;
      osc2.start(); osc3.start();
      osc2.connect(g2); g2.connect(gainNode);
      osc3.connect(g3); g3.connect(gainNode);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 2;
      osc1.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: osc1, gainNode, lfo: osc2, extraNodes: [osc3, g2, g3, filter] };
    }

    // === EVENTS (one-shots) ===
    if (soundId === 'door_open_creak') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth'; osc.frequency.value = 200;
      osc.frequency.setTargetAtTime(80, ctx.currentTime, 0.3);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 600;
      osc.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'door_slam') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('brown', 0.5);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 200;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'glass_break') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('white', 1);
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass'; filter.frequency.value = 3000;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'explosion') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('brown', 2);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 150;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'gunshot') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('white', 0.3);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 2000; filter.Q.value = 0.5;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'collapse') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('brown', 3);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 100;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'chase_music') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth'; osc.frequency.value = 140;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 4; lfoGain.gain.value = 20;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency); lfo.start();
      osc.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo, extraNodes: [lfoGain] };
    }

    if (soundId === 'combat_drums') {
      const interval = 60 / 160;
      const bufLen = Math.floor(ctx.sampleRate * interval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const drumLen = Math.floor(ctx.sampleRate * 0.05);
      for (let i = 0; i < drumLen; i++) {
        const t = i / ctx.sampleRate;
        d[i] = Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 50);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      src.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [] };
    }

    if (soundId === 'investigation') {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = 220;
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine'; osc2.frequency.value = 330;
      const g2 = ctx.createGain(); g2.gain.value = 0.3;
      osc2.start(); osc2.connect(g2); g2.connect(gainNode);
      osc.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, lfo: osc2, extraNodes: [g2] };
    }

    if (soundId === 'discovery') {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = 440;
      osc.frequency.setTargetAtTime(880, ctx.currentTime, 0.3);
      osc.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, extraNodes: [] };
    }

    if (soundId === 'lock_pick') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('white', 1);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 2500; filter.Q.value = 8;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'falling') {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = 500;
      osc.frequency.setTargetAtTime(50, ctx.currentTime, 0.8);
      osc.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, extraNodes: [] };
    }

    // === JUMP SCARES ===
    if (soundId === 'jump_slam' || soundId === 'jump_bang') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('brown', 0.4);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 180;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'jump_scream') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth'; osc.frequency.value = 700;
      osc.frequency.setTargetAtTime(200, ctx.currentTime, 0.5);
      osc.connect(gainNode); gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, extraNodes: [] };
    }

    if (soundId === 'jump_shatter') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('white', 0.5);
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass'; filter.frequency.value = 4000;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'jump_roar') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth'; osc.frequency.value = 100;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 400;
      osc.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: osc, gainNode, extraNodes: [filter] };
    }

    if (soundId === 'jump_whisper') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer('pink', 0.5);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 2000; filter.Q.value = 3;
      src.connect(filter); filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      return { sourceNode: src, gainNode, extraNodes: [filter] };
    }

    // Fallback: pink noise lowpass
    const src = ctx.createBufferSource();
    src.buffer = this._createNoiseBuffer('pink', 3);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 800;
    src.connect(filter); filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    return { sourceNode: src, gainNode, extraNodes: [filter] };
  }

  play(soundId, title, volume = 0.7, loop = true) {
    this._ensureContext();

    if (this.activeSounds.has(soundId)) {
      this.setVolume(soundId, volume);
      return;
    }

    const { sourceNode, gainNode, lfo, extraNodes = [] } = this._buildSoundGraph(soundId);

    // Fade in to full volume
    gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.4);

    sourceNode.start();

    if (!loop && sourceNode.loop !== undefined) {
      sourceNode.loop = false;
    }

    this.activeSounds.set(soundId, {
      source: sourceNode,
      gainNode,
      lfo,
      extraNodes,
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

    const { gainNode, source, lfo, extraNodes = [] } = sound;
    const ctx = this.audioContext;
    gainNode.gain.setTargetAtTime(0, ctx.currentTime, fadeTime / 3);

    setTimeout(() => {
      try { source.stop(); } catch (e) {}
      try { if (lfo) lfo.stop(); } catch (e) {}
      extraNodes.forEach(n => { try { if (n.stop) n.stop(); } catch (e) {} });
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
    sound.gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
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

  trigger(soundId, title) {
    this._ensureContext();
    const { sourceNode, gainNode, lfo, extraNodes = [] } = this._buildSoundGraph(soundId);
    gainNode.gain.setValueAtTime(0.9, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2.5);
    sourceNode.start();
    setTimeout(() => {
      try { sourceNode.stop(); } catch(e) {}
      try { if (lfo) lfo.stop(); } catch(e) {}
      extraNodes.forEach(n => { try { if (n.stop) n.stop(); } catch(e) {} });
    }, 3000);
  }

  panic() {
    this._ensureContext();
    this.trigger('jump_slam', 'SLAM');
    setTimeout(() => this.trigger('jump_scream', 'SCREAM'), 150);
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  }
}

export const audioEngine = new AudioEngine();