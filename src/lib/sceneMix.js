// ─────────────────────────────────────────────────────────────
// Логика микса сцены (вариант A аудита).
//
// Проблема: сцена запускала все подходящие пэды на фиксированной 0.6, слои
// складывались и перегружали мастер → каша и клиппинг. Здесь — общие правила:
//  1) в авто-микс сцены идут ТОЛЬКО лупы (фон). One-shot'ы отыграли бы один
//     раз и замолчали, разваливая атмосферу, поэтому из фона исключаем.
//  2) громкость каждого слоя нормализуется по числу слоёв: чем больше слоёв,
//     тем тише каждый (∝ 1/√N), чтобы суммарная энергия не клиппила.
// ─────────────────────────────────────────────────────────────

const BASE_VOLUME = 0.6; // громкость одиночного слоя
export const MAX_SCENE_LAYERS = 8; // максимум одновременных фоновых слоёв

// Луп ли это пэд (по умолчанию — да; one-shot помечается isLoopable === false).
export function isLoopPad(pad) {
  return pad?.isLoopable !== false;
}

// Только лупы с проигрываемым url — кандидаты в фон сцены.
export function loopableScenePads(pads) {
  return (pads || []).filter((p) => p?.url && isLoopPad(p));
}

// Сколько слоёв реально пойдёт в фон с учётом лимита (для подписей UI).
export function sceneMixCount(pads) {
  return Math.min(loopableScenePads(pads).length, MAX_SCENE_LAYERS);
}

// Громкость одного слоя при N одновременных слоях.
// 1/√N сохраняет суммарную воспринимаемую энергию примерно постоянной.
export function layerVolume(count) {
  if (count <= 1) return BASE_VOLUME;
  return BASE_VOLUME / Math.sqrt(count);
}

// Веса соседних стадий по интенсивности (calm=0, tense=0.5, horror=1).
// Возвращает доли громкости для кроссфейда: { calm, tense, horror }, сумма = 1.
export function stageWeights(intensity) {
  const i = Math.max(0, Math.min(1, intensity));
  if (i <= 0.5) {
    const t = i / 0.5; // 0..1 между calm и tense
    return { calm: 1 - t, tense: t, horror: 0 };
  }
  const t = (i - 0.5) / 0.5; // 0..1 между tense и horror
  return { calm: 0, tense: 1 - t, horror: t };
}

// Веса стадий с откатом пустых: вес стадии без звуков переносится на
// ближайшую назначенную (приоритет соседняя → дальняя). Итог нормализован: сумма = 1.
const STAGE_SEQ = ['calm', 'tense', 'horror'];
export function resolveStageWeights(intensity, stagesSounds) {
  const raw = stageWeights(intensity);
  const has = (s) => (stagesSounds?.[s] || []).length > 0;
  const out = { calm: 0, tense: 0, horror: 0 };

  for (const stage of STAGE_SEQ) {
    const w = raw[stage];
    if (w <= 0) continue;
    if (has(stage)) { out[stage] += w; continue; }
    // откат: ближайшая назначенная стадия по дистанции
    const idx = STAGE_SEQ.indexOf(stage);
    let target = null;
    for (let d = 1; d < STAGE_SEQ.length; d++) {
      if (idx - d >= 0 && has(STAGE_SEQ[idx - d])) { target = STAGE_SEQ[idx - d]; break; }
      if (idx + d < STAGE_SEQ.length && has(STAGE_SEQ[idx + d])) { target = STAGE_SEQ[idx + d]; break; }
    }
    if (target) out[target] += w;
  }

  const sum = out.calm + out.tense + out.horror;
  if (sum > 0) { out.calm /= sum; out.tense /= sum; out.horror /= sum; }
  return out;
}

// Запустить набор пэдов как нормализованный фон сцены.
// Берём не более MAX_SCENE_LAYERS слоёв, чтобы не было звуковой каши.
// Возвращает число реально запущенных слоёв.
export function playSceneMix(audioEngine, pads) {
  const loops = loopableScenePads(pads).slice(0, MAX_SCENE_LAYERS);
  const vol = layerVolume(loops.length);
  for (const pad of loops) {
    audioEngine.playFile(pad.id, pad.url, pad.title, vol, true);
  }
  return loops.length;
}

// Живое обновление микса сцены: подмешивает новый набор лупов в уже играющую
// сцену. Останавливает слои, что больше не подходят, запускает новые и
// пере-нормализует громкость всех (playFile у играющего слоя идемпотентно
// просто выставляет новую громкость). Возвращает новый набор id сцены.
export function syncSceneMix(audioEngine, pads, currentIds, volOverride = null) {
  const loops = loopableScenePads(pads).slice(0, MAX_SCENE_LAYERS);
  const targetIds = new Set(loops.map((p) => p.id));
  // остановить слои, которые больше не подходят
  for (const id of currentIds) {
    if (!targetIds.has(id)) audioEngine.stop(id, 0.4);
  }
  // запустить новые + пере-нормализовать громкость всех
  const vol = volOverride != null ? volOverride : layerVolume(loops.length);
  for (const pad of loops) {
    audioEngine.playFile(pad.id, pad.url, pad.title, vol, true);
  }
  return targetIds;
}