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
  custom_pads: [],
  custom_pads_migrated: false,
  custom_axis_values: {},
  removed_axis_values: {},
  scenes: [],
  recent_pads: [],
  pad_favorites: [],
  mix_presets: [],
  effect_slots: [],
  tile_sounds: {},
  migrated_from_local: false,
};

// Синхронний кеш у памʼяті. До init() віддаємо дефолти.
let cache = { ...DEFAULTS };
let recordId = null;
let ready = false;

// Бібліотека пэдів живе в окремій сущності Pad (один запис = один звук),
// а не в полі custom_pads документа UserPrefs. Це дає часткові оновлення,
// індексацію й масштаб на тисячі звуків без перезапису величезного масиву.
// У памʼяті тримаємо ту саму форму { id, title, url, category, icon },
// тож усі споживачі (getCustomPads / useCustomPads) лишаються незмінними.
// padRecordId зіставляє app-level id пэда з id запису сущності Pad.
const padRecordId = new Map();
function toCachePad(rec) {
  return {
    id: rec.pad_id, title: rec.title, url: rec.url, category: rec.category, icon: rec.icon,
    isLoopable: rec.is_loopable, isEffect: !!rec.is_effect, axes: rec.axes || {}, tags: rec.tags || [],
  };
}
function toEntityPad(p) {
  const rec = {
    pad_id: p.id, title: p.title || '', url: p.url || '', category: p.category || '', icon: p.icon || '',
    axes: p.axes || {}, tags: p.tags || [],
  };
  if (typeof p.isLoopable === 'boolean') rec.is_loopable = p.isLoopable;
  if (typeof p.isEffect === 'boolean') rec.is_effect = p.isEffect;
  return rec;
}

// Постранична виборка ВСІХ пэдів — без потолка в 1000 записів.
// Бібліотека може містити десятки тисяч звуків; читаємо сторінками по 1000,
// поки сторінка повертає повний розмір.
async function fetchAllPads() {
  const PAGE = 1000;
  const all = [];
  let skip = 0;
  // Захист від нескінченного циклу: щонайбільше 200 сторінок (200k звуків).
  for (let guard = 0; guard < 200; guard++) {
    const page = await base44.entities.Pad.list('-created_date', PAGE, skip);
    if (!page || page.length === 0) break;
    all.push(...page);
    if (page.length < PAGE) break;
    skip += PAGE;
  }
  return all;
}

const listeners = new Set();
function notify() {
  for (const fn of listeners) fn(cache);
}

