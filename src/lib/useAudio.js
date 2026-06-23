import { useState, useEffect, useCallback } from 'react';
import { audioEngine } from './audioEngine';

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