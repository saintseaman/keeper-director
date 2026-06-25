// ─────────────────────────────────────────────────────────────
// ШАР СХОВИЩА (Milestone 3) — ЄДИНА точка доступу до localStorage.
// Жоден компонент не звертається до localStorage напряму.
// Замінне: щоб перейти на хмару Base44 — переписується лише цей файл.
// ─────────────────────────────────────────────────────────────

const KEYS = {
  favorites: 'keeper_favorites',
  lang: 'keeper_lang',
  masterVolume: 'keeper_master_volume',
  soundOverrides: 'keeper_sound_overrides',
  padFiles: 'keeper_pad_files',
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* сховище недоступне (приватний режим) — мовчки ігноруємо */
  }
}

export const storage = {
  // Улюблені сцени (масив id)
  getFavorites: () => readJSON(KEYS.favorites, []),
  setFavorites: (ids) => writeJSON(KEYS.favorites, ids),

  // Мова інтерфейсу (рядок: 'en' | 'ru' | 'ua')
  getLang: () => {
    try { return localStorage.getItem(KEYS.lang) || 'en'; } catch { return 'en'; }
  },
  setLang: (code) => {
    try { localStorage.setItem(KEYS.lang, code); } catch { /* ignore */ }
  },

  // Гучність майстра (число 0..1)
  getMasterVolume: () => readJSON(KEYS.masterVolume, null),
  setMasterVolume: (v) => writeJSON(KEYS.masterVolume, v),

  // Користувацькі перевизначення метаданих звуку (режим Edit, M4).
  // Формат: { [soundId]: { baseVolume?, notes?, verified? } }.
  // Каталог SOUNDS незмінний — правки живуть окремим шаром.
  getSoundOverrides: () => readJSON(KEYS.soundOverrides, {}),
  setSoundOverrides: (map) => writeJSON(KEYS.soundOverrides, map),

  // Користувацькі аудіофайли (MP3), прив'язані до пэда.
  // Формат: { [soundId]: { url, name } }.
  getPadFiles: () => readJSON(KEYS.padFiles, {}),
  setPadFiles: (map) => writeJSON(KEYS.padFiles, map),
};