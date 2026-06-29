import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { useIsSoundActive } from '@/lib/useAudio';
import { audioEngine } from '@/lib/audioEngine';

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 12;

// Один слот шторки эффектов. Короткий тап — играет one-shot через triggerFile.
// Long-press (500мс) — открывает редактор слота. Пустой слот — пунктирная рамка с "+".
export default function EffectSlot({ slot, onEdit }) {
  const isActive = useIsSoundActive(slot.id);
  const timerRef = useRef(null);
  const longFiredRef = useRef(false);
  const startPtRef = useRef(null);
  const movedRef = useRef(false);
  const [pulse, setPulse] = useState(false);

  const Icon = slot.isEmpty ? Plus : getIcon(slot.icon);
  const hasUrl = !!slot.url;

  const fire = () => {
    if (slot.isEmpty) { onEdit(slot); return; } // пустой слот — сразу редактор
    if (!hasUrl) {
      // Звук не назначен — мигаем, показывая что слот пустой.
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
      return;
    }
    if (audioEngine.isPlaying(slot.id)) { audioEngine.stop(slot.id, 0); return; }
    audioEngine.triggerFile(slot.id, slot.url, slot.title, 1.0);
  };

  const startPress = (e) => {
    longFiredRef.current = false;
    movedRef.current = false;
    startPtRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      longFiredRef.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
      onEdit(slot);
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

  if (slot.isEmpty) {
    return (
      <button
        onPointerDown={startPress}
        onPointerMove={onMove}
        onPointerUp={endPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        className="aspect-square rounded-xl border border-dashed border-white/15 flex items-center justify-center select-none touch-none text-white/25 hover:border-orange-400/40 hover:text-orange-300/60 transition-colors"
      >
        <Plus size={22} strokeWidth={1.6} />
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
      onContextMenu={(e) => e.preventDefault()}
      className={`relative aspect-square rounded-xl border bg-[#141414] flex flex-col items-center justify-center gap-1.5 select-none touch-none overflow-hidden transition-all duration-100 active:scale-[0.96]
        ${isActive
          ? 'border-orange-400/70 shadow-[0_0_24px_-2px_rgba(249,115,22,0.55)] bg-orange-500/10'
          : 'border-white/10 hover:border-white/25'}
        ${!hasUrl && pulse ? 'animate-pulse' : ''}
        ${!hasUrl ? 'opacity-60' : ''}
      `}
    >
      {isActive && (
        <span className="absolute inset-0 pointer-events-none rounded-xl ring-2 ring-orange-400/70 animate-pulse" />
      )}
      <span className={`flex items-center justify-center w-10 h-10 rounded-full bg-black/45 ring-1 ${isActive ? 'ring-orange-300/60 text-orange-100' : 'ring-white/15 text-white/85'}`}>
        <Icon size={20} strokeWidth={1.7} />
      </span>
      <span className={`px-1 text-[10px] font-mono tracking-wide text-center leading-tight break-words [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden ${isActive ? 'text-orange-100' : 'text-white/70'}`}>
        {slot.title}
      </span>
    </button>
  );
}