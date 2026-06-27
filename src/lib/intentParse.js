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

// Скоринг: насколько пэд отвечает распознанному намерению.
// Каждое совпадение значения по оси = +1; чем больше фасетов совпало — выше.
// Это «мягкий» матч (OR внутри оси, сумма по осям), в отличие от строгого
// фильтра колеса сцены, — чтобы запрос всегда возвращал лучшее, а не пусто.
export function scorePadAgainstIntent(pad, override, parsed) {
  const axes = padAxes(pad, override);
  let score = 0;
  let matchedAxes = 0;
  for (const axis of SCENE_AXES) {
    const want = parsed[axis.id] || [];
    if (!want.length) continue;
    const have = axes[axis.id] || [];
    const overlap = want.filter((id) => have.includes(id)).length;
    if (overlap > 0) { score += overlap; matchedAxes += 1; }
  }
  return { score, matchedAxes };
}

// Главная функция: библиотека + overrides + фраза → ранжированные пэды.
// Возвращает только те, что совпали хотя бы по одной распознанной оси,
// отсортированные по числу совпавших осей, затем по суммарному скору.
export function searchByIntent(pads, overrides, query) {
  const parsed = parseIntent(query);
  const axesUsed = Object.keys(parsed).filter((a) => (parsed[a] || []).length);
  if (!axesUsed.length) return { parsed, results: [] };

  const scored = [];
  for (const pad of pads) {
    const { score, matchedAxes } = scorePadAgainstIntent(pad, overrides?.[pad.id], parsed);
    if (score > 0) scored.push({ pad, score, matchedAxes });
  }
  // Сортировка: сперва покрывшие больше осей запроса, потом по силе совпадения.
  scored.sort((a, b) => b.matchedAxes - a.matchedAxes || b.score - a.score);
  return { parsed, results: scored.map((s) => s.pad) };
}