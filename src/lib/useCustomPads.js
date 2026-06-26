// ─────────────────────────────────────────────────────────────
// useCustomPads — реактивний доступ до власних пэдів, імпортованих
// з Google Диска. Кожен елемент: { id, title, url, category, icon }.
// Зберігаються у хмарі в окремій сущності Pad (один запис = один звук)
// через шар storage. Форма даних і API хука лишилися незмінними.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';

export function useCustomPads() {
  const [pads, setPads] = useState(() => storage.getCustomPads());

  useEffect(() => {
    const sync = () => setPads(storage.getCustomPads());
    const unsub = storage.subscribe(sync); // хмарне завантаження / зміни
    return unsub;
  }, []);

  // Додати імпортовані звуки (часткові записи в сущність Pad, без перезапису).
  const addPads = useCallback((incoming) => {
    storage.addPadsCloud(incoming);
  }, []);

  // Оновити поля одного пэда (наприклад, перейменування).
  const updatePad = useCallback((id, patch) => {
    storage.updatePadCloud(id, patch);
  }, []);

  const removePad = useCallback((id) => {
    storage.removePadCloud(id);
  }, []);

  const clearAll = useCallback(() => {
    storage.clearPadsCloud();
  }, []);

  return { pads, addPads, updatePad, removePad, clearAll };
}