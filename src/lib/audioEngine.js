// Web Audio Engine — manages multiple concurrent audio layers
import { storage } from './storage';
import { buildSoundGraph } from './synthGraphs';

class AudioEngine {
  constructor() {
    this.activeSounds = new Map();
    // Відновити збережену гучність майстра (шар storage), інакше 1.0
    const saved = storage.getMasterVolume();
    this.masterVolume = typeof saved === 'number' ? saved : 1.0;
    this.listeners = new Set();
    this.audioContext = null;
    this.masterGain = null;
    // C3: мягкий лимит одновременных голосов (лупов). При превышении
    // вытесняется самый старый. _seq — монотонный счётчик порядка запуска.
    this.maxVoices = 16;
    this._seq = 0;
    // Кэш згенерованих буферів шуму за ключем `${type}:${duration}`.
    // Шум статистично однаковий від запуску до запуску, тож пере생енерація
    // на кожен play() — марна трата CPU у момент старту (а старт має
    // бути миттєвим). Буфери імутабельні й можуть переюзатись багатьма source.
    this._noiseCache = new Map();
  }

  _cachedNoise(type, duration) {
    const key = `${type}:${duration}`;
    let buf = this._noiseCache.get(key);
    if (!buf) {
      if (type === 'white') buf = this._whiteNoise(duration);
      else if (type === 'pink') buf = this._pinkNoise(duration);
      else buf = this._brownNoise(duration);
      this._noiseCache.set(key, buf);
    }
    return buf;
  }

