import React, { useRef, useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { audioEngine } from '@/lib/audioEngine';
import { actionPlayback } from '@/lib/actionPlayback';

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 12;

// Плитка оси «Действие» — one-shot триггер в стиле слота эффектов.
// Короткий тап проигрывает назначенный звук разово (не фон, не в selection).
// Long-press открывает выбор ОДНОГО звука. Пустая плитка (звук не назначен) —
// пунктирная рамка с "+", как пустой слот эффекта.
export default function ActionTile({ axisId, value, pad, label, onLongPress }) {
  const displayLabel = label || value.displayLabel || value.label;
  const timerRef = useRef(null);
  const longFiredRef = useRef(false);
  const startPtRef = useRef(null);
  const movedRef = useRef(false);
  const [pulse, setPulse] = useState(false);

  const hasSound = !!pad;
  const Icon = getIcon(value.icon);

  // Подсветка отражает реальное состояние воспроизведения этой плитки из
  // долгоживущей карты. При монтировании сразу восстанавливаем pulse из
  // реального состояния движка (пережив переключение вкладок осей).
  useEffect(() => {
    const sync = () => {
      const id = actionPlayback.get(value.id);
      const playing = !!id && audioEngine.getState().activeSounds[id]?.isPlaying;
      // Звук доиграл сам — чистим запись, чтобы следующий тап был «первым».
      if (id && !playing) actionPlayback.clear(value.id);
      setPulse(!!playing);
    };
    sync(); // ← сразу при монтировании, а не только по событию движка
    const unsub = audioEngine.subscribe(sync);
    return unsub;
  }, [value.id]);

  const fire = () => {
    if (!hasSound) { onLongPress?.(axisId, value.id); return; } // нет звука — открыть выбор

    const currentId = actionPlayback.get(value.id);
    const stillPlaying = currentId && audioEngine.getState().activeSounds[currentId]?.isPlaying;

    if (stillPlaying) {
      // Второй тап на играющий звук — стоп.
      audioEngine.stop(currentId, 0.2);
      actionPlayback.clear(value.id);
      setPulse(false);
      return;
    }

    // Первый тап (или предыдущий уже доиграл) — запускаем.
    const newId = `${pad.id}:act:${Date.now()}`;
    actionPlayback.set(value.id, newId);
    audioEngine.triggerFile(newId, pad.url, pad.title, 0.9);
    setPulse(true);
  };

  const startPress = (e) => {
    longFiredRef.current = false;
    movedRef.current = false;
    startPtRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      longFiredRef.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
      onLongPress?.(axisId, value.id);
    }, LONG_PRESS_MS);
  };

  const onMove = (e) => {
    if (!startPtRef.current || movedRef.current) return;
    const dx = e.clientX - startPtRef.current.x;
    const dy = e.clientY - startPtRef.current.y;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE) {
      movedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!longFiredRef.current && !movedRef.current) fire();
    startPtRef.current = null;
  };

  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    startPtRef.current = null;
  };

  if (!hasSound) {
    return (
      <button
        onPointerDown={startPress}
        onPointerMove={onMove}
        onPointerUp={endPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => { e.preventDefault(); onLongPress?.(axisId, value.id); }}
        className="aspect-square rounded-xl border border-dashed border-white/15 flex flex-col items-center justify-center gap-1 select-none touch-none text-white/30 hover:border-orange-400/40 hover:text-orange-300/60 transition-colors"
      >
        <Plus size={22} strokeWidth={1.6} />
        <span className="px-1 text-[10px] font-mono tracking-wide text-center leading-tight text-white/35">
          {displayLabel}
        </span>
      </button>
    );
  }

  return (
    <button
      onPointerDown={startPress}
      onPointerMove={onMove}
      onPointerUp={endPress}
      onPointerCancel={cancelPress}
      onPointerLeave={cancelPress}
      onContextMenu={(e) => { e.preventDefault(); onLongPress?.(axisId, value.id); }}
      className={`relative aspect-square rounded-xl border bg-[#141414] flex flex-col items-center justify-center gap-1.5 select-none touch-none overflow-hidden transition-all duration-100 active:scale-[0.96] ${
        pulse
          ? 'border-orange-400/70 shadow-[0_0_24px_-2px_rgba(249,115,22,0.55)] bg-orange-500/10'
          : 'border-white/10 hover:border-white/25'
      }`}
    >
      {pulse && (
        <span className="absolute inset-0 pointer-events-none rounded-xl ring-2 ring-orange-400/70 animate-pulse" />
      )}
      <span className={`flex items-center justify-center w-10 h-10 rounded-full bg-black/45 ring-1 ${pulse ? 'ring-orange-300/60 text-orange-100' : 'ring-white/15 text-white/85'}`}>
        <Icon size={20} strokeWidth={1.7} />
      </span>
      <span className="px-1 text-[10px] font-mono tracking-wide text-center leading-tight break-words [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden text-white/70">
        {displayLabel}
      </span>
    </button>
  );
}