import React, { useEffect, useRef, useState } from 'react';
import { Clock, AlertTriangle, Loader2 } from 'lucide-react';

// Диагностическая проба звука для панели «Теги».
// Самостоятельно (мимо общего audioEngine) грузит файл по url через скрытый
// <audio>, показывает его длительность в секундах и Audio Visualizer
// (анализатор частот) во время превью-воспроизведения. Цель — увидеть,
// действительно ли файл доступен/играет, ведь часть звуков «не звучит».
//
// playing  — внешний флаг (строка сейчас проигрывается через TagFixRow).
// url      — ссылка на аудиофайл.
export default function SoundProbe({ url, playing }) {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const srcRef = useRef(null);

  const [duration, setDuration] = useState(null); // секунды
  const [state, setState] = useState('loading');  // loading | ready | error

  // Метаданные: длина файла + статус доступности.
  useEffect(() => {
    if (!url) { setState('error'); return; }
    setState('loading');
    setDuration(null);
    const el = new Audio();
    el.preload = 'metadata';
    el.crossOrigin = 'anonymous';
    el.src = url;
    audioRef.current = el;

    const onMeta = () => {
      if (isFinite(el.duration) && el.duration > 0) setDuration(el.duration);
      setState('ready');
    };
    const onErr = () => setState('error');
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('error', onErr);
    el.load();

    return () => {
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('error', onErr);
      try { el.pause(); el.src = ''; } catch (e) {}
    };
  }, [url]);

  // Визуализатор работает, пока строка играет. Подключаем тот же url отдельным
  // <audio> к AnalyserNode и рисуем спектр. Так видно, реально ли идёт сигнал.
  useEffect(() => {
    if (!playing || !url) {
      stopViz();
      return;
    }
    let cancelled = false;

    const start = async () => {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        const ctx = new AC();
        ctxRef.current = ctx;
        if (ctx.state === 'suspended') await ctx.resume();

        const el = new Audio();
        el.crossOrigin = 'anonymous';
        el.src = url;
        el.loop = true;
        el.volume = 0.0001; // звук уже идёт через основной движок — здесь только анализ
        srcRef.current = el;

        const node = ctx.createMediaElementSource(el);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        node.connect(analyser);
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;

        await el.play().catch(() => {});
        if (cancelled) { stopViz(); return; }
        draw();
      } catch (e) {
        // CORS/без MediaElementSource — визуализатор недоступен, но длительность всё равно есть.
      }
    };

    const draw = () => {
      const analyser = analyserRef.current;
      const canvas = canvasRef.current;
      if (!analyser || !canvas) return;
      const cctx = canvas.getContext('2d');
      const bins = analyser.frequencyBinCount;
      const data = new Uint8Array(bins);

      const render = () => {
        analyser.getByteFrequencyData(data);
        const w = canvas.width;
        const h = canvas.height;
        cctx.clearRect(0, 0, w, h);
        const barW = w / bins;
        for (let i = 0; i < bins; i++) {
          const v = data[i] / 255;
          const bh = Math.max(1, v * h);
          cctx.fillStyle = `rgba(251,146,60,${0.35 + v * 0.65})`;
          cctx.fillRect(i * barW, h - bh, barW * 0.8, bh);
        }
        rafRef.current = requestAnimationFrame(render);
      };
      render();
    };

    start();
    return () => { cancelled = true; stopViz(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, url]);

  const stopViz = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    try { srcRef.current?.pause(); if (srcRef.current) srcRef.current.src = ''; } catch (e) {}
    try { ctxRef.current?.close(); } catch (e) {}
    srcRef.current = null;
    analyserRef.current = null;
    ctxRef.current = null;
  };

  return (
    <div className="flex items-center gap-2 mt-1.5">
      {/* Длительность / статус */}
      {state === 'loading' ? (
        <span className="flex items-center gap-1 text-[11px] text-white/40">
          <Loader2 size={11} className="animate-spin" /> длительность…
        </span>
      ) : state === 'error' ? (
        <span className="flex items-center gap-1 text-[11px] text-rose-300/90" title="Файл недоступен или не загружается">
          <AlertTriangle size={11} /> не загружается
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[11px] text-white/50 tabular-nums">
          <Clock size={11} />
          {duration != null ? `${duration.toFixed(1)} с` : 'длина ?'}
        </span>
      )}

      {/* Audio Visualizer — спектр во время превью */}
      <canvas
        ref={canvasRef}
        width={120}
        height={20}
        className={`h-5 w-[120px] rounded transition-opacity ${playing ? 'opacity-100' : 'opacity-25'}`}
      />
    </div>
  );
}