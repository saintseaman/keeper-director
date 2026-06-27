import { useState, useCallback, useRef } from 'react';

// ─────────────────────────────────────────────────────────────
// Массовая проверка доступности звуков для панели «Теги».
// Прогоняет файлы пачками (чтобы не открывать 159 <audio> разом и не
// топить сеть) и собирает множество битых padId. Так пользователь
// одним нажатием видит, какие звуки реально не загружаются.
// ─────────────────────────────────────────────────────────────

// Проверка одного url: резолвится 'ok' | 'error'. Таймаут 8 с.
function probe(url) {
  return new Promise((resolve) => {
    const el = new Audio();
    el.preload = 'metadata';
    const done = (res) => {
      clearTimeout(timer);
      try { el.pause(); el.src = ''; } catch (e) {}
      resolve(res);
    };
    const timer = setTimeout(() => done('error'), 8000);
    el.addEventListener('loadedmetadata', () => done('ok'), { once: true });
    el.addEventListener('error', () => done('error'), { once: true });
    el.src = url;
    el.load();
  });
}

export function useHealthCheck() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total }
  const [broken, setBroken] = useState(() => new Set()); // padId с битым файлом
  const [checked, setChecked] = useState(false);
  const cancelRef = useRef(false);

  const run = useCallback(async (pads) => {
    const withUrl = pads.filter((p) => p.url);
    if (withUrl.length === 0) return;
    cancelRef.current = false;
    setRunning(true);
    setChecked(false);
    setProgress({ done: 0, total: withUrl.length });
    const bad = new Set();
    const BATCH = 6;
    for (let i = 0; i < withUrl.length; i += BATCH) {
      if (cancelRef.current) break;
      const slice = withUrl.slice(i, i + BATCH);
      const results = await Promise.all(slice.map((p) => probe(p.url)));
      results.forEach((res, idx) => { if (res === 'error') bad.add(slice[idx].id); });
      setProgress({ done: Math.min(i + BATCH, withUrl.length), total: withUrl.length });
    }
    setBroken(bad);
    setRunning(false);
    setChecked(true);
    setProgress(null);
  }, []);

  const cancel = useCallback(() => { cancelRef.current = true; }, []);

  return { running, progress, broken, checked, run, cancel };
}