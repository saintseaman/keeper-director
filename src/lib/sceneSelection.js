import { useEffect, useReducer } from 'react';

// Долгоживущий стор выбора сцены — живёт, пока открыто приложение (синглтон,
// по образцу audioEngine). Не сбрасывается при размонтировании страницы Сцены,
// поэтому оранжевое выделение плиток переживает навигацию в Настройки и обратно
// и соответствует реально играющему звуку.
let state = { location: null, action: null, weather: null };
let intensity = 0.5;
const listeners = new Set();
function emit() { listeners.forEach((l) => l()); }

export const sceneSelection = {
  get: () => state,
  set: (next) => { state = next; emit(); },
  patch: (axisId, valueId) => { state = { ...state, [axisId]: valueId }; emit(); },
  reset: () => { state = { location: null, action: null, weather: null }; emit(); },
  getIntensity: () => intensity,
  setIntensity: (v) => { intensity = v; emit(); },
  subscribe: (l) => { listeners.add(l); return () => listeners.delete(l); },
};

export function useSceneSelection() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => sceneSelection.subscribe(force), []);
  return sceneSelection;
}