// Web Audio Engine — manages multiple concurrent audio layers

class AudioEngine {
  constructor() {
    this.activeSounds = new Map();
    this.masterVolume = 1.0;
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

  // White noise buffer
  _whiteNoise(duration = 3) {
    const ctx = this.audioContext;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Pink noise buffer (more natural, like rain/wind)
  _pinkNoise(duration = 3) {
    const ctx = this.audioContext;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
      b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
      b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980;
      d[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return buf;
  }

  // Brown noise buffer (low rumble, thunder/explosions)
  _brownNoise(duration = 3) {
    const ctx = this.audioContext;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  _buildSoundGraph(soundId) {
    const ctx = this.audioContext;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(this.masterGain);

    // Helper: source → chain of nodes → gainNode
    const chain = (src, ...nodes) => {
      let prev = src;
      for (const n of nodes) { prev.connect(n); prev = n; }
      prev.connect(gainNode);
    };

    const lpf = (freq) => { const f = ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=freq; return f; };
    const hpf = (freq) => { const f = ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=freq; return f; };
    const bpf = (freq, q=1) => { const f = ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq; f.Q.value=q; return f; };
    const gain = (v) => { const g = ctx.createGain(); g.gain.value=v; return g; };
    const osc = (type, freq) => { const o = ctx.createOscillator(); o.type=type; o.frequency.value=freq; return o; };
    const noise = (type, dur) => {
      const src = ctx.createBufferSource();
      src.loop = true;
      if (type==='white') src.buffer = this._whiteNoise(dur||3);
      else if (type==='pink') src.buffer = this._pinkNoise(dur||3);
      else src.buffer = this._brownNoise(dur||3);
      return src;
    };
    const lfo = (freq, amount, target) => {
      const o = ctx.createOscillator(); o.frequency.value = freq;
      const g = ctx.createGain(); g.gain.value = amount;
      o.connect(g); g.connect(target); o.start();
      return [o, g];
    };

    // ========== ATMOSPHERE ==========

    if (soundId === 'rain_heavy') {
      // Heavy rain: dense pink noise band 600Hz-12kHz + gentle low rumble
      const src = noise('pink', 4);
      const hp = hpf(400); const lp = lpf(14000);
      const rumble = noise('brown', 3); rumble.loop=true;
      const rg = gain(0.15); const rlp = lpf(300);
      chain(src, hp, lp, gainNode);
      chain(rumble, rlp, rg, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [hp, lp, rumble, rlp, rg] };
    }

    if (soundId === 'rain_light') {
      // Light rain: narrow pink, gentle patter feel
      const src = noise('pink', 3);
      const hp = hpf(1500); const lp = lpf(8000);
      chain(src, hp, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [hp, lp] };
    }

    if (soundId === 'wind_howling') {
      // Howling wind: brown noise band-passed with slow frequency sweep LFO
      const src = noise('brown', 5);
      const bp = bpf(600, 2);
      const [lfoOsc, lfoG] = lfo(0.12, 400, bp.frequency);
      chain(src, bp, gainNode);
      return { sourceNode: src, gainNode, lfo: lfoOsc, extraNodes: [bp, lfoG] };
    }

    if (soundId === 'wind_gentle') {
      // Gentle breeze: soft low-passed pink noise
      const src = noise('pink', 4);
      const lp = lpf(2500); const hp = hpf(200);
      chain(src, hp, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp, hp] };
    }

    if (soundId === 'thunder') {
      // Thunder: deep brown noise burst with sharp attack decay envelope
      const len = ctx.sampleRate * 5;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let b = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b = (b + 0.02 * w) / 1.02;
        // sharp crack at start, then rumble decay
        const t = i / ctx.sampleRate;
        const env = Math.min(1, t * 20) * Math.exp(-t * 0.6);
        d[i] = b * 4 * env;
      }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = lpf(400); const hp = hpf(30);
      chain(src, hp, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp, hp] };
    }

    if (soundId === 'ocean_waves') {
      // Ocean waves: brown noise with slow amplitude LFO (0.12 Hz = 8s wave cycle)
      const src = noise('brown', 8);
      const lp = lpf(1200); const hp = hpf(40);
      const ampEnv = gain(0.7);
      const [lfoOsc, lfoG] = lfo(0.12, 0.3, ampEnv.gain);
      chain(src, hp, lp, ampEnv, gainNode);
      return { sourceNode: src, gainNode, lfo: lfoOsc, extraNodes: [lp, hp, ampEnv, lfoG] };
    }

    if (soundId === 'fire_crackling') {
      // Fire: pink noise band + random crackle pops (white noise spikes)
      const src = noise('pink', 3);
      const hp = hpf(800); const lp = lpf(6000);
      const crackle = noise('white', 2);
      const clp = bpf(4000, 3); const cg = gain(0.08);
      chain(src, hp, lp, gainNode);
      chain(crackle, clp, cg, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [hp, lp, crackle, clp, cg] };
    }

    if (soundId === 'clock_ticking') {
      // Clock: sharp 1200Hz sine impulse every 0.833s (72bpm)
      const interval = 60 / 72;
      const bufLen = Math.floor(ctx.sampleRate * interval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const tickLen = Math.floor(ctx.sampleRate * 0.008);
      for (let i = 0; i < tickLen; i++) {
        d[i] = Math.sin(2 * Math.PI * 1800 * i / ctx.sampleRate) * Math.exp(-i / (ctx.sampleRate * 0.004));
      }
      // tock (quieter, lower pitch)
      const half = Math.floor(bufLen / 2);
      const tockLen = Math.floor(ctx.sampleRate * 0.006);
      for (let i = 0; i < tockLen; i++) {
        d[half + i] = Math.sin(2 * Math.PI * 1200 * i / ctx.sampleRate) * Math.exp(-i / (ctx.sampleRate * 0.003)) * 0.7;
      }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      src.connect(gainNode);
      return { sourceNode: src, gainNode, extraNodes: [] };
    }

    if (soundId === 'dripping_water') {
      // Drip: 2-3 drops with randomized pitch (cave feel)
      const interval = 2.2;
      const bufLen = Math.floor(ctx.sampleRate * interval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const addDrip = (offset, freq, decay) => {
        const len = Math.floor(ctx.sampleRate * 0.12);
        for (let i = 0; i < len && offset+i < bufLen; i++) {
          const t = i / ctx.sampleRate;
          d[offset+i] += Math.sin(2*Math.PI*freq*t) * Math.exp(-t/decay) * 0.8;
        }
      };
      addDrip(0, 1100, 0.04);
      addDrip(Math.floor(ctx.sampleRate * 0.9), 900, 0.035);
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = lpf(3000);
      chain(src, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp] };
    }

    if (soundId === 'creaking_wood') {
      // Creaking wood: low sawtooth with slow pitch wobble + resonant filter
      const o = osc('sawtooth', 180);
      const lp = lpf(800); lp.Q.value = 4;
      const [lfoOsc, lfoG] = lfo(0.25, 80, o.frequency);
      const slowAmp = gain(0.5);
      const [ampLfo, ampLfoG] = lfo(0.2, 0.3, slowAmp.gain);
      chain(o, lp, slowAmp, gainNode);
      return { sourceNode: o, gainNode, lfo: lfoOsc, extraNodes: [lp, lfoG, slowAmp, ampLfo, ampLfoG] };
    }

    if (soundId === 'footsteps_slow') {
      // Footsteps: two-part step (heel + toe) at ~80bpm walking pace
      const interval = 60 / 80;
      const bufLen = Math.floor(ctx.sampleRate * interval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const step = (offset, freq, decay, amp = 1) => {
        const len = Math.floor(ctx.sampleRate * 0.15);
        for (let i = 0; i < len && offset+i < bufLen; i++) {
          const t = i / ctx.sampleRate;
          d[offset+i] += (Math.sin(2*Math.PI*freq*t) + (Math.random()-0.5)*0.3) * Math.exp(-t/decay) * amp;
        }
      };
      step(0, 80, 0.04, 1.0);
      step(Math.floor(ctx.sampleRate * 0.08), 120, 0.02, 0.5);
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = lpf(600);
      chain(src, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp] };
    }

    if (soundId === 'chains_rattling') {
      // Chains: high metallic white noise bursts with rhythmic LFO tremolo
      const src = noise('white', 2);
      const hp = hpf(4000); const lp = lpf(12000);
      const ampG = gain(0.5);
      const [lfoOsc, lfoG] = lfo(4, 0.5, ampG.gain);
      chain(src, hp, lp, ampG, gainNode);
      return { sourceNode: src, gainNode, lfo: lfoOsc, extraNodes: [hp, lp, ampG, lfoG] };
    }

    if (soundId === 'fog_ambience') {
      // Fog: very soft low-passed pink noise + faint whistle
      const src = noise('pink', 4);
      const lp = lpf(800); const hp = hpf(100);
      const whistle = osc('sine', 320);
      const wg = gain(0.03);
      const [lfoOsc, lfoG] = lfo(0.05, 30, whistle.frequency);
      whistle.start(); chain(whistle, wg, gainNode);
      chain(src, hp, lp, gainNode);
      return { sourceNode: src, gainNode, lfo: lfoOsc, extraNodes: [lp, hp, whistle, wg, lfoG] };
    }

    if (soundId === 'library_quiet') {
      // Quiet library: near-silence with occasional page rustle (pink noise flutter)
      const src = noise('pink', 4);
      const lp = lpf(3000); const hp = hpf(800);
      const ampG = gain(0.06);
      const [lfoOsc, lfoG] = lfo(0.08, 0.05, ampG.gain);
      chain(src, hp, lp, ampG, gainNode);
      return { sourceNode: src, gainNode, lfo: lfoOsc, extraNodes: [lp, hp, ampG, lfoG] };
    }

    if (soundId === 'train_moving') {
      // Train: rhythmic low thud (track joints) + continuous rumble
      const interval = 0.45;
      const bufLen = Math.floor(ctx.sampleRate * interval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let b = 0;
      for (let i = 0; i < bufLen; i++) {
        b = (b + 0.02 * (Math.random()*2-1)) / 1.02;
        d[i] = b * 4;
      }
      // Add joint thud at start
      const thudLen = Math.floor(ctx.sampleRate * 0.06);
      for (let i = 0; i < thudLen; i++) {
        const t = i / ctx.sampleRate;
        d[i] += Math.sin(2*Math.PI*60*t) * Math.exp(-t*40) * 0.8;
      }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = lpf(600);
      chain(src, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp] };
    }

    if (soundId === 'church_bells') {
      // Bell tone: additive sine harmonics (fundamental + overtones) with exponential decay
      const bufLen = Math.floor(ctx.sampleRate * 6);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const partials = [220, 660, 880, 1320, 1760];
      const amps    = [1.0, 0.5, 0.3, 0.15, 0.08];
      const decays  = [3.0, 2.0, 1.5, 1.0,  0.7];
      for (let p = 0; p < partials.length; p++) {
        for (let i = 0; i < bufLen; i++) {
          const t = i / ctx.sampleRate;
          d[i] += Math.sin(2*Math.PI*partials[p]*t) * amps[p] * Math.exp(-t/decays[p]);
        }
      }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      src.connect(gainNode);
      return { sourceNode: src, gainNode, extraNodes: [] };
    }

    if (soundId === 'arctic_wind') {
      // Arctic wind: brown noise with aggressive frequency sweep
      const src = noise('brown', 5);
      const bp = bpf(1200, 3);
      const [lfoOsc, lfoG] = lfo(0.07, 800, bp.frequency);
      const hp = hpf(200);
      chain(src, hp, bp, gainNode);
      return { sourceNode: src, gainNode, lfo: lfoOsc, extraNodes: [bp, lfoG, hp] };
    }

    if (soundId === 'jungle_ambient') {
      // Jungle: layered pink noise (insects) + periodic chirp high-freq
      const src = noise('pink', 3);
      const hp = hpf(3000); const lp = lpf(15000);
      const low = noise('pink', 4); low.loop = true;
      const llp = lpf(800); const lg = gain(0.3);
      chain(src, hp, lp, gainNode);
      chain(low, llp, lg, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [hp, lp, low, llp, lg] };
    }

    if (soundId === 'desert_wind') {
      // Desert: dry brown noise with gentle sweep
      const src = noise('brown', 4);
      const lp = lpf(2000); const hp = hpf(150);
      const ampG = gain(0.7);
      const [lfoOsc, lfoG] = lfo(0.06, 0.2, ampG.gain);
      chain(src, hp, lp, ampG, gainNode);
      return { sourceNode: src, gainNode, lfo: lfoOsc, extraNodes: [lp, hp, ampG, lfoG] };
    }

    if (soundId === 'underground') {
      // Deep underground: very low sine drone + sub-rumble brown noise
      const o1 = osc('sine', 38); const o2 = osc('sine', 52);
      const g1 = gain(0.8); const g2 = gain(0.4);
      const src = noise('brown', 4);
      const lp = lpf(120); const rumbleG = gain(0.3);
      o1.start(); o2.start(); src.start();
      chain(o1, g1, gainNode); chain(o2, g2, gainNode); chain(src, lp, rumbleG, gainNode);
      return { sourceNode: o1, gainNode, lfo: o2, extraNodes: [g1, g2, o2, src, lp, rumbleG] };
    }

    // ========== HORROR ==========

    if (soundId === 'whisper_voices') {
      // Whispers: bandpass noise at speech formant frequencies, slow tremolo
      const src = noise('pink', 4);
      const bp1 = bpf(700, 6); const bp2 = bpf(1200, 4);
      const g1 = gain(0.5); const g2 = gain(0.3);
      const ampG = gain(0.8);
      const [lfoOsc, lfoG] = lfo(2.5, 0.4, ampG.gain);
      chain(src, bp1, g1, gainNode);
      const src2 = noise('pink', 3); src2.loop = true; src2.start();
      chain(src2, bp2, g2, gainNode);
      return { sourceNode: src, gainNode, lfo: lfoOsc, extraNodes: [bp1, g1, src2, bp2, g2, ampG, lfoG] };
    }

    if (soundId === 'heavy_breathing') {
      // Breathing: shaped noise bursts with inhale/exhale envelope
      const interval = 3.0;
      const bufLen = Math.floor(ctx.sampleRate * interval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const sr = ctx.sampleRate;
      let b = 0;
      // Inhale (0 to 1.2s)
      const inhaleEnd = Math.floor(sr * 1.2);
      for (let i = 0; i < inhaleEnd; i++) {
        const w = Math.random()*2-1; b = (b+0.05*w)/1.05;
        const env = Math.sin(Math.PI * i / inhaleEnd);
        d[i] = b * 5 * env;
      }
      // Exhale (1.5s to 2.8s)
      const exhaleStart = Math.floor(sr * 1.5);
      const exhaleLen = Math.floor(sr * 1.1);
      b = 0;
      for (let i = 0; i < exhaleLen; i++) {
        const w = Math.random()*2-1; b = (b+0.04*w)/1.04;
        const env = Math.sin(Math.PI * i / exhaleLen) * 0.7;
        d[exhaleStart + i] = b * 5 * env;
      }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = lpf(3000); const hp = hpf(200);
      chain(src, hp, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp, hp] };
    }

    if (soundId === 'heartbeat_slow') {
      // Heartbeat: lub-dub pattern at ~55bpm, deep bass thuds
      const bpm = 55;
      const bufLen = Math.floor(ctx.sampleRate * 60 / bpm);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const thump = (offset, freq, decay, amp) => {
        const len = Math.floor(ctx.sampleRate * 0.18);
        for (let i = 0; i < len && offset+i < bufLen; i++) {
          const t = i / ctx.sampleRate;
          d[offset+i] += (Math.sin(2*Math.PI*freq*t) + Math.sin(2*Math.PI*freq*1.5*t)*0.4) * Math.exp(-t/decay) * amp;
        }
      };
      thump(0,  55, 0.07, 1.0);  // LUB
      thump(Math.floor(ctx.sampleRate * 0.22), 45, 0.09, 0.7); // DUB
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = lpf(300); const hp = hpf(30);
      chain(src, hp, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp, hp] };
    }

    if (soundId === 'heartbeat_fast') {
      const bpm = 130;
      const bufLen = Math.floor(ctx.sampleRate * 60 / bpm);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const thump = (offset, freq, decay, amp) => {
        const len = Math.floor(ctx.sampleRate * 0.10);
        for (let i = 0; i < len && offset+i < bufLen; i++) {
          const t = i / ctx.sampleRate;
          d[offset+i] += Math.sin(2*Math.PI*freq*t) * Math.exp(-t/decay) * amp;
        }
      };
      thump(0, 65, 0.04, 1.0);
      thump(Math.floor(ctx.sampleRate * 0.14), 55, 0.05, 0.6);
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = lpf(400); const hp = hpf(30);
      chain(src, hp, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp, hp] };
    }

    if (soundId === 'scratching') {
      // Scratching: white noise bursts shaped like nail-on-surface texture
      const interval = 0.35;
      const bufLen = Math.floor(ctx.sampleRate * interval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const scratchLen = Math.floor(ctx.sampleRate * 0.25);
      for (let i = 0; i < scratchLen; i++) {
        const t = i / ctx.sampleRate;
        const env = Math.sin(Math.PI * i / scratchLen) * 0.8 + 0.2;
        d[i] = (Math.random()*2-1) * env;
      }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const hp = hpf(3000); const lp = lpf(10000);
      chain(src, hp, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [hp, lp] };
    }

    if (soundId === 'eerie_music_box') {
      // Music box: slow pentatonic minor melody with metallic decay
      const notes = [261, 311, 349, 392, 261, 233, 261, 196, 220, 261];
      const noteDur = 0.7;
      const bufLen = Math.floor(ctx.sampleRate * notes.length * noteDur);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      notes.forEach((freq, idx) => {
        const start = Math.floor(idx * noteDur * ctx.sampleRate);
        const len = Math.floor(noteDur * ctx.sampleRate);
        for (let i = 0; i < len && start+i < bufLen; i++) {
          const t = i / ctx.sampleRate;
          // Fundamental + 2nd harmonic for metallic bell tone
          d[start+i] = (Math.sin(2*Math.PI*freq*t) + Math.sin(2*Math.PI*freq*2.76*t)*0.3) * Math.exp(-t*2.5) * 0.9;
        }
      });
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const hp = hpf(200);
      chain(src, hp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [hp] };
    }

    if (soundId === 'reverse_speech') {
      // Reversed speech simulation: formant-filtered sawtooth with irregular pitch envelope
      const o = osc('sawtooth', 180);
      const f1 = bpf(700, 8); const f2 = bpf(1100, 5);
      const g1 = gain(0.6); const g2 = gain(0.4);
      const ampG = gain(0.7);
      const [lfoOsc, lfoG] = lfo(0.6, 60, o.frequency);
      const [ampLfo, ampLfoG] = lfo(0.5, 0.3, ampG.gain);
      chain(o, f1, g1, gainNode);
      const o2 = osc('sawtooth', 220); o2.start();
      chain(o2, f2, g2, gainNode);
      return { sourceNode: o, gainNode, lfo: lfoOsc, extraNodes: [f1, g1, o2, f2, g2, ampG, lfoG, ampLfo, ampLfoG] };
    }

    if (soundId === 'metal_scraping') {
      // Metal scraping: high sawtooth + white noise band = harsh metallic grind
      const o = osc('sawtooth', 300);
      const src = noise('white', 2);
      const bp = bpf(2500, 5); const ng = gain(0.3);
      const lp = lpf(5000); const hp = hpf(800);
      const [lfoOsc, lfoG] = lfo(0.3, 150, o.frequency);
      chain(o, hp, lp, gainNode);
      chain(src, bp, ng, gainNode);
      return { sourceNode: o, gainNode, lfo: lfoOsc, extraNodes: [hp, lp, src, bp, ng, lfoG] };
    }

    if (soundId === 'moaning') {
      // Moaning: sustained sine with vibrato and subtle formant
      const o = osc('sine', 140);
      const f = bpf(900, 3);
      const [lfoOsc, lfoG] = lfo(4.5, 18, o.frequency);
      const ampG = gain(0.8);
      const [ampLfo, ampLfoG] = lfo(0.3, 0.2, ampG.gain);
      chain(o, f, ampG, gainNode);
      return { sourceNode: o, gainNode, lfo: lfoOsc, extraNodes: [f, ampG, lfoG, ampLfo, ampLfoG] };
    }

    if (soundId === 'distant_scream') {
      // Distant scream: bandpass-filtered narrow noise burst, high pitched
      const o = osc('sawtooth', 800);
      const lp = lpf(3000); const hp = hpf(500);
      const [lfoOsc, lfoG] = lfo(6, 150, o.frequency);
      const ampG = gain(0.6);
      const [ampLfo, ampLfoG] = lfo(0.15, 0.3, ampG.gain);
      chain(o, hp, lp, ampG, gainNode);
      return { sourceNode: o, gainNode, lfo: lfoOsc, extraNodes: [lp, hp, ampG, lfoG, ampLfo, ampLfoG] };
    }

    // ========== CREATURES ==========

    if (soundId === 'cultist_chant') {
      // Cultist chant: 3 detuned sawtooths in low octave, formant-filtered
      const o1 = osc('sawtooth', 110);
      const o2 = osc('sawtooth', 109.5); o2.start();
      const o3 = osc('sawtooth', 165);   o3.start();
      const g2 = gain(0.5); const g3 = gain(0.35);
      const f = bpf(500, 4);
      const lp = lpf(1200);
      const [lfoOsc, lfoG] = lfo(0.08, 10, o1.frequency);
      chain(o1, f, lp, gainNode);
      chain(o2, g2, gainNode); chain(o3, g3, gainNode);
      return { sourceNode: o1, gainNode, lfo: lfoOsc, extraNodes: [o2, o3, g2, g3, f, lp, lfoG] };
    }

    if (soundId === 'deep_one_gurgle') {
      // Deep One: wet bubbling gurgle — bandpass noise with fast tremolo
      const src = noise('brown', 2);
      const bp = bpf(400, 6);
      const [lfoOsc, lfoG] = lfo(7, 250, bp.frequency);
      const ampG = gain(0.8);
      const [ampLfo, ampLfoG] = lfo(5, 0.4, ampG.gain);
      chain(src, bp, ampG, gainNode);
      return { sourceNode: src, gainNode, lfo: lfoOsc, extraNodes: [bp, lfoG, ampG, ampLfo, ampLfoG] };
    }

    if (soundId === 'shoggoth_mass') {
      // Shoggoth: massive wet rumble + bubbling + sub-bass
      const rumble = noise('brown', 5);
      const rlp = lpf(100); const rg = gain(0.7);
      const bubble = noise('pink', 3);
      const blp = lpf(600); const bhp = hpf(200); const bg = gain(0.5);
      const sub = osc('sine', 28); sub.start();
      const sg = gain(0.6);
      chain(rumble, rlp, rg, gainNode);
      chain(bubble, bhp, blp, bg, gainNode);
      chain(sub, sg, gainNode);
      return { sourceNode: rumble, gainNode, lfo: sub, extraNodes: [rlp, rg, bubble, blp, bhp, bg, sg] };
    }

    if (soundId === 'byakhee_screech') {
      // Byakhee screech: harsh high sawtooth with fast vibrato + noise layer
      const o = osc('sawtooth', 1200);
      const hp = hpf(600); const lp = lpf(6000);
      const [lfoOsc, lfoG] = lfo(11, 400, o.frequency);
      const src = noise('white', 1);
      const nhp = hpf(5000); const ng = gain(0.15);
      chain(o, hp, lp, gainNode);
      chain(src, nhp, ng, gainNode);
      return { sourceNode: o, gainNode, lfo: lfoOsc, extraNodes: [hp, lp, lfoG, src, nhp, ng] };
    }

    if (soundId === 'elder_thing') {
      // Elder Presence: dissonant low tones beating against each other (binaural beats)
      const o1 = osc('sine', 40);
      const o2 = osc('sine', 43); o2.start();
      const o3 = osc('sine', 61); o3.start();
      const g2 = gain(0.5); const g3 = gain(0.3);
      o1.start();
      chain(o1, gainNode); chain(o2, g2, gainNode); chain(o3, g3, gainNode);
      return { sourceNode: o1, gainNode, lfo: o2, extraNodes: [o2, o3, g2, g3] };
    }

    if (soundId === 'ghoul_snarl') {
      // Ghoul: sawtooth growl with irregular pitch trembling
      const o = osc('sawtooth', 90);
      const lp = lpf(800); const hp = hpf(60);
      const [lfoOsc, lfoG] = lfo(8, 30, o.frequency);
      const ampG = gain(0.7);
      const [ampLfo, ampLfoG] = lfo(7, 0.3, ampG.gain);
      chain(o, hp, lp, ampG, gainNode);
      return { sourceNode: o, gainNode, lfo: lfoOsc, extraNodes: [lp, hp, lfoG, ampG, ampLfo, ampLfoG] };
    }

    if (soundId === 'mi_go_buzz') {
      // Mi-Go: insect-like buzz, high sawtooth with fast AM
      const o = osc('sawtooth', 420);
      const o2 = osc('sawtooth', 415); o2.start();
      const g2 = gain(0.4);
      const ampG = gain(0.5);
      const [ampLfo, ampLfoG] = lfo(18, 0.4, ampG.gain);
      chain(o, ampG, gainNode); chain(o2, g2, gainNode);
      return { sourceNode: o, gainNode, lfo: ampLfo, extraNodes: [o2, g2, ampG, ampLfoG] };
    }

    if (soundId === 'nightgaunt') {
      // Nightgaunt: silent, rustling wings — soft pink noise pulsing
      const src = noise('pink', 3);
      const lp = lpf(800); const hp = hpf(300);
      const ampG = gain(0.3);
      const [ampLfo, ampLfoG] = lfo(0.5, 0.2, ampG.gain);
      chain(src, hp, lp, ampG, gainNode);
      return { sourceNode: src, gainNode, lfo: ampLfo, extraNodes: [lp, hp, ampG, ampLfoG] };
    }

    // ========== MADNESS ==========

    if (soundId === 'sanity_loss') {
      // Sanity loss: high pitch rising sawtooth + distortion
      const o = osc('sawtooth', 300);
      const hp = hpf(800);
      o.frequency.setTargetAtTime(1200, ctx.currentTime, 0.8);
      const ampG = gain(0.8);
      ampG.gain.setTargetAtTime(0.1, ctx.currentTime, 1.5);
      chain(o, hp, ampG, gainNode);
      return { sourceNode: o, gainNode, extraNodes: [hp, ampG] };
    }

    if (soundId === 'distortion') {
      // Reality warp: detuned oscillator cluster with chorus effect
      const o1 = osc('sawtooth', 80);
      const o2 = osc('square', 81.5); o2.start();
      const o3 = osc('sawtooth', 121); o3.start();
      const g2 = gain(0.4); const g3 = gain(0.3);
      const lp = lpf(600);
      chain(o1, lp, gainNode); chain(o2, g2, gainNode); chain(o3, g3, gainNode);
      return { sourceNode: o1, gainNode, lfo: o2, extraNodes: [o2, o3, g2, g3, lp] };
    }

    if (soundId === 'tinnitus') {
      // Tinnitus: high-pitched narrow sine with slight wobble
      const o = osc('sine', 4500);
      const [lfoOsc, lfoG] = lfo(0.3, 80, o.frequency);
      const ampG = gain(0.6);
      chain(o, ampG, gainNode);
      return { sourceNode: o, gainNode, lfo: lfoOsc, extraNodes: [ampG, lfoG] };
    }

    if (soundId === 'laughter_mad') {
      // Mad laughter: sawtooth vowel-formant filtered with jerky rhythm
      const o = osc('sawtooth', 280);
      const f = bpf(1200, 5);
      const [lfoOsc, lfoG] = lfo(5, 120, o.frequency);
      const ampG = gain(0.6);
      const [ampLfo, ampLfoG] = lfo(8, 0.5, ampG.gain);
      chain(o, f, ampG, gainNode);
      return { sourceNode: o, gainNode, lfo: lfoOsc, extraNodes: [f, lfoG, ampG, ampLfo, ampLfoG] };
    }

    if (soundId === 'cosmic_drone') {
      // Cosmic drone: cluster of low sines with slow beating
      const freqs = [30, 45, 60, 90, 120];
      const amps  = [1.0, 0.6, 0.4, 0.25, 0.15];
      const oscs = freqs.map((f, i) => {
        const o = osc('sine', f + (i * 0.3));
        const g = gain(amps[i]);
        if (i > 0) { o.start(); chain(o, g, gainNode); }
        else chain(o, g, gainNode);
        return [o, g];
      });
      const extraNodes = oscs.slice(1).flatMap(([o,g]) => [o,g]);
      return { sourceNode: oscs[0][0], gainNode, extraNodes };
    }

    if (soundId === 'multiple_voices') {
      // Overlapping voices: 4 detuned formant voices
      const voices = [
        { freq: 160, formant: 700 },
        { freq: 190, formant: 1100 },
        { freq: 145, formant: 850 },
        { freq: 210, formant: 600 },
      ];
      const first = osc('sawtooth', voices[0].freq);
      const f0 = bpf(voices[0].formant, 5); const g0 = gain(0.4);
      chain(first, f0, g0, gainNode);
      const extras = [];
      voices.slice(1).forEach(v => {
        const o = osc('sawtooth', v.freq); o.start();
        const f = bpf(v.formant, 4); const g = gain(0.25);
        chain(o, f, g, gainNode);
        extras.push(o, f, g);
      });
      return { sourceNode: first, gainNode, extraNodes: [f0, g0, ...extras] };
    }

    // ========== EVENTS (one-shots) ==========

    if (soundId === 'door_open_creak') {
      // Creak: low sawtooth frequency sweep down (door hinge)
      const o = osc('sawtooth', 250);
      o.frequency.setTargetAtTime(80, ctx.currentTime, 0.4);
      const lp = lpf(1200); const hp = hpf(60);
      const ag = gain(0.8); ag.gain.setTargetAtTime(0.01, ctx.currentTime + 1.5, 0.3);
      chain(o, hp, lp, ag, gainNode);
      return { sourceNode: o, gainNode, extraNodes: [lp, hp, ag] };
    }

    if (soundId === 'door_slam') {
      // Slam: brown noise transient + low thud
      const bufLen = Math.floor(ctx.sampleRate * 0.8);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let b = 0;
      for (let i = 0; i < bufLen; i++) {
        const w = Math.random()*2-1; b = (b+0.02*w)/1.02;
        const t = i / ctx.sampleRate;
        const env = Math.exp(-t * 6);
        d[i] = b * 4 * env + Math.sin(2*Math.PI*80*t) * Math.exp(-t*10) * 1.5;
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const lp = lpf(800);
      chain(src, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp] };
    }

    if (soundId === 'glass_break') {
      // Glass: white noise transient + high freq ring
      const bufLen = Math.floor(ctx.sampleRate * 1.5);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        const t = i / ctx.sampleRate;
        d[i] = (Math.random()*2-1) * Math.exp(-t*5) +
               Math.sin(2*Math.PI*3500*t) * Math.exp(-t*8) * 0.3 +
               Math.sin(2*Math.PI*5200*t) * Math.exp(-t*12) * 0.2;
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const hp = hpf(2000);
      chain(src, hp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [hp] };
    }

    if (soundId === 'explosion') {
      // Explosion: huge brown noise burst with very low rumble
      const bufLen = Math.floor(ctx.sampleRate * 3);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let b = 0;
      for (let i = 0; i < bufLen; i++) {
        const w = Math.random()*2-1; b = (b+0.02*w)/1.02;
        const t = i / ctx.sampleRate;
        const env = Math.exp(-t * 1.2);
        d[i] = b * 6 * env;
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const lp = lpf(300); const hp = hpf(20);
      chain(src, hp, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp, hp] };
    }

    if (soundId === 'gunshot') {
      // Gunshot: sharp crack (white noise) + low boom tail
      const bufLen = Math.floor(ctx.sampleRate * 1.0);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        const t = i / ctx.sampleRate;
        const crack = (Math.random()*2-1) * Math.exp(-t*40);
        const boom  = Math.sin(2*Math.PI*80*t) * Math.exp(-t*5) * 0.8;
        d[i] = crack + boom;
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      src.connect(gainNode);
      return { sourceNode: src, gainNode, extraNodes: [] };
    }

    if (soundId === 'collapse') {
      // Cave collapse: sustained brown noise rumble with falling debris
      const bufLen = Math.floor(ctx.sampleRate * 3.5);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let b = 0;
      for (let i = 0; i < bufLen; i++) {
        const w = Math.random()*2-1; b = (b+0.02*w)/1.02;
        const t = i / ctx.sampleRate;
        const env = (1 - t/3.5) * 0.8 + 0.2;
        d[i] = b * 5 * env + (Math.random()-0.5) * 0.15;
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const lp = lpf(600);
      chain(src, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp] };
    }

    if (soundId === 'chase_music') {
      // Chase: fast sawtooth ostinato with rhythmic amplitude
      const o = osc('sawtooth', 150);
      const lp = lpf(1500);
      const [lfoOsc, lfoG] = lfo(6, 40, o.frequency);
      const ampG = gain(0.6);
      const [ampLfo, ampLfoG] = lfo(8, 0.35, ampG.gain);
      chain(o, lp, ampG, gainNode);
      return { sourceNode: o, gainNode, lfo: lfoOsc, extraNodes: [lp, lfoG, ampG, ampLfo, ampLfoG] };
    }

    if (soundId === 'combat_drums') {
      // Drums: tight kick pattern at 160bpm
      const interval = 60 / 160;
      const bufLen = Math.floor(ctx.sampleRate * interval);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const drumLen = Math.floor(ctx.sampleRate * 0.06);
      for (let i = 0; i < drumLen; i++) {
        const t = i / ctx.sampleRate;
        d[i] = Math.sin(2*Math.PI*100*t) * Math.exp(-t*60) * 1.5 +
               (Math.random()*2-1) * Math.exp(-t*80) * 0.4;
      }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = lpf(500);
      chain(src, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp] };
    }

    if (soundId === 'investigation') {
      // Investigation: slow mysterious piano-like tones
      const notes = [196, 220, 246, 220, 196, 175];
      const dur = 1.2;
      const bufLen = Math.floor(ctx.sampleRate * notes.length * dur);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      notes.forEach((freq, idx) => {
        const start = Math.floor(idx * dur * ctx.sampleRate);
        const len = Math.floor(dur * ctx.sampleRate);
        for (let i = 0; i < len && start+i < bufLen; i++) {
          const t = i / ctx.sampleRate;
          d[start+i] = Math.sin(2*Math.PI*freq*t) * Math.exp(-t*1.5) * 0.7;
        }
      });
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = lpf(4000);
      chain(src, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp] };
    }

