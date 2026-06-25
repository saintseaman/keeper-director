// ─────────────────────────────────────────────────────────────
// usePrefsReady — завантажує хмарний документ налаштувань (storage.init)
// один раз і повертає прапорець готовності. Поки не готово — UI чекає,
// щоб геттери storage.getX() віддавали хмарні дані, а не дефолти.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { storage } from './storage';

export function usePrefsReady() {
  const [ready, setReady] = useState(() => storage.isReady());

  useEffect(() => {
    let alive = true;
    storage.init().then(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);

  return ready;
}