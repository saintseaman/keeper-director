// ─────────────────────────────────────────────────────────────
// Парсер намерений: фраза Хранителя → осевые значения (Sound DNA).
// «дождливый лес ночью» → { weather:['rain','night'], location:['forest'] }.
//
// Game Master думает контекстом, а не категориями. Этот модуль переводит
// естественную фразу в фасеты осей, переиспользуя те же ключевые слова (kw),
// по которым размечаются звуки. Никаких внешних зависимостей — простое
// сопоставление подстрок по нормализованному тексту.
// ─────────────────────────────────────────────────────────────
import { SCENE_AXES, padAxes, padMatchesSelection, axisValue } from './sceneAxes';

function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Реестр пользовательских сегментов учитываем через axisValue/customRegistry
// в sceneAxes — но для парсинга kw нам нужен прямой доступ. Берём встроенные
// значения; кастомные сегменты обычно без kw, поэтому встроенных достаточно.
function axisValuesWithKw(axisId) {
  return (SCENE_AXES.find((a) => a.id === axisId)?.values) || [];
}

// Разобрать фразу в набор осевых значений (мульти-выбор по каждой оси).
// Возвращает { location:[ids], action:[ids], weather:[ids], mood:[ids] }.
export function parseIntent(query) {
  const text = norm(query);
  const result = {};
  if (!text) return result;
  for (const axis of SCENE_AXES) {
    const hits = [];
    for (const v of axisValuesWithKw(axis.id)) {
      if ((v.kw || []).some((k) => text.includes(norm(k)))) hits.push(v.id);
    }
    if (hits.length) result[axis.id] = hits;
  }
  return result;
}

// Человекочитаемые ярлыки распознанных фасетов — для подсказки в UI
// («Понял: Лес · Дождь · Ночь»).
export function intentChips(parsed) {
  const chips = [];
  for (const axis of SCENE_AXES) {
    for (const id of parsed[axis.id] || []) {
      const v = axisValue(axis.id, id);
      if (v?.label) chips.push({ axisId: axis.id, id, label: v.label, color: axis.color, icon: v.icon });
    }
  }
  return chips;
}

// Значимые слова запроса (для текстового совпадения с названием пэда).
// Отбрасываем короткие служебные слова, чтобы «в», «на» не шумели.
function queryWords(query) {
  return norm(query)
    .split(/[\s,./·-]+/)
    .filter((w) => w.length >= 3);
}

// Сколько значимых слов запроса встречается в названии пэда.
function titleWordHits(pad, words) {
  if (!words.length) return 0;
  const title = norm(pad.title || '');
  let hits = 0;
  for (const w of words) if (title.includes(w)) hits += 1;
  return hits;
}

// Скоринг: насколько пэд отвечает распознанному намерению.
// Учитываем (в порядке важности):
//  1) matchedAxes — по скольким РАЗНЫМ осям запроса совпал звук. Покрытие
//     всех распознанных фасетов важнее, чем много совпадений по одной оси.
//  2) titleHits — сколько слов запроса есть прямо в названии (точечная
//     релевантность: «больница» в названии бьёт случайный тег «город»).
//  3) axisOverlap — суммарное число совпавших осевых значений (мягкий бонус).
export function scorePadAgainstIntent(pad, override, parsed, words) {
  const axes = padAxes(pad, override);
  let axisOverlap = 0;
  let matchedAxes = 0;
  for (const axis of SCENE_AXES) {
    const want = parsed[axis.id] || [];
    if (!want.length) continue;
    const have = axes[axis.id] || [];
    const overlap = want.filter((id) => have.includes(id)).length;
    if (overlap > 0) { axisOverlap += overlap; matchedAxes += 1; }
  }
  const titleHits = titleWordHits(pad, words || []);
  return { axisOverlap, matchedAxes, titleHits };
}

// Главная функция: библиотека + overrides + фраза → ранжированные пэды.
// Возвращает только релевантные звуки, отсортированные по покрытию фасетов,
// затем по текстовому совпадению названия, затем по силе осевого совпадения.
export function searchByIntent(pads, overrides, query) {
  const parsed = parseIntent(query);
  const axesUsed = Object.keys(parsed).filter((a) => (parsed[a] || []).length);
  const words = queryWords(query);
  if (!axesUsed.length && !words.length) return { parsed, results: [] };

  const scored = [];
  for (const pad of pads) {
    const { axisOverlap, matchedAxes, titleHits } =
      scorePadAgainstIntent(pad, overrides?.[pad.id], parsed, words);
    // Звук попадает в выдачу, только если есть реальная связь с запросом:
    // совпала хотя бы одна ось ИЛИ хотя бы одно слово запроса в названии.
    if (axisOverlap === 0 && titleHits === 0) continue;
    scored.push({ pad, axisOverlap, matchedAxes, titleHits });
  }

  // Если распознано несколько осей — приоритет звукам, покрывшим БОЛЬШЕ осей
  // (т.е. «город» + «лечебница» вместе важнее, чем только «город»).
  const multiAxis = axesUsed.length >= 2;
  scored.sort((a, b) => {
    if (multiAxis && b.matchedAxes !== a.matchedAxes) return b.matchedAxes - a.matchedAxes;
    if (b.titleHits !== a.titleHits) return b.titleHits - a.titleHits;
    if (b.matchedAxes !== a.matchedAxes) return b.matchedAxes - a.matchedAxes;
    return b.axisOverlap - a.axisOverlap;
  });
  return { parsed, results: scored.map((s) => s.pad) };
}