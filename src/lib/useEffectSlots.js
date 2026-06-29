// ─────────────────────────────────────────────────────────────
// useEffectSlots — глобальные слоты звуковых эффектов (one-shot) Хранителя.
//
// 12 фиксированных слотов (slot_1..slot_12). Хранятся в storage (поле
// effect_slots) и синхронизируются между вкладками/компонентами.
// По аналогии с useMixPresets.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';

const EVENT = 'keeper:effect_slots';
export const SLOT_COUNT = 12;

// Дефолтная раскладка: 6 предзаполненных слотов (без url) + 6 пустых.
const DEFAULT_SLOTS = [
  { id: 'slot_1', title: 'Удар', icon: 'Zap', url: null, isEmpty: false },
  { id: 'slot_2', title: 'Выстрел', icon: 'Target', url: null, isEmpty: false },
  { id: 'slot_3', title: 'Скрип', icon: 'Wind', url: null, isEmpty: false },
  { id: 'slot_4', title: 'Двери', icon: 'DoorOpen', url: null, isEmpty: false },
  { id: 'slot_5', title: 'Шёпот', icon: 'MessageCircle', url: null, isEmpty: false },
  { id: 'slot_6', title: 'Призыв', icon: 'Star', url: null, isEmpty: false },
];

// Полный набор из 12 слотов: дефолты + добивка пустыми до SLOT_COUNT.
function fullSlots(saved) {
  const byId = new Map((saved || []).map((s) => [s.id, s]));
  const out = [];
  for (let i = 1; i <= SLOT_COUNT; i++) {
    const id = `slot_${i}`;
    if (byId.has(id)) {
      out.push(byId.get(id));
    } else {
      const def = DEFAULT_SLOTS.find((d) => d.id === id);
      out.push(def || { id, title: '', icon: 'Zap', url: null, isEmpty: true });
    }
  }
  return out;
}

export function useEffectSlots() {
  const [slots, setSlots] = useState(() => fullSlots(storage.getEffectSlots()));

  useEffect(() => {
    const sync = () => setSlots(fullSlots(storage.getEffectSlots()));
    window.addEventListener(EVENT, sync);
    const unsub = storage.subscribe(sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      unsub();
    };
  }, []);

  const write = useCallback((list) => {
    storage.setEffectSlots(list);
    setSlots(list);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  // Обновить один слот по id.
  const updateSlot = useCallback((id, patch) => {
    const next = fullSlots(storage.getEffectSlots()).map((s) =>
      s.id === id ? { ...s, ...patch } : s
    );
    write(next);
  }, [write]);

  // Очистить слот — делаем его пустым.
  const clearSlot = useCallback((id) => {
    const next = fullSlots(storage.getEffectSlots()).map((s) =>
      s.id === id ? { id: s.id, title: '', icon: 'Zap', url: null, isEmpty: true } : s
    );
    write(next);
  }, [write]);

  return { slots, updateSlot, clearSlot };
}