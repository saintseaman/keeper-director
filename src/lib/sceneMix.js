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
export function syncSceneMix(audioEngine, pads, currentIds) {
  const loops = loopableScenePads(pads).slice(0, MAX_SCENE_LAYERS);
  const targetIds = new Set(loops.map((p) => p.id));
  // остановить слои, которые больше не подходят
  for (const id of currentIds) {
    if (!targetIds.has(id)) audioEngine.stop(id, 0.4);
  }
  // запустить новые + пере-нормализовать громкость всех
  const vol = layerVolume(loops.length);
  for (const pad of loops) {
    audioEngine.playFile(pad.id, pad.url, pad.title, vol, true);
  }
  return targetIds;
}