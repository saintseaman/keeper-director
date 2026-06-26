import React, { useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { useIsSoundActive } from '@/lib/useAudio';
import { audioEngine } from '@/lib/audioEngine';
import PadEditDialog from '@/components/pad/PadEditDialog';

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 12;

// Одна строка подходящего пэда: иконка, название, кнопка play/stop.
// Долгое нажатие открывает редактор пэда (импорт звука с Drive / локально).
function MatchRow({ pad, onRemoveCustom }) {
  const isActive = useIsSoundActive(pad.id);
  const Icon = getIcon(pad.icon);
  const [editOpen, setEditOpen] = useState(false);
  const timerRef = useRef(null);
  const longFiredRef = useRef(false);
  const startPtRef = useRef(null);
  const movedRef = useRef(false);

  const fire = () => {
    if (audioEngine.isPlaying(pad.id)) {
      audioEngine.stop(pad.id, 0.3);
    } else if (pad.url) {
      const loop = pad.isLoopable !== false;
      if (loop) audioEngine.playFile(pad.id, pad.url, pad.title, 0.6, true);
      else audioEngine.triggerFile(pad.id, pad.url, pad.title, 0.8);
    }
  };

  const startPress = (e) => {
    longFiredRef.current = false;
    movedRef.current = false;
    startPtRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      longFiredRef.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
      setEditOpen(true);
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

  return (
    <>
      <button
        onPointerDown={startPress}
        onPointerMove={onMove}
        onPointerUp={endPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left select-none touch-none transition-colors ${
          isActive
            ? 'bg-orange-500/15 border-orange-400/50'
            : 'bg-white/5 border-white/10 hover:border-white/25'
        }`}
      >
        <Icon size={16} className={isActive ? 'text-orange-300' : 'text-white/50'} />
        <span className={`flex-1 text-sm truncate ${isActive ? 'text-orange-50' : 'text-white/80'}`}>
          {pad.title}
        </span>
        {isActive ? (
          <Square size={14} className="text-orange-300 fill-orange-400" />
        ) : (
          <Play size={14} className="text-white/40" />
        )}
      </button>

      <PadEditDialog
        sound={pad}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onRemove={pad.url ? () => {
          if (audioEngine.isPlaying(pad.id)) audioEngine.stop(pad.id);
          onRemoveCustom?.(pad.id);
          setEditOpen(false);
        } : undefined}
      />
    </>
  );
}

export default function SceneMatchList({ pads, onRemoveCustom }) {
  if (pads.length === 0) {
    return (
      <p className="text-center text-xs text-white/30 py-8">
        Нет пэдов под этот набор. Снимите часть фильтров.
      </p>
    );
  }
  return (
    <div className="space-y-1.5">
      {pads.map((p) => (
        <MatchRow key={p.id} pad={p} onRemoveCustom={onRemoveCustom} />
      ))}
    </div>
  );
}