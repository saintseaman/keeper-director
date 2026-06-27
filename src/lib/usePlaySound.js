import { useCallback } from 'react';
import { audioEngine } from './audioEngine';
import { usePadFiles } from './usePadFiles';
import { useSoundOverrides } from './useSoundOverrides';
import { useLang } from './LangContext';
import { localizedSoundTitle } from './contentI18n';
import { recordRecentPad } from './usePadLibrary';

// ─────────────────────────────────────────────────────────────
// Единая логика запуска/остановки звука пэда (вынесена из Pad.jsx),
// чтобы колесо категорий, лента сцены и обычные пэды дёргали один код.
// Возвращает { resolve, toggle } — resolve даёт эффективные title/volume/icon
// для отображения, toggle включает/выключает звук с учётом one-shot/loop.
// ─────────────────────────────────────────────────────────────
export function usePlaySound() {
  const { getFile } = usePadFiles();
  const { getOverride } = useSoundOverrides();
  const { lang } = useLang();

  // Эффективные метаданные пэда с учётом пользовательских правок.
  const resolve = useCallback((sound) => {
    if (!sound) return null;
    const ov = getOverride(sound.id);
    const isCustom = !!sound.url;
    const title = ov.title ?? (isCustom ? sound.title : localizedSoundTitle(sound.id, lang, sound.title));
    const volume = typeof ov.volume === 'number' ? ov.volume : 0.6;
    const icon = ov.icon ?? sound.icon;
    const isLoopable = typeof ov.isLoopable === 'boolean' ? ov.isLoopable : !!sound.isLoopable;
    const isOneShot = !isLoopable;
    const fileUrl = sound.url || getFile(sound.id)?.url || null;
    return { title, volume, icon, isOneShot, fileUrl };
  }, [getOverride, getFile, lang]);

  // Тап по звуку: играет → стоп; иначе запускает (file или процедурный).
  const toggle = useCallback((sound) => {
    if (!sound) return;
    if (audioEngine.isPlaying(sound.id)) {
      audioEngine.stop(sound.id, 0);
      return;
    }
    const { title, volume, isOneShot, fileUrl } = resolve(sound);
    recordRecentPad(sound.id);
    if (fileUrl) {
      if (isOneShot) audioEngine.triggerFile(sound.id, fileUrl, title, volume);
      else audioEngine.playFile(sound.id, fileUrl, title, volume, true);
      return;
    }
    if (isOneShot) audioEngine.trigger(sound.id, title);
    else audioEngine.play(sound.id, title, volume, true);
  }, [resolve]);

  return { resolve, toggle };
}