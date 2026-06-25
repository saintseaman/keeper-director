// ─────────────────────────────────────────────────────────────
// usePadFiles — реактивный доступ к загруженным MP3, привязанным к пэдам.
// Хранение через шар storage; синхронизация между компонентами событием.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';

const EVENT = 'keeper:padfiles';

export function usePadFiles() {
  const [files, setFiles] = useState(() => storage.getPadFiles());

  useEffect(() => {
    const sync = () => setFiles(storage.getPadFiles());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const getFile = useCallback((soundId) => files[soundId] || null, [files]);

  const setFile = useCallback((soundId, file) => {
    const map = storage.getPadFiles();
    const next = { ...map, [soundId]: file };
    storage.setPadFiles(next);
    setFiles(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const removeFile = useCallback((soundId) => {
    const map = storage.getPadFiles();
    if (!map[soundId]) return;
    const next = { ...map };
    delete next[soundId];
    storage.setPadFiles(next);
    setFiles(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { files, getFile, setFile, removeFile };
}