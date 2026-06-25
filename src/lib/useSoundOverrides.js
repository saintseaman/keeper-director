// ─────────────────────────────────────────────────────────────
// useSoundOverrides (Milestone 4)
//
// Реактивний доступ до користувацьких правок метаданих звуку.
// Зберігання — виключно через шар storage (ADR-005). Синхронізація між
// компонентами — через подію 'keeper:overrides', як у useFavorites.
//
// Каталог SOUNDS лишається незмінним: правки накладаються окремим шаром.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';

const EVENT = 'keeper:overrides';

export function useSoundOverrides() {
  const [overrides, setOverrides] = useState(() => storage.getSoundOverrides());

  useEffect(() => {
    const sync = () => setOverrides(storage.getSoundOverrides());
    window.addEventListener(EVENT, sync);
    const unsub = storage.subscribe(sync); // хмарне завантаження / зміни
    return () => {
      window.removeEventListener(EVENT, sync);
      unsub();
    };
  }, []);

  const getOverride = useCallback((soundId) => overrides[soundId] || {}, [overrides]);

  const setOverride = useCallback((soundId, patch) => {
    const map = storage.getSoundOverrides();
    const next = { ...map, [soundId]: { ...(map[soundId] || {}), ...patch } };
    storage.setSoundOverrides(next);
    setOverrides(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const resetOverride = useCallback((soundId) => {
    const map = storage.getSoundOverrides();
    if (!map[soundId]) return;
    const next = { ...map };
    delete next[soundId];
    storage.setSoundOverrides(next);
    setOverrides(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { overrides, getOverride, setOverride, resetOverride };
}