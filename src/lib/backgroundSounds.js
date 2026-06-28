// ─────────────────────────────────────────────────────────────
// Фоновые звуки сцены.
//
// Фон НЕ отдельная сущность — это обычный пэд (Pad), который:
//   1) зациклен (is_loopable / override.isLoopable === true),
//   2) имеет тег локации (axes.location непуст),
//   3) имеет тег настроения-стадии (axes.mood ∈ {calm, tense, horror}).
//
// Это даёт «Forest Calm», «Forest Tension», «Forest Horror» без новых
// таблиц — звук просто размечен по осям location + mood, как и всё остальное.
// ─────────────────────────────────────────────────────────────
import { padAxes } from './sceneAxes';

// Три эмоциональные стадии фона. id совпадают со значениями оси mood.
export const BG_STAGES = [
  { id: 'calm',   label: 'Спокойно',    en: 'Calm' },
  { id: 'tense',  label: 'Напряжённо',  en: 'Tension' },
  { id: 'horror', label: 'Ужас',        en: 'Horror' },
];

const STAGE_IDS = BG_STAGES.map((s) => s.id);

// Луп ли пэд (с учётом ручного override).
function isLoop(pad, override) {
  if (typeof override?.isLoopable === 'boolean') return override.isLoopable;
  return pad?.is_loopable ?? false;
}

// Является ли пэд фоновым звуком (loop + локация + стадия настроения).
export function isBackgroundPad(pad, override) {
  if (!isLoop(pad, override)) return false;
  const axes = padAxes(pad, override);
  const hasLocation = (axes.location || []).length > 0;
  const hasStage = (axes.mood || []).some((m) => STAGE_IDS.includes(m));
  return hasLocation && hasStage;
}

// Для какой(их) стадии(й) этот пэд является фоном (пересечение mood со стадиями).
export function backgroundStages(pad, override) {
  const axes = padAxes(pad, override);
  return (axes.mood || []).filter((m) => STAGE_IDS.includes(m));
}

// Локации, для которых этот пэд — фон.
export function backgroundLocations(pad, override) {
  const axes = padAxes(pad, override);
  return axes.location || [];
}

// Найти фоновый пэд для (локация, стадия). Возвращает первый подходящий.
export function findBackground(pads, overrides, locationId, stageId) {
  if (!locationId || !stageId) return null;
  return (
    pads.find((p) => {
      const ov = overrides[p.id];
      if (!isBackgroundPad(p, ov)) return false;
      const axes = padAxes(p, ov);
      return (axes.location || []).includes(locationId) && (axes.mood || []).includes(stageId);
    }) || null
  );
}

// Сводка по локации: какие стадии имеют фон. { calm: pad|null, tense: ..., horror: ... }
export function locationBackgrounds(pads, overrides, locationId) {
  const out = {};
  for (const stage of STAGE_IDS) {
    out[stage] = findBackground(pads, overrides, locationId, stage);
  }
  return out;
}