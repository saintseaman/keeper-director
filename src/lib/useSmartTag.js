// ─────────────────────────────────────────────────────────────
// useSmartTag — «умная» разметка звуков по осям сцены через ИИ.
// Сначала классификация по названию, затем (если осей не хватило) ИИ слушает
// само аудио. Обрабатываем чанками, чтобы не упереться в таймаут функции,
// и пишем результаты каждого чанка сразу в overrides (mergeOverrides).
//
// Прогон пропускает уже размеченные звуки и гоняет несколько чанков
// параллельно — так повторный запуск дорабатывает только оставшиеся и
// весь процесс идёт заметно быстрее.
// ─────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const CHUNK = 4;        // звуков на один запрос к функции
const PARALLEL = 3;     // сколько чанков обрабатываем одновременно

// Звук считается размеченным, если есть хоть один тег хоть по одной оси.
function hasAnyTag(override) {
  const ax = override?.axes;
  return !!ax && Object.values(ax).some((arr) => Array.isArray(arr) && arr.length);
}

export function useSmartTag(mergeOverrides, overrides = {}) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total }
  const [result, setResult] = useState(null); // { tagged }

  const run = useCallback(async (pads) => {
    if (running || !pads.length) return;

    // Берём только ещё не размеченные звуки — повторный запуск доделывает остаток.
    const todo = pads.filter((p) => !hasAnyTag(overrides[p.id]));
    if (!todo.length) {
      setResult({ tagged: 0 });
      return;
    }

    setRunning(true);
    setResult(null);
    setProgress({ done: 0, total: todo.length });

    let tagged = 0;
    let done = 0;

    // Один чанк: размечаем и сразу сохраняем его результат.
    const processChunk = async (slice) => {
      const sounds = slice.map((p) => ({ id: p.id, title: p.title, url: p.url }));
      const res = await base44.functions.invoke('smartTagSounds', { sounds });
      const chunkPatches = {};
      for (const r of res.data?.results || []) {
        if (r.axes && Object.keys(r.axes).length) {
          chunkPatches[r.id] = { axes: r.axes };
          tagged += 1;
        }
      }
      if (Object.keys(chunkPatches).length) mergeOverrides(chunkPatches);
      done += slice.length;
      setProgress({ done: Math.min(done, todo.length), total: todo.length });
    };

    try {
      // Нарезаем на чанки и гоняем по PARALLEL штук за раз.
      const chunks = [];
      for (let i = 0; i < todo.length; i += CHUNK) chunks.push(todo.slice(i, i + CHUNK));
      for (let i = 0; i < chunks.length; i += PARALLEL) {
        const batch = chunks.slice(i, i + PARALLEL);
        await Promise.all(batch.map(processChunk));
      }
      setResult({ tagged });
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }, [running, mergeOverrides, overrides]);

  return { run, running, progress, result };
}