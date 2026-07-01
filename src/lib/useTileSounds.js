// ─────────────────────────────────────────────────────────────
// useTileSounds — звуки, назначенные на плитки осей сцены.
//
// Структура { 'axisId:valueId': [soundId, ...] } живёт в storage
// (поле tile_sounds) и синхронизируется между вкладками/компонентами.
// Точная калька useEffectSlots.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';

const EVENT = 'keeper:tile_sounds';
const LABELS_EVENT = 'keeper:tile_labels';

// Ключ плитки: "axisId:valueId".
const key = (axisId, valueId) => `${axisId}:${valueId}`;

export function useTileSounds() {
  const [tileSounds, setTileSounds] = useState(() => storage.getTileSounds());
  const [tileLabels, setTileLabels] = useState(() => storage.getTileLabels());

  useEffect(() => {
    const sync = () => {
      setTileSounds(storage.getTileSounds());
      setTileLabels(storage.getTileLabels());
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener(LABELS_EVENT, sync);
    const unsub = storage.subscribe(sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener(LABELS_EVENT, sync);
      unsub();
    };
  }, []);

  const write = useCallback((map) => {
    storage.setTileSounds(map);
    setTileSounds(map);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  // Кастомное имя плитки (или '' если не задано).
  const getLabel = useCallback((axisId, valueId) => {
    return storage.getTileLabels()[key(axisId, valueId)] || '';
  }, []);

  // Задать/сбросить кастомное имя плитки. Пустая строка → удаляет ключ,
  // плитка возвращается к имени по умолчанию из sceneAxes.
  const setLabel = useCallback((axisId, valueId, text) => {
    const map = { ...storage.getTileLabels() };
    const trimmed = (text || '').trim();
    if (trimmed) map[key(axisId, valueId)] = trimmed;
    else delete map[key(axisId, valueId)];
    storage.setTileLabels(map);
    setTileLabels(map);
    window.dispatchEvent(new Event(LABELS_EVENT));
  }, []);

  // Массив soundId для плитки (или []).
  const getSounds = useCallback((axisId, valueId) => {
    return storage.getTileSounds()[key(axisId, valueId)] || [];
  }, []);

  // Записать массив звуков для плитки.
  const setSounds = useCallback((axisId, valueId, ids) => {
    const next = { ...storage.getTileSounds(), [key(axisId, valueId)]: ids };
    write(next);
  }, [write]);

  // Добавить один звук к плитке (без дублей).
  const addSound = useCallback((axisId, valueId, id) => {
    const current = storage.getTileSounds()[key(axisId, valueId)] || [];
    if (current.includes(id)) return;
    setSounds(axisId, valueId, [...current, id]);
  }, [setSounds]);

  // Убрать один звук с плитки.
  const removeSound = useCallback((axisId, valueId, id) => {
    const current = storage.getTileSounds()[key(axisId, valueId)] || [];
    setSounds(axisId, valueId, current.filter((x) => x !== id));
  }, [setSounds]);

  // Назначить ОДИН звук на плитку (заменяет предыдущий). Для оси action —
  // плитка играет ровно один one-shot, поэтому массив всегда ≤ 1 элемента.
  const setSingleSound = useCallback((axisId, valueId, id) => {
    setSounds(axisId, valueId, id ? [id] : []);
  }, [setSounds]);

  // ── Стадии интенсивности для оси location ──
  // Ключ хранения: "location:<valueId>:<stage>", stage ∈ {calm, tense, horror}.
  const getStageSounds = useCallback(
    (valueId, stage) => getSounds('location', `${valueId}:${stage}`),
    [getSounds]
  );

  const addStageSound = useCallback(
    (valueId, stage, id) => addSound('location', `${valueId}:${stage}`, id),
    [addSound]
  );

  const removeStageSound = useCallback(
    (valueId, stage, id) => removeSound('location', `${valueId}:${stage}`, id),
    [removeSound]
  );

  const getAllStagesSounds = useCallback(
    (valueId) => ({
      calm: getStageSounds(valueId, 'calm'),
      tense: getStageSounds(valueId, 'tense'),
      horror: getStageSounds(valueId, 'horror'),
    }),
    [getStageSounds]
  );

  return {
    tileSounds,
    tileLabels,
    getLabel,
    setLabel,
    getSounds,
    setSounds,
    setSingleSound,
    addSound,
    removeSound,
    getStageSounds,
    addStageSound,
    removeStageSound,
    getAllStagesSounds,
  };
}