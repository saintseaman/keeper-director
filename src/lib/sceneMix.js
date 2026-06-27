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

// Луп ли это пэд (по умолчанию — да; one-shot помечается isLoopable === false).
export function isLoopPad(pad) {
  return pad?.isLoopable !== false;
}

// Только лупы с проигрываемым url — кандидаты в фон сцены.
export function loopableScenePads(pads) {
  return (pads || []).filter((p) => p?.url && isLoopPad(p));
}

// Громкость одного слоя при N одновременных слоях.
// 1/√N сохраняет суммарную воспринимаемую энергию примерно постоянной.
export function layerVolume(count) {
  if (count <= 1) return BASE_VOLUME;
  return BASE_VOLUME / Math.sqrt(count);
}

// Запустить набор пэдов как нормализованный фон сцены.
// Возвращает число реально запущенных слоёв.
export function playSceneMix(audioEngine, pads) {
  const loops = loopableScenePads(pads);
  const vol = layerVolume(loops.length);
  for (const pad of loops) {
    audioEngine.playFile(pad.id, pad.url, pad.title, vol, true);
  }
  return loops.length;
}