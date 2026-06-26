// ─────────────────────────────────────────────────────────────
// useScenes — сохранённые сцены (наборы пэдов с осями фильтра).
// Каждая сцена: { id, name, selection: {location,action,weather,mood},
//                 padIds: [...] }. Хранение через storage (поле scenes).
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';

const EVENT = 'keeper:scenes';

export function useScenes() {
  const [scenes, setScenes] = useState(() => storage.getScenes());

  useEffect(() => {
    const sync = () => setScenes(storage.getScenes());
    window.addEventListener(EVENT, sync);
    const unsub = storage.subscribe(sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      unsub();
    };
  }, []);

  const addScene = useCallback((scene) => {
    const next = [...storage.getScenes(), { ...scene, id: `scene_${Date.now()}` }];
    storage.setScenes(next);
    setScenes(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const removeScene = useCallback((id) => {
    const next = storage.getScenes().filter((s) => s.id !== id);
    storage.setScenes(next);
    setScenes(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { scenes, addScene, removeScene };
}