// ─────────────────────────────────────────────────────────────
// ШАР СХОВИЩА (V3) — ЄДИНА точка доступу до даних користувача.
// Дані живуть у хмарі Base44 (entity UserPrefs, один документ на
// користувача) і синхронізуються між пристроями. У памʼяті тримаємо
// синхронний кеш, тому існуючі геттери storage.getX() лишаються
// синхронними; сеттери оновлюють кеш миттєво й пишуть у хмару (debounced).
//
// storage.init() треба викликати один раз після логіну: завантажує
// документ із хмари і — при першому вході — переносить дані з localStorage.
// ─────────────────────────────────────────────────────────────
import { base44 } from '@/api/base44Client';

// Старі ключі localStorage — лише для одноразової міграції.
const LEGACY_KEYS = {
  favorites: 'keeper_favorites',
  lang: 'keeper_lang',
  masterVolume: 'keeper_master_volume',
  soundOverrides: 'keeper_sound_overrides',
  padFiles: 'keeper_pad_files',
};

const DEFAULTS = {
  favorites: [],
  lang: 'en',
  master_volume: null,
  sound_overrides: {},
  pad_files: {},
  migrated_from_local: false,
};

// Синхронний кеш у памʼяті. До init() віддаємо дефолти.
let cache = { ...DEFAULTS };
let recordId = null;
let ready = false;

const listeners = new Set();
function notify() {
  for (const fn of listeners) fn(cache);
}

// ── Debounced запис у хмару ──
let saveTimer = null;
let pending = {};
function scheduleSave(patch) {
  pending = { ...pending, ...patch };
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 400);
}
async function flush() {
  saveTimer = null;
  const data = pending;
  pending = {};
  if (Object.keys(data).length === 0) return;
  try {
    if (recordId) {
      await base44.entities.UserPrefs.update(recordId, data);
    } else {
      const created = await base44.entities.UserPrefs.create({ ...cache });
      recordId = created.id;
    }
  } catch {
    /* офлайн / помилка мережі — кеш лишається актуальним локально */
  }
}

function set(key, value) {
  cache = { ...cache, [key]: value };
  scheduleSave({ [key]: value });
  notify();
}

function readLegacyJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export const storage = {
  // Викликати один раз після успішного логіну.
  async init() {
    if (ready) return cache;
    try {
      const rows = await base44.entities.UserPrefs.list('-created_date', 1);
      if (rows && rows.length > 0) {
        const r = rows[0];
        recordId = r.id;
        cache = {
          favorites: r.favorites ?? DEFAULTS.favorites,
          lang: r.lang ?? DEFAULTS.lang,
          master_volume: typeof r.master_volume === 'number' ? r.master_volume : DEFAULTS.master_volume,
          sound_overrides: r.sound_overrides ?? DEFAULTS.sound_overrides,
          pad_files: r.pad_files ?? DEFAULTS.pad_files,
          migrated_from_local: !!r.migrated_from_local,
        };
      }
      // Одноразова міграція з localStorage у хмарний документ.
      if (!cache.migrated_from_local) {
        const legacy = {
          favorites: readLegacyJSON(LEGACY_KEYS.favorites, null),
          lang: (() => { try { return localStorage.getItem(LEGACY_KEYS.lang); } catch { return null; } })(),
          master_volume: readLegacyJSON(LEGACY_KEYS.masterVolume, null),
          sound_overrides: readLegacyJSON(LEGACY_KEYS.soundOverrides, null),
          pad_files: readLegacyJSON(LEGACY_KEYS.padFiles, null),
        };
        const merged = { migrated_from_local: true };
        if (Array.isArray(legacy.favorites) && legacy.favorites.length) merged.favorites = legacy.favorites;
        if (legacy.lang) merged.lang = legacy.lang;
        if (typeof legacy.master_volume === 'number') merged.master_volume = legacy.master_volume;
        if (legacy.sound_overrides && Object.keys(legacy.sound_overrides).length) merged.sound_overrides = legacy.sound_overrides;
        if (legacy.pad_files && Object.keys(legacy.pad_files).length) merged.pad_files = legacy.pad_files;
        cache = { ...cache, ...merged };
        // Зберегти результат міграції (створить документ, якщо його ще немає).
        try {
          if (recordId) await base44.entities.UserPrefs.update(recordId, merged);
          else { const created = await base44.entities.UserPrefs.create({ ...cache }); recordId = created.id; }
        } catch { /* ignore */ }
      }
    } catch {
      /* не вдалося завантажити — працюємо на дефолтах + кеші */
    }
    ready = true;
    notify();
    return cache;
  },

  // Підписка на зміни (для реактивних хуків).
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  isReady: () => ready,

  // Улюблені сцени (масив id)
  getFavorites: () => cache.favorites,
  setFavorites: (ids) => set('favorites', ids),

  // Мова інтерфейсу ('en' | 'ru' | 'ua')
  getLang: () => cache.lang || 'en',
  setLang: (code) => set('lang', code),

  // Гучність майстра (число 0..1, або null якщо не задано)
  getMasterVolume: () => cache.master_volume,
  setMasterVolume: (v) => set('master_volume', v),

  // Перевизначення метаданих звуку: { [soundId]: { baseVolume?, notes?, verified? } }
  getSoundOverrides: () => cache.sound_overrides,
  setSoundOverrides: (map) => set('sound_overrides', map),

  // Користувацькі MP3, прив'язані до пэда: { [soundId]: { url, name } }
  getPadFiles: () => cache.pad_files,
  setPadFiles: (map) => set('pad_files', map),
};