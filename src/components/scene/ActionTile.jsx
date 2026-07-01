import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { audioEngine } from '@/lib/audioEngine';

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 12;

// Плитка оси «Действие» — one-shot триггер в стиле слота эффектов.
// Короткий тап проигрывает назначенный звук разово (не фон, не в selection).
// Long-press открывает выбор ОДНОГО звука. Пустая плитка (звук не назначен) —
// пунктирная рамка с "+", как пустой слот эффекта.
export default function ActionTile({ axisId, value, pad, onLongPress }) {
  const timerRef = useRef(null);
  const longFiredRef = useRef(false);
  const startPtRef = useRef(null);
  const movedRef = useRef(false);
  const [pulse, setPulse] = useState(false);

  const hasSound = !!pad;
  const Icon = getIcon(value.icon);

  const fire = () => {
    if (!hasSound) { onLongPress?.(axisId, value.id); return; } // нет звука — открыть выбор
    // Уникальный id с таймстампом — чтобы триггерить повторно, как в эффектах.
    audioEngine.triggerFile(`${pad.id}:act:${Date.now()}`, pad.url, pad.title, 0.9);
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
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
          {value.displayLabel || value.label}
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
        {value.displayLabel || value.label}
      </span>
    </button>
  );
}