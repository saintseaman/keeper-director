// ─────────────────────────────────────────────────────────────
// useMixPresets — быстрые «снимки» текущего микса сцены.
//
// Снимок = набор играющих лупов с их громкостями. Сохраняется в storage
// (поле mix_presets) и переключается одним касанием: глушим всё → запускаем
// слои пресета с их громкостями. One-shot'ы в снимок не входят (фон сцены).
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';
import { audioEngine } from './audioEngine';
import { isLoopPad } from './sceneMix';

const EVENT = 'keeper:mix_presets';

export function useMixPresets(pads) {
  const [presets, setPresets] = useState(() => storage.getMixPresets());

  useEffect(() => {
    const sync = () => setPresets(storage.getMixPresets());
    window.addEventListener(EVENT, sync);
    const unsub = storage.subscribe(sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      unsub();
    };
  }, []);

  const write = useCallback((list) => {
    storage.setMixPresets(list);
    setPresets(list);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  // Снимок текущего состояния: играющие лупы с их актуальными громкостями.
  const saveCurrent = useCallback((name) => {
    const byId = new Map((pads || []).map((p) => [p.id, p]));
    const state = audioEngine.getState().activeSounds;
    const layers = [];
    for (const [padId, s] of Object.entries(state)) {
      if (s.isPlaying === false) continue;
      const pad = byId.get(padId);
      if (!pad || !isLoopPad(pad)) continue; // в снимок — только зацикленный фон
      layers.push({ padId, volume: typeof s.volume === 'number' ? s.volume : 0.6 });
    }
    if (layers.length === 0) return null;
    const preset = {
      id: `mix_${Date.now()}`,
      name: name || `Микс ${(storage.getMixPresets() || []).length + 1}`,
      layers,
    };
    write([...(storage.getMixPresets() || []), preset]);
    return preset;
  }, [pads, write]);

  const removePreset = useCallback((id) => {
    write((storage.getMixPresets() || []).filter((p) => p.id !== id));
  }, [write]);

  const renamePreset = useCallback((id, name) => {
    write((storage.getMixPresets() || []).map((p) => (p.id === id ? { ...p, name } : p)));
  }, [write]);

  // Переключение на пресет: глушим всё и запускаем слои с их громкостями.
  const applyPreset = useCallback((preset) => {
    if (!preset) return;
    const byId = new Map((pads || []).map((p) => [p.id, p]));
    audioEngine.stopAll(0.3);
    for (const layer of preset.layers || []) {
      const pad = byId.get(layer.padId);
      if (!pad || !pad.url) continue;
      audioEngine.playFile(pad.id, pad.url, pad.title, layer.volume, true);
    }
  }, [pads]);

  return { presets, saveCurrent, removePreset, renamePreset, applyPreset };
}