  // C3: если активных лупов >= лимита, останавливаем самый ранний запущенный.
  _enforceVoiceLimit() {
    if (this.activeSounds.size < this.maxVoices) return;
    let oldestId = null;
    let oldestSeq = Infinity;
    this.activeSounds.forEach((val, key) => {
      if (val.seq < oldestSeq) { oldestSeq = val.seq; oldestId = key; }
    });
    if (oldestId) this.stop(oldestId, 0.2);
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

  // iOS Safari: Web Audio звучит только если контекст разблокирован СИНХРОННО
  // внутри пользовательского жеста. Последующее воспроизведение через async
  // decode уже разрешено. Вызывать строго из обработчика тапа (без await до этого).
  unlock() {
    this._ensureContext();
    const ctx = this.audioContext;
    if (ctx.state === 'suspended') ctx.resume();
    // Проигрываем тишину 1 семпл — это «активирует» аудиовыход в Safari.
    try {
      const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch (e) {}
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

  // Синтез-рецепты вынесены в ./synthGraphs.js (движок был выше лимита
  // редактируемости). Логика идентична: передаём контекст, общий gain и
  // кэш шума. Кэш шума прокидываем через bound-метод _cachedNoise.
  _buildSoundGraph(soundId) {
    return buildSoundGraph(
      this.audioContext,
      this.masterGain,
      soundId,
      (type, dur) => this._cachedNoise(type, dur),
    );
  }

  // Предзагрузка файла в кэш браузера, чтобы первый запуск был мгновенным.
  // Держим скрытый <audio preload="auto"> по url; повторные вызовы — no-op.
  preloadFile(url) {
    if (!url) return;
    if (!this._preloaded) this._preloaded = new Map();
    if (this._preloaded.has(url)) return;
    const el = new Audio();
    el.preload = 'auto';
    el.src = url;
    try { el.load(); } catch (e) {}
    this._preloaded.set(url, el);
    // Ограничиваем кэш предзагрузки, чтобы не плодить элементы без меры.
    if (this._preloaded.size > 64) {
      const firstKey = this._preloaded.keys().next().value;
      const old = this._preloaded.get(firstKey);
      try { old.src = ''; old.load(); } catch (e) {}
      this._preloaded.delete(firstKey);
    }
  }

  // Всегда создаём СВЕЖИЙ <audio> для воспроизведения прямо в обработчике тапа.
  //
  // Раньше мы переиспользовали элемент из пула preload — но такой элемент не
  // получал прямого пользовательского жеста, и на мобильных (iOS) его play()
  // молча отклонялся autoplay-политикой: запись попадала в реестр (эквалайзер
  // горит), а звука не было. Именно поэтому «молчали» только верхние звуки,
  // попавшие в preload, а нижние — играли.
  //
  // Файл уже лежит в HTTP-кэше браузера благодаря preloadFile(url), поэтому
  // свежий элемент стартует так же быстро, но play() вызывается строго по жесту.
  _takePreloaded(url) {
    return new Audio(url || '');
  }

  // Загружаем и декодируем файл в AudioBuffer (с кэшем). Тот же путь, что и
  // визуализация волны, поэтому если волна рисуется — буфер точно валиден,
  // а значит и звук пойдёт. Решает баг «волна есть, звука нет» (когда <audio>
  // молча не проигрывал WAV/длинные файлы).
  async _decodeFile(url) {
    if (!this._bufferCache) this._bufferCache = new Map();
    if (this._bufferCache.has(url)) return this._bufferCache.get(url);
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    // iOS Safari: контекст должен быть resumed до decode, иначе MP3 не декодируется.
    if (this.audioContext.state === 'suspended') { try { await this.audioContext.resume(); } catch (e) {} }
    // Safari поддерживает только callback-форму decodeAudioData — поддерживаем обе.
    const buf = await new Promise((resolve, reject) => {
      let settled = false;
      const ok = (b) => { if (!settled) { settled = true; resolve(b); } };
      const fail = (e) => { if (!settled) { settled = true; reject(e || new Error('decode failed')); } };
      const p = this.audioContext.decodeAudioData(arr, ok, fail);
      if (p && typeof p.then === 'function') p.then(ok, fail);
    });
    this._bufferCache.set(url, buf);
    // Ограничиваем кэш буферов, чтобы не раздувать память.
    if (this._bufferCache.size > 48) {
      const firstKey = this._bufferCache.keys().next().value;
      this._bufferCache.delete(firstKey);
    }
    return buf;
  }

  // ── Воспроизведение загруженного аудиофайла через нативный <audio> ──
  // decodeAudioData в ряде браузеров (Firefox, часть мобильных) падает на
  // конкретных MP3 («decode failed»), из-за чего звука нет, хотя файл валиден.
  // HTMLAudioElement декодирует MP3 встроенным кодеком и работает везде.
  // Громкость и loop задаём прямо на элементе, мастер-громкость множим вручную.
  playFile(soundId, url, title, volume = 0.8, loop = true, onError) {
    if (this.activeSounds.has(soundId)) {
      this.setVolume(soundId, volume);
      return;
    }
    const seq = this._seq++;
    const el = this._takePreloaded(url);
    el.loop = !!loop;
    el.volume = Math.max(0, Math.min(1, volume * this.masterVolume));
    try { el.currentTime = 0; } catch (e) {}
    const onErr = () => {
      const err = el.error;
      onError?.(`audio error code=${err?.code ?? '?'} · ${err?.message || 'no message'}`);
    };
    el._onErr = onErr;
    el.addEventListener('error', onErr);
    el.play().then(() => onError?.(null)).catch((e) => {
      // AbortError — нормально: play() прерван новым pause(), не ошибка. Тихо выходим.
      if (e?.name === 'AbortError') return;
      onError?.(`play() rejected: ${e?.name || ''} ${e?.message || String(e)}`);
      // play() отклонён — убираем запись, чтобы эквалайзер не «горел» вхолостую.
      if (this.activeSounds.get(soundId)?.el === el) {
        this.activeSounds.delete(soundId);
        this._notify();
      }
    });

    this.activeSounds.set(soundId, {
      el, isPlaying: true, volume, title, loop, isFile: true, seq,
    });
    this._enforceVoiceLimit();
    this._notify();
  }

  // Одноразовое воспроизведение загруженного файла (one-shot пэд).
  // По окончании само-удаляется из реестра.
  triggerFile(soundId, url, title = '', volume = 1.0, onError) {
    if (this.activeSounds.has(soundId)) this.stop(soundId, 0);
    const seq = this._seq++;
    const el = this._takePreloaded(url);
    el.loop = false;
    el.volume = Math.max(0, Math.min(1, volume * this.masterVolume));
    try { el.currentTime = 0; } catch (e) {}
    el.addEventListener('ended', () => {
      if (this.activeSounds.get(soundId)?.el === el) {
        this.activeSounds.delete(soundId);
        this._notify();
      }
    });
    const onErr = () => {
      const err = el.error;
      onError?.(`audio error code=${err?.code ?? '?'} · ${err?.message || 'no message'}`);
    };
    el._onErr = onErr;
    el.addEventListener('error', onErr);
    el.play().then(() => onError?.(null)).catch((e) => {
      // AbortError — нормально: play() прерван новым pause(), не ошибка. Тихо выходим.
      if (e?.name === 'AbortError') return;
      onError?.(`play() rejected: ${e?.name || ''} ${e?.message || String(e)}`);
      if (this.activeSounds.get(soundId)?.el === el) {
        this.activeSounds.delete(soundId);
        this._notify();
      }
    });

    this.activeSounds.set(soundId, {
      el, isPlaying: true, volume, title, loop: false, isFile: true, seq,
    });
    this._notify();
  }

  play(soundId, title, volume = 0.8, loop = true) {
    this._ensureContext();

    if (this.activeSounds.has(soundId)) {
      this.setVolume(soundId, volume);
      return;
    }
    // Резервуємо id одразу, щоб швидкий повторний тап не побудував граф вдруге
    // (інакше один source-вузол може отримати start() двічі → InvalidStateError).
    // seq вираховуємо ОДИН раз і переюзаємо у фінальному записі (раніше тут був
    // подвійний інкремент → одне значення послідовності прожигалось вхолосту).
    const seq = this._seq++;
    this.activeSounds.set(soundId, { isPlaying: true, volume, title, loop, seq });
    this._enforceVoiceLimit();

    const { sourceNode, gainNode, lfo, extraNodes = [] } = this._buildSoundGraph(soundId);

    gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.5);
    sourceNode.loop = !!loop;
    try { sourceNode.start(); } catch (e) { /* вузол уже стартований — ігноруємо */ }

    this.activeSounds.set(soundId, {
      source: sourceNode, gainNode, lfo, extraNodes,
      isPlaying: true, volume, title, loop, seq,
    });
    this._notify();
  }

  stop(soundId, fadeTime = 0.5) {
    const sound = this.activeSounds.get(soundId);
    if (!sound) return;
    if (sound.isPlaying === false) return; // вже зупиняється — не запускаємо фейд вдруге

    const { gainNode, source, lfo, extraNodes = [], el } = sound;

    // Файловый звук через <audio>: плавно гасим громкость и останавливаем.
    if (el) {
      sound.isPlaying = false;
      this._notify();
      // Снимаем error-листенер ДО остановки — иначе pause/сброс мог бы
      // выстрелить ложной ошибкой code=4 в UI.
      if (el._onErr) { try { el.removeEventListener('error', el._onErr); } catch (e) {} el._onErr = null; }
      // НЕ зануляем el.src — это ломает элемент (code=4) и портит пул preload.
      // Достаточно pause; элемент дальше переиспользуется или соберётся GC.
      const finish = () => {
        try { el.pause(); el.currentTime = 0; } catch (e) {}
        this.activeSounds.delete(soundId);
        this._notify();
      };
      const start = el.volume;
      const steps = 8;
      let i = 0;
      const tick = () => {
        i++;
        el.volume = Math.max(0, start * (1 - i / steps));
        if (i < steps) { setTimeout(tick, (fadeTime * 1000) / steps); }
        else finish();
      };
      if (fadeTime > 0) tick();
      else finish();
      return;
    }

    // Граф ще не побудований (зарезервований id) — просто знімаємо запис.
    if (!gainNode) {
      this.activeSounds.delete(soundId);
      this._notify();
      return;
    }
    gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, fadeTime / 4);

    setTimeout(() => {
      try { source.stop(); } catch (e) {}
      try { if (lfo) lfo.stop(); } catch (e) {}
      extraNodes.forEach(n => { try { if (n.stop) n.stop(); } catch (e) {} });
      // Полностью освобождаем граф (файлы обработаны выше и сюда не доходят).
      try { gainNode.disconnect(); } catch (e) {}
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
    if (sound.el) {
      sound.el.volume = Math.max(0, Math.min(1, volume * this.masterVolume));
    } else if (sound.gainNode) {
      sound.gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
    }
    this._notify();
  }

  // Применить мастер-громкость к активным <audio>-звукам (граф — через masterGain).
  _applyMasterToElements() {
    this.activeSounds.forEach((s) => {
      if (s.el && s.isPlaying !== false) {
        s.el.volume = Math.max(0, Math.min(1, s.volume * this.masterVolume));
      }
    });
  }

  setMasterVolume(volume) {
    this.masterVolume = volume;
    storage.setMasterVolume(volume); // персист через шар storage
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
    }
    this._applyMasterToElements();
    this._notify();
  }

  // Застосувати гучність із хмари без зворотного запису (уникаємо циклу збереження).
  setMasterVolumeFromCloud(volume) {
    this.masterVolume = volume;
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
    }
    this._applyMasterToElements();
    this._notify();
  }

  isPlaying(soundId) {
    const s = this.activeSounds.get(soundId);
    return !!s && s.isPlaying !== false;
  }

  // Відновити AudioContext після повернення з фону (M5).
  // На мобільних контекст часто переходить у 'suspended' — без resume звук
  // не відновлюється, поки користувач не торкнеться екрана.
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
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

// Застосувати гучність майстра після завантаження хмарних налаштувань (V3).
storage.subscribe(() => {
  const saved = storage.getMasterVolume();
  if (typeof saved === 'number' && saved !== audioEngine.masterVolume) {
    audioEngine.setMasterVolumeFromCloud(saved);
  }
});