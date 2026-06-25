// ─────────────────────────────────────────────────────────────
// useFavorites (Milestone 3) — централізована робота з улюбленими
// сценами. Спирається на шар storage. Синхронізує всі сторінки через
// подію, тому додавання в улюблене на одній сторінці видно на інших.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';

const EVENT = 'keeper_favorites_changed';

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => storage.getFavorites());

  useEffect(() => {
    const sync = () => setFavorites(storage.getFavorites());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync); // інша вкладка
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggleFavorite = useCallback((sceneId) => {
    const current = storage.getFavorites();
    const next = current.includes(sceneId)
      ? current.filter(id => id !== sceneId)
      : [...current, sceneId];
    storage.setFavorites(next);
    setFavorites(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const isFavorite = useCallback((sceneId) => favorites.includes(sceneId), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}