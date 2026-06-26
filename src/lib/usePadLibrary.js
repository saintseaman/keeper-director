// ─────────────────────────────────────────────────────────────
// usePadLibrary — недавние и избранные пэды.
// Закрывает самый частый сценарий мастера: 10–20 ходовых звуков под рукой.
// Хранение — через storage (recent_pads / pad_favorites), синхронизация
// между компонентами событием 'keeper:padlib'.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';

const EVENT = 'keeper:padlib';
const RECENT_MAX = 24;

function emit() { window.dispatchEvent(new Event(EVENT)); }

// Записать запуск пэда в «недавние» (вызывается из движка/пэда при play).
export function recordRecentPad(id) {
  if (!id) return;
  const prev = storage.getRecentPads();
  const next = [id, ...prev.filter((x) => x !== id)].slice(0, RECENT_MAX);
  storage.setRecentPads(next);
  emit();
}

export function usePadLibrary() {
  const [recent, setRecent] = useState(() => storage.getRecentPads());
  const [favorites, setFavorites] = useState(() => storage.getPadFavorites());

  useEffect(() => {
    const sync = () => {
      setRecent(storage.getRecentPads());
      setFavorites(storage.getPadFavorites());
    };
    window.addEventListener(EVENT, sync);
    const unsub = storage.subscribe(sync); // облачная загрузка / изменения
    return () => { window.removeEventListener(EVENT, sync); unsub(); };
  }, []);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback((id) => {
    const prev = storage.getPadFavorites();
    const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
    storage.setPadFavorites(next);
    setFavorites(next);
    emit();
  }, []);

  return { recent, favorites, isFavorite, toggleFavorite };
}