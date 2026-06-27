// ─────────────────────────────────────────────────────────────
// МОДУЛЬ КЛАССИФИКАЦИИ (P0) — единственный источник правды для метаданных пэда.
//
// Раньше теги «угадывались» в рантайме при каждом поиске/рендере (autoAxes).
// Теперь классификация выполняется ОДИН РАЗ — при импорте — и СОХРАНЯЕТСЯ
// в запись Pad (поля location/weather/mood/purpose/elements/time/genre/
// intensity/loop + search_text). Дальше всё (поиск, сцены, фильтры) читает
// готовые поля, а не пересчитывает их.
//
// Словари location/weather/mood/action переиспользуем из sceneAxes, чтобы
// не плодить четвёртую копию ключевых слов. Здесь добавляем новые оси
// (elements/genre/intensity/time) и сборку search_text.
// ─────────────────────────────────────────────────────────────
import { SCENE_AXES } from './sceneAxes';

// ── Дополнительные словари (то, чего нет в осях сцены) ──
// elements — физические составляющие звука (огонь, вода, ветер, металл…).
const ELEMENT_RULES = [
  ['water', ['water', 'rain', 'wave', 'ocean', 'sea', 'river', 'drip', 'splash', 'вод', 'дожд', 'волн', 'море', 'река', 'капл']],
  ['fire', ['fire', 'flame', 'crackle', 'burn', 'ember', 'огон', 'плам', 'костёр', 'костер', 'пожар']],
  ['wind', ['wind', 'gale', 'breeze', 'storm', 'ветер', 'вітер', 'буря']],
  ['wood', ['wood', 'creak', 'door', 'plank', 'дерев', 'скрип', 'дверь', 'двер']],
  ['metal', ['metal', 'chain', 'sword', 'blade', 'clang', 'металл', 'цеп', 'меч', 'клинок', 'лязг']],
  ['stone', ['stone', 'rock', 'rubble', 'collapse', 'камен', 'скал', 'обвал']],
  ['crowd', ['crowd', 'market', 'tavern', 'people', 'mob', 'толп', 'рынок', 'таверн', 'люди']],
  ['creature', ['monster', 'creature', 'beast', 'growl', 'roar', 'snarl', 'hiss', 'тварь', 'монстр', 'рык', 'рев']],
  ['bell', ['bell', 'gong', 'chime', 'toll', 'колокол', 'гонг', 'дзвін']],
  ['voice', ['whisper', 'scream', 'chant', 'voice', 'choir', 'laugh', 'cry', 'шёпот', 'шепот', 'крик', 'хор', 'смех', 'плач']],
  ['thunder', ['thunder', 'lightning', 'гром', 'молни']],
  ['machine', ['engine', 'machine', 'mechanical', 'clock', 'tick', 'мотор', 'машин', 'механизм', 'часы', 'тикан']],
];

// genre — сеттинг по ключевым словам названия.
const GENRE_RULES = [
  ['cosmic', ['cosmic', 'void', 'eldritch', 'cthulhu', 'rlyeh', 'azathoth', 'yog', 'nyarlathotep', 'hastur', 'космос', 'бездн', 'ктулху']],
  ['scifi', ['scifi', 'sci-fi', 'space', 'laser', 'robot', 'cyber', 'station', 'spaceship', 'фантастик', 'космолёт', 'робот', 'кибер']],
  ['modern', ['city', 'car', 'gun', 'phone', 'radio', 'street', 'urban', 'traffic', 'город', 'машина', 'пистолет', 'телефон', 'улиц']],
  ['fantasy', ['castle', 'dragon', 'magic', 'sword', 'tavern', 'dungeon', 'medieval', 'замок', 'дракон', 'магия', 'меч', 'таверн']],
];

function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Найти все совпавшие id значений оси по ключевым словам в тексте.
function matchAxis(text, axisId) {
  const axis = SCENE_AXES.find((a) => a.id === axisId);
  if (!axis) return [];
  return axis.values
    .filter((v) => (v.kw || []).some((k) => text.includes(k)))
    .map((v) => v.id);
}

// Найти первый совпавший ключ из набора правил [key, [keywords...]].
function matchFirst(text, rules) {
  for (const [key, kws] of rules) {
    if (kws.some((k) => text.includes(k))) return key;
  }
  return null;
}

function matchAll(text, rules) {
  const out = [];
  for (const [key, kws] of rules) {
    if (kws.some((k) => text.includes(k))) out.push(key);
  }
  return out;
}

// ── Главная функция: вычислить полный набор метаданных для пэда ──
// Принимает «сырой» пэд { title, category, isLoopable? } и возвращает
// структурные поля + search_text. Вызывается ОДИН раз при импорте.
export function classifyPad(raw) {
  const text = norm(`${raw.title || ''} ${raw.category || ''}`);

  const location = matchAxis(text, 'location');
  const weather = matchAxis(text, 'weather');
  const mood = matchAxis(text, 'mood');
  // ось «action» в сценах = «purpose» (функция звука).
  const purpose = matchAxis(text, 'action');
  const elements = matchAll(text, ELEMENT_RULES);
  const genre = matchFirst(text, GENRE_RULES) || 'unknown';

  // time: ночь/день по словам, иначе unknown.
  let time = 'unknown';
  if (/\b(night|dark|moon|ночь|ноч|тьма|лун)/.test(text)) time = 'night';
  else if (/\b(day|sun|dawn|morning|солнц|сонц|день|утро|рассвет)/.test(text)) time = 'day';

  // intensity: горячие слова → high, спокойные → low, иначе medium.
  let intensity = 'medium';
  if (/\b(scream|combat|battle|explosion|jumpscare|storm|roar|panic|крик|бой|взрыв|буря|паник)/.test(text)) intensity = 'high';
  else if (/\b(calm|ambient|gentle|rest|peace|sleep|drone|спокой|эмбиент|покой|сон|дрон|тих)/.test(text)) intensity = 'low';

  // loop: уважаем явный isLoopable из импорта; иначе события/jumpscare — one-shot.
  const loop = typeof raw.isLoopable === 'boolean'
    ? raw.isLoopable
    : !['events', 'jumpscare'].includes(raw.category);

  // search_text — плоский индекс для быстрого поиска без рантайм-пересчёта.
  const search_text = buildSearchText({
    title: raw.title, category: raw.category,
    location, weather, mood, purpose, elements, genre, time, intensity,
  });

  return { location, weather, mood, purpose, elements, genre, time, intensity, loop, search_text };
}

// Собрать плоскую строку поиска: название + все теги + человекочитаемые
// ярлыки значений осей (чтобы искать и по «лес», и по «forest»).
export function buildSearchText(meta) {
  const parts = [meta.title || '', meta.category || '', meta.genre || '', meta.time || '', meta.intensity || ''];
  for (const axisId of ['location', 'weather', 'mood']) {
    const axis = SCENE_AXES.find((a) => a.id === axisId);
    for (const id of meta[axisId] || []) {
      parts.push(id);
      const v = axis?.values.find((x) => x.id === id);
      if (v?.label) parts.push(v.label);
    }
  }
  // purpose маппится на ось action.
  const actionAxis = SCENE_AXES.find((a) => a.id === 'action');
  for (const id of meta.purpose || []) {
    parts.push(id);
    const v = actionAxis?.values.find((x) => x.id === id);
    if (v?.label) parts.push(v.label);
  }
  for (const el of meta.elements || []) parts.push(el);
  for (const t of meta.tags || []) parts.push(t);
  return norm(parts.join(' '));
}