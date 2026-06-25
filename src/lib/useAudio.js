import { useState, useEffect, useCallback } from 'react';
import { audioEngine } from './audioEngine';

// ─────────────────────────────────────────────────────────────
// Селекторна підписка (M5).
// SoundButton'у потрібен ЛИШЕ статус активності свого звуку, а не весь стан.
// Цей хук перемальовує компонент тільки коли змінюється активність саме
// цього id — а не на будь-яку зміну будь-якого звуку.
// ─────────────────────────────────────────────────────────────
export function useIsSoundActive(soundId) {
  const [active, setActive] = useState(() => audioEngine.isPlaying(soundId));

  useEffect(() => {
    setActive(audioEngine.isPlaying(soundId));
    return audioEngine.subscribe(() => {
      const next = audioEngine.isPlaying(soundId);
      setActive(prev => (prev === next ? prev : next)); // оновлення лише при реальній зміні
    });
  }, [soundId]);

  return active;
}

// Стабільні екшени відтворення без підписки на стан (для тригерних кнопок).
export function useAudioActions() {
  const play = useCallback((soundId, title, volume, loop) => audioEngine.play(soundId, title, volume, loop), []);
  const stop = useCallback((soundId, fadeTime) => audioEngine.stop(soundId, fadeTime), []);
  const toggle = useCallback((soundId, title, volume = 0.5, loop = true) => {
    if (audioEngine.isPlaying(soundId)) audioEngine.stop(soundId);
    else audioEngine.play(soundId, title, volume, loop);
  }, []);
  const trigger = useCallback((soundId, title) => audioEngine.trigger(soundId, title), []);
  return { play, stop, toggle, trigger };
}

export function useAudio() {
  const [state, setState] = useState(audioEngine.getState());

  useEffect(() => {
    return audioEngine.subscribe(setState);
  }, []);

  const play = useCallback((soundId, title, volume, loop) => {
    audioEngine.play(soundId, title, volume, loop);
  }, []);

  const stop = useCallback((soundId, fadeTime) => {
    audioEngine.stop(soundId, fadeTime);
  }, []);

  const stopAll = useCallback((fadeTime) => {
    audioEngine.stopAll(fadeTime);
  }, []);

  const setVolume = useCallback((soundId, volume) => {
    audioEngine.setVolume(soundId, volume);
  }, []);

  const setMasterVolume = useCallback((volume) => {
    audioEngine.setMasterVolume(volume);
  }, []);

  const toggle = useCallback((soundId, title, volume = 0.5, loop = true) => {
    if (audioEngine.isPlaying(soundId)) {
      audioEngine.stop(soundId);
    } else {
      audioEngine.play(soundId, title, volume, loop);
    }
  }, []);

  const trigger = useCallback((soundId, title) => {
    audioEngine.trigger(soundId, title);
  }, []);

  const panic = useCallback(() => {
    audioEngine.panic();
  }, []);

  return {
    activeSounds: state.activeSounds,
    masterVolume: state.masterVolume,
    play, stop, stopAll, setVolume, setMasterVolume, toggle, trigger, panic,
  };
}