    if (soundId === 'discovery') {
      const bufLen = Math.floor(ctx.sampleRate * 2);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const chords = [
        [261, 329, 392],
        [294, 370, 440],
        [330, 415, 494],
      ];
      const chordDur = Math.floor(ctx.sampleRate * 0.6);
      chords.forEach((chord, ci) => {
        const start = ci * chordDur;
        for (let i = 0; i < chordDur && start+i < bufLen; i++) {
          const t = i / ctx.sampleRate;
          const env = Math.exp(-t*1.5);
          chord.forEach(f => { d[start+i] += Math.sin(2*Math.PI*f*t) * env * 0.3; });
        }
      });
      const src = ctx.createBufferSource(); src.buffer = buf;
      src.connect(gainNode);
      return { sourceNode: src, gainNode, extraNodes: [] };
    }

    if (soundId === 'lock_pick') {
      // Lock pick: quiet metallic scraping clicks
      const bufLen = Math.floor(ctx.sampleRate * 1.5);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let c = 0; c < 5; c++) {
        const offset = Math.floor((c / 5 + 0.05) * bufLen);
        const len = Math.floor(ctx.sampleRate * 0.04);
        for (let i = 0; i < len && offset+i < bufLen; i++) {
          const t = i / ctx.sampleRate;
          d[offset+i] = (Math.random()*2-1) * Math.exp(-t*50) * 0.8;
        }
      }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const hp = hpf(2000); const lp = lpf(8000);
      chain(src, hp, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [hp, lp] };
    }

    if (soundId === 'falling') {
      const bufLen = Math.floor(ctx.sampleRate * 2.5);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        const t = i / ctx.sampleRate;
        const freq = 400 * Math.exp(-t * 1.2);
        d[i] = Math.sin(2*Math.PI*freq*t) * (1 - t/2.5) * 0.7 +
               (Math.random()*2-1) * (1-t/2.5) * 0.2;
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      src.connect(gainNode);
      return { sourceNode: src, gainNode, extraNodes: [] };
    }

    // ========== JUMP SCARES ==========

    if (soundId === 'jump_slam' || soundId === 'jump_bang') {
      const bufLen = Math.floor(ctx.sampleRate * 0.6);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let b = 0;
      for (let i = 0; i < bufLen; i++) {
        const w = Math.random()*2-1; b=(b+0.02*w)/1.02;
        const t = i/ctx.sampleRate;
        d[i] = b*6*Math.exp(-t*8) + Math.sin(2*Math.PI*60*t)*Math.exp(-t*12)*2;
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const lp = lpf(500);
      chain(src, lp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [lp] };
    }

    if (soundId === 'jump_scream') {
      const o = osc('sawtooth', 900);
      o.frequency.setTargetAtTime(250, ctx.currentTime, 0.4);
      const hp = hpf(400); const lp = lpf(4000);
      const ag = gain(1.0); ag.gain.setTargetAtTime(0.01, ctx.currentTime+1, 0.3);
      chain(o, hp, lp, ag, gainNode);
      return { sourceNode: o, gainNode, extraNodes: [hp, lp, ag] };
    }

    if (soundId === 'jump_shatter') {
      const bufLen = Math.floor(ctx.sampleRate * 1.2);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        const t = i/ctx.sampleRate;
        d[i] = (Math.random()*2-1) * Math.exp(-t*4) * 0.9 +
               Math.sin(2*Math.PI*4500*t)*Math.exp(-t*10)*0.3;
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const hp = hpf(3000);
      chain(src, hp, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [hp] };
    }

    if (soundId === 'jump_roar') {
      const o = osc('sawtooth', 120);
      const lp = lpf(600); const hp = hpf(50);
      const [lfoOsc, lfoG] = lfo(10, 50, o.frequency);
      const ag = gain(1.0); ag.gain.setTargetAtTime(0.01, ctx.currentTime+1.5, 0.5);
      chain(o, hp, lp, ag, gainNode);
      return { sourceNode: o, gainNode, lfo: lfoOsc, extraNodes: [lp, hp, ag, lfoG] };
    }

    if (soundId === 'jump_whisper') {
      const src = noise('pink', 0.5);
      const bp = bpf(1800, 4);
      const ag = gain(0.9); ag.gain.setTargetAtTime(0.01, ctx.currentTime+0.8, 0.2);
      chain(src, bp, ag, gainNode);
      return { sourceNode: src, gainNode, extraNodes: [bp, ag] };
    }

    // Fallback
    const src2 = noise('pink', 3);
    const lp2 = lpf(1200);
    chain(src2, lp2, gainNode);
    return { sourceNode: src2, gainNode, extraNodes: [lp2] };
  }

  play(soundId, title, volume = 0.8, loop = true) {
    this._ensureContext();

    if (this.activeSounds.has(soundId)) {
      this.setVolume(soundId, volume);
      return;
    }

    const { sourceNode, gainNode, lfo, extraNodes = [] } = this._buildSoundGraph(soundId);

    gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.5);
    sourceNode.loop = !!loop;
    sourceNode.start();

    this.activeSounds.set(soundId, {
      source: sourceNode, gainNode, lfo, extraNodes,
      isPlaying: true, volume, title, loop,
    });
    this._notify();
  }

  stop(soundId, fadeTime = 0.5) {
    const sound = this.activeSounds.get(soundId);
    if (!sound) return;

    const { gainNode, source, lfo, extraNodes = [] } = sound;
    gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, fadeTime / 4);

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
    gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 3);
    sourceNode.start();
    setTimeout(() => {
      try { sourceNode.stop(); } catch(e) {}
      try { if (lfo) lfo.stop(); } catch(e) {}
      extraNodes.forEach(n => { try { if (n.stop) n.stop(); } catch(e) {} });
    }, 3500);
  }

  panic() {
    this._ensureContext();
    this.trigger('jump_slam', 'SLAM');
    setTimeout(() => this.trigger('jump_scream', 'SCREAM'), 100);
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 600]);
  }
}

export const audioEngine = new AudioEngine();