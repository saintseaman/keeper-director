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

// Ключ плитки: "axisId:valueId".
const key = (axisId, valueId) => `${axisId}:${valueId}`;

export function useTileSounds() {
  const [tileSounds, setTileSounds] = useState(() => storage.getTileSounds());

  useEffect(() => {
    const sync = () => setTileSounds(storage.getTileSounds());
    window.addEventListener(EVENT, sync);
    const unsub = storage.subscribe(sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      unsub();
    };
  }, []);

  const write = useCallback((map) => {
    storage.setTileSounds(map);
    setTileSounds(map);
    window.dispatchEvent(new Event(EVENT));
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

  return { tileSounds, getSounds, setSounds, addSound, removeSound };
}