import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AudioLines } from 'lucide-react';
import { audioEngine } from '@/lib/audioEngine';

// Мини-визуализация формы волны звука прямо в строке.
// Рисует пики на canvas, чтобы было видно:
//   • есть сигнал (видны столбики разной высоты) — файл не пустой;
//   • плоская линия по центру — файл тишина/пустой;
//   • ошибка/недоступно — значит проблема не в воспроизведении.
//
// Грузим ПО ЗАПРОСУ (тап на «волну») — иначе 159 декодирований разом убьют CPU.
// Декодируем ТЕМ ЖЕ декодером, что и воспроизведение (audioEngine._decodeFile) —
// он Safari-совместим (callback-форма + resume) и кэширует буфер, поэтому если
// волна построилась, то и звук точно проиграется (и наоборот).

const BARS = 56; // сколько столбиков рисуем

function Waveform({ url }) {
  const canvasRef = useRef(null);
  const [state, setState] = useState('idle'); // idle | loading | ready | error | empty
  const [peaks, setPeaks] = useState(null);

  const load = async (e) => {
    e?.stopPropagation();
    if (!url || state === 'loading') return;
    setState('loading');
    try {
      audioEngine._ensureContext();
      const audioBuf = await audioEngine._decodeFile(url);
      // Берём первый канал, режем на BARS окон, в каждом — максимальная амплитуда.
      const data = audioBuf.getChannelData(0);
      const block = Math.floor(data.length / BARS) || 1;
      const out = [];
      let globalMax = 0;
      for (let i = 0; i < BARS; i++) {
        let max = 0;
        const start = i * block;
        for (let j = 0; j < block && start + j < data.length; j++) {
          const v = Math.abs(data[start + j]);
          if (v > max) max = v;
        }
        out.push(max);
        if (max > globalMax) globalMax = max;
      }
      // Нормализуем к 0..1 относительно пика файла.
      const norm = globalMax > 0 ? out.map((v) => v / globalMax) : out;
      setPeaks(norm);
      // Если пик ничтожно мал — это фактически тишина (пустой файл).
      setState(globalMax < 0.001 ? 'empty' : 'ready');
    } catch (err) {
      setState('error');
    }
  };

  // Рисуем волну на canvas, когда пики готовы.
  useEffect(() => {
    if (state !== 'ready' && state !== 'empty') return;
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const mid = h / 2;
    const barW = w / peaks.length;
    const empty = state === 'empty';
    ctx.fillStyle = empty ? 'rgba(244,63,94,0.5)' : 'rgba(251,146,60,0.85)';
    peaks.forEach((p, i) => {
      const barH = Math.max(1, p * (h - 2));
      const x = i * barW;
      ctx.fillRect(x, mid - barH / 2, Math.max(1, barW - 1), barH);
    });
  }, [peaks, state]);

  if (state === 'idle') {
    return (
      <button
        onClick={load}
        className="mt-1.5 flex items-center gap-1 text-[11px] text-white/40 hover:text-orange-300 rounded-md px-1.5 py-0.5 border border-white/10 hover:border-orange-400/40 transition-colors"
        title="Показать форму волны звука"
      >
        <AudioLines size={12} /> Волна
      </button>
    );
  }

  if (state === 'loading') {
    return (
      <span className="mt-1.5 flex items-center gap-1 text-[11px] text-white/50">
        <Loader2 size={12} className="animate-spin" /> читаю волну…
      </span>
    );
  }

  if (state === 'error') {
    return (
      <button
        onClick={load}
        className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-300/90 hover:text-rose-200 transition-colors"
        title="Не удалось прочитать файл"
      >
        <AudioLines size={12} /> волна недоступна
      </button>
    );
  }

  // ready | empty — canvas + подпись для пустого
  return (
    <div className="mt-1.5">
      <canvas
        ref={canvasRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full h-7 rounded-md bg-black/30 border border-white/10"
      />
      {state === 'empty' && (
        <p className="mt-1 text-[10px] text-rose-300/80">Файл тихий/пустой — сигнала нет.</p>
      )}
    </div>
  );
}

export default React.memo(Waveform);