// ── Статус синхронизации с облаком (для индикатора в UI) ──
// 'idle' | 'saving' | 'saved' | 'error'. Подписка отдельная от данных,
// чтобы перерисовывался только индикатор, а не потребители данных.
let saveStatus = 'idle';
const statusListeners = new Set();
function setStatus(s) {
  saveStatus = s;
  for (const fn of statusListeners) fn(s);
}
let savedResetTimer = null;

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
  setStatus('saving');
  try {
    if (recordId) {
      await base44.entities.UserPrefs.update(recordId, data);
    } else {
      const created = await base44.entities.UserPrefs.create({ ...cache });
      recordId = created.id;
    }
    setStatus('saved');
    // Через пару секунд гасим индикатор «сохранено».
    if (savedResetTimer) clearTimeout(savedResetTimer);
    savedResetTimer = setTimeout(() => setStatus('idle'), 2000);
  } catch {
    // Офлайн / ошибка сети — кеш актуален локально, но пользователь должен
    // знать, что изменения ещё не в облаке. Возвращаем данные в очередь и ретраим.
    pending = { ...data, ...pending };
    setStatus('error');
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 5000);
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
          custom_pads: r.custom_pads ?? DEFAULTS.custom_pads,
          custom_pads_migrated: !!r.custom_pads_migrated,
          custom_axis_values: r.custom_axis_values ?? DEFAULTS.custom_axis_values,
          removed_axis_values: r.removed_axis_values ?? DEFAULTS.removed_axis_values,
          scenes: r.scenes ?? DEFAULTS.scenes,
          recent_pads: r.recent_pads ?? DEFAULTS.recent_pads,
          pad_favorites: r.pad_favorites ?? DEFAULTS.pad_favorites,
          mix_presets: r.mix_presets ?? DEFAULTS.mix_presets,
          effect_slots: r.effect_slots ?? DEFAULTS.effect_slots,
          tile_sounds: r.tile_sounds ?? DEFAULTS.tile_sounds,
          migrated_from_local: !!r.migrated_from_local,
        };
      }
      // ── Бібліотека пэдів: завантаження із сущності Pad (+ одноразова міграція) ──
      try {
        let padRecs = await fetchAllPads();
        // Якщо записів Pad немає, але в старому полі custom_pads щось є —
        // переносимо у нову сущність (раз) і працюємо далі вже з нею.
        if ((!padRecs || padRecs.length === 0) && (cache.custom_pads || []).length && !cache.custom_pads_migrated) {
          const toCreate = cache.custom_pads.map(toEntityPad);
          for (let i = 0; i < toCreate.length; i += 100) {
            await base44.entities.Pad.bulkCreate(toCreate.slice(i, i + 100));
          }
          padRecs = await fetchAllPads();
          if (recordId) {
            try { await base44.entities.UserPrefs.update(recordId, { custom_pads_migrated: true }); } catch { /* ignore */ }
          }
        }
        padRecordId.clear();
        for (const rec of padRecs || []) padRecordId.set(rec.pad_id, rec.id);
        cache.custom_pads = (padRecs || []).map(toCachePad);
      } catch {
        // Не вдалося — лишаємо те, що було в custom_pads (read-only режим).
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

  // Статус синхронизации с облаком + подписка (для индикатора в UI).
  getSaveStatus: () => saveStatus,
  subscribeSaveStatus(fn) {
    statusListeners.add(fn);
    return () => statusListeners.delete(fn);
  },

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

  // Власні пэди — тепер живуть у сущності Pad. Геттер віддає кеш у тій
  // самій формі { id, title, url, category, icon }, тож споживачі незмінні.
  getCustomPads: () => cache.custom_pads || [],

  // Додати/оновити пэди (часткові записи в сущність Pad, без перезапису масиву).
  async addPadsCloud(incoming) {
    const byId = new Map((cache.custom_pads || []).map((p) => [p.id, p]));
    const toCreate = [];
    for (const p of incoming) {
      if (!byId.has(p.id)) toCreate.push(p);
      byId.set(p.id, { ...byId.get(p.id), ...p });
    }
    cache = { ...cache, custom_pads: Array.from(byId.values()) };
    notify();
    if (toCreate.length) {
      setStatus('saving');
      try {
        for (let i = 0; i < toCreate.length; i += 100) {
          const chunk = toCreate.slice(i, i + 100);
          const created = await base44.entities.Pad.bulkCreate(chunk.map(toEntityPad));
          (created || []).forEach((rec) => padRecordId.set(rec.pad_id, rec.id));
        }
        setStatus('saved');
        if (savedResetTimer) clearTimeout(savedResetTimer);
        savedResetTimer = setTimeout(() => setStatus('idle'), 2000);
      } catch {
        setStatus('error');
      }
    }
  },

  // Оновити поля одного пэда (наприклад, перейменування).
  async updatePadCloud(id, patch) {
    cache = { ...cache, custom_pads: (cache.custom_pads || []).map((p) => (p.id === id ? { ...p, ...patch } : p)) };
    notify();
    const rid = padRecordId.get(id);
    if (!rid) return;
    const entityPatch = {};
    if ('title' in patch) entityPatch.title = patch.title;
    if ('url' in patch) entityPatch.url = patch.url;
    if ('category' in patch) entityPatch.category = patch.category;
    if ('icon' in patch) entityPatch.icon = patch.icon;
    if ('axes' in patch) entityPatch.axes = patch.axes;
    if ('tags' in patch) entityPatch.tags = patch.tags;
    if ('isLoopable' in patch) entityPatch.is_loopable = patch.isLoopable;
    if ('isEffect' in patch) entityPatch.is_effect = patch.isEffect;
    if (Object.keys(entityPatch).length === 0) return;
    setStatus('saving');
    try {
      await base44.entities.Pad.update(rid, entityPatch);
      setStatus('saved');
      if (savedResetTimer) clearTimeout(savedResetTimer);
      savedResetTimer = setTimeout(() => setStatus('idle'), 2000);
    } catch { setStatus('error'); }
  },

  // Видалити один пэд.
  async removePadCloud(id) {
    cache = { ...cache, custom_pads: (cache.custom_pads || []).filter((p) => p.id !== id) };
    notify();
    const rid = padRecordId.get(id);
    if (!rid) return;
    padRecordId.delete(id);
    setStatus('saving');
    try {
      await base44.entities.Pad.delete(rid);
      setStatus('saved');
      if (savedResetTimer) clearTimeout(savedResetTimer);
      savedResetTimer = setTimeout(() => setStatus('idle'), 2000);
    } catch { setStatus('error'); }
  },

  // Видалити всі пэди.
  async clearPadsCloud() {
    const ids = Array.from(padRecordId.values());
    cache = { ...cache, custom_pads: [] };
    padRecordId.clear();
    notify();
    if (!ids.length) return;
    setStatus('saving');
    try {
      for (const rid of ids) { try { await base44.entities.Pad.delete(rid); } catch { /* ignore */ } }
      setStatus('saved');
      if (savedResetTimer) clearTimeout(savedResetTimer);
      savedResetTimer = setTimeout(() => setStatus('idle'), 2000);
    } catch { setStatus('error'); }
  },

  // Користувацькі сегменти колеса: { [axisId]: [{ id, label, icon, kw }] }
  getCustomAxisValues: () => cache.custom_axis_values || {},
  setCustomAxisValues: (map) => set('custom_axis_values', map),

  // Прибрані вбудовані сегменти: { [axisId]: [ids] }
  getRemovedAxisValues: () => cache.removed_axis_values || {},
  setRemovedAxisValues: (map) => set('removed_axis_values', map),

  // Збережені сцени (масив наборів пэдів з осями фільтра)
  getScenes: () => cache.scenes || [],
  setScenes: (list) => set('scenes', list),

  // Недавно запущені пэди — масив id, найновіший першим (макс 24).
  getRecentPads: () => cache.recent_pads || [],
  setRecentPads: (ids) => set('recent_pads', ids),

  // Улюблені пэди — масив id.
  getPadFavorites: () => cache.pad_favorites || [],
  setPadFavorites: (ids) => set('pad_favorites', ids),

  // Снимки микса — заготовки сцены: [{ id, name, layers: [{ padId, volume }] }].
  getMixPresets: () => cache.mix_presets || [],
  setMixPresets: (list) => set('mix_presets', list),

  // Глобальные слоты звуковых эффектов: [{ id, title, icon, url, isEmpty }].
  getEffectSlots: () => cache.effect_slots || [],
  setEffectSlots: (list) => set('effect_slots', list),

  // Звуки, назначенные на плитки осей: { 'axisId:valueId': [soundId, ...] }.
  getTileSounds: () => cache.tile_sounds || {},
  setTileSounds: (map) => set('tile_sounds', map),
};