// ─────────────────────────────────────────────────────────────
// Поиск по СВОЕЙ библиотеке пэдов (custom_pads).
// Профессиональный поиск: несколько слов (AND), по названию + тегам осей
// (location/action/weather/mood) + category, с лёгким fuzzy на опечатки.
// Без тяжёлых зависимостей — компактный скоринг.
// ─────────────────────────────────────────────────────────────
import { padAxes, axisValue, SCENE_AXES } from './sceneAxes';

// Нормализация: нижний регистр, убрать диакритику, схлопнуть пробелы.
function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Расстояние Левенштейна (для коротких слов — допускаем 1 опечатку).
function lev(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      dp[i] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[i], dp[i - 1]);
      prev = tmp;
    }
  }
  return dp[m];
}

// Собрать «поисковый текст» пэда: название + человекочитаемые ярлыки тегов + category.
// override нужен, чтобы учесть ручные теги (приоритетнее авто).
function padHaystack(pad, override) {
  const axes = padAxes(pad, override);
  const tagLabels = [];
  for (const axis of SCENE_AXES) {
    for (const valId of axes[axis.id] || []) {
      const v = axisValue(axis.id, valId);
      if (v?.label) tagLabels.push(v.label);
      tagLabels.push(valId);
    }
  }
  return norm(`${pad.title || ''} ${tagLabels.join(' ')} ${pad.category || ''}`);
}

// Совпадает ли одно слово запроса с текстом пэда (точное вхождение или fuzzy по словам).
function wordMatches(word, haystack) {
  if (haystack.includes(word)) return true;
  if (word.length < 4) return false; // короткие слова — только точное вхождение
  // fuzzy: сравниваем со словами стога, допускаем 1 опечатку.
  for (const token of haystack.split(/[\s·,/]+/)) {
    if (token && Math.abs(token.length - word.length) <= 2 && lev(word, token) <= 1) return true;
  }
  return false;
}

// Главная функция: список пэдов + map overrides → отфильтрованный список.
// Все слова запроса должны найтись (AND). Пустой запрос — весь список как есть.
export function searchPads(pads, overrides, query) {
  const q = norm(query);
  if (!q) return pads;
  const words = q.split(/\s+/).filter(Boolean);

  const scored = [];
  for (const pad of pads) {
    const haystack = padHaystack(pad, overrides?.[pad.id]);
    const title = norm(pad.title || '');
    let ok = true;
    for (const w of words) {
      if (!wordMatches(w, haystack)) { ok = false; break; }
    }
    if (!ok) continue;
    // Скоринг: совпадение в начале названия — выше, целая фраза в названии — ещё выше.
    let score = 0;
    if (title.startsWith(q)) score += 100;
    if (title.includes(q)) score += 50;
    for (const w of words) if (title.includes(w)) score += 5;
    scored.push({ pad, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.pad);
}