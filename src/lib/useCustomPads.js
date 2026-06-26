// ─────────────────────────────────────────────────────────────
// useCustomPads — реактивний доступ до власних пэдів, імпортованих
// з Google Диска. Кожен елемент: { id, title, url, category, icon }.
// Зберігаються у хмарі через шар storage (поле custom_pads).
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';

const EVENT = 'keeper:custompads';

export function useCustomPads() {
  const [pads, setPads] = useState(() => storage.getCustomPads());

  useEffect(() => {
    const sync = () => setPads(storage.getCustomPads());
    window.addEventListener(EVENT, sync);
    const unsub = storage.subscribe(sync); // хмарне завантаження / зміни
    return () => {
      window.removeEventListener(EVENT, sync);
      unsub();
    };
  }, []);

  // Додати імпортовані звуки (з дедуплікацією за id).
  const addPads = useCallback((incoming) => {
    const existing = storage.getCustomPads();
    const byId = new Map(existing.map((p) => [p.id, p]));
    for (const p of incoming) byId.set(p.id, p);
    const next = Array.from(byId.values());
    storage.setCustomPads(next);
    setPads(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  // Оновити поля одного пэда (наприклад, перейменування).
  const updatePad = useCallback((id, patch) => {
    const next = storage.getCustomPads().map((p) => (p.id === id ? { ...p, ...patch } : p));
    storage.setCustomPads(next);
    setPads(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const removePad = useCallback((id) => {
    const next = storage.getCustomPads().filter((p) => p.id !== id);
    storage.setCustomPads(next);
    setPads(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const clearAll = useCallback(() => {
    storage.setCustomPads([]);
    setPads([]);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { pads, addPads, updatePad, removePad, clearAll };
}