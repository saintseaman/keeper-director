// ─────────────────────────────────────────────────────────────
// useAudioResume (Milestone 5)
//
// Відновлює AudioContext, коли застосунок повертається з фону.
// На мобільних контекст переходить у 'suspended' при згортанні — без resume
// зациклені звуки не відновлюються, поки користувач не торкнеться екрана.
// Вішається один раз на рівні App.
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { audioEngine } from './audioEngine';

export function useAudioResume() {
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') audioEngine.resume();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);
}