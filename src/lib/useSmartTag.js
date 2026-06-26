// ─────────────────────────────────────────────────────────────
// useSmartTag — «умная» разметка звуков по осям сцены через ИИ.
// Сначала классификация по названию, затем (если осей не хватило) ИИ слушает
// само аудио. Обрабатываем чанками, чтобы не упереться в таймаут функции,
// и пишем результаты пачкой в overrides (mergeOverrides).
// ─────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const CHUNK = 4;

export function useSmartTag(mergeOverrides) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total }
  const [result, setResult] = useState(null); // { tagged }

  const run = useCallback(async (pads) => {
    if (running || !pads.length) return;
    setRunning(true);
    setResult(null);
    setProgress({ done: 0, total: pads.length });

    const patches = {};
    let tagged = 0;

    try {
      for (let i = 0; i < pads.length; i += CHUNK) {
        const slice = pads.slice(i, i + CHUNK);
        const sounds = slice.map((p) => ({ id: p.id, title: p.title, url: p.url }));
        const res = await base44.functions.invoke('smartTagSounds', { sounds });
        for (const r of res.data?.results || []) {
          if (r.axes && Object.keys(r.axes).length) {
            patches[r.id] = { axes: r.axes };
            tagged += 1;
          }
        }
        setProgress({ done: Math.min(i + CHUNK, pads.length), total: pads.length });
      }
      if (Object.keys(patches).length) mergeOverrides(patches);
      setResult({ tagged });
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }, [running, mergeOverrides]);

  return { run, running, progress, result };
}