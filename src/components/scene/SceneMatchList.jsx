import React, { useRef, useState } from 'react';
import { Play, Square, MoreVertical } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { useIsSoundActive } from '@/lib/useAudio';
import { audioEngine } from '@/lib/audioEngine';
import PadEditDialog from '@/components/pad/PadEditDialog';
import LayerVolumeSlider from '@/components/scene/LayerVolumeSlider';

const LONG_PRESS_MS = 500;

// Одна строка подходящего пэда: иконка, название, кнопка play/stop.
// Тап — воспроизведение; долгое нажатие или кнопка «⋮» — редактор пэда
// (импорт звука с Drive / локально).
function MatchRow({ pad, onRemoveCustom }) {
  const isActive = useIsSoundActive(pad.id);
  const Icon = getIcon(pad.icon);
  const [editOpen, setEditOpen] = useState(false);
  const timerRef = useRef(null);
  const longFiredRef = useRef(false);

  const fire = () => {
    if (audioEngine.isPlaying(pad.id)) {
      audioEngine.stop(pad.id, 0.3);
    } else if (pad.url) {
      const loop = pad.isLoopable !== false;
      if (loop) audioEngine.playFile(pad.id, pad.url, pad.title, 0.6, true);
      else audioEngine.triggerFile(pad.id, pad.url, pad.title, 0.8);
    }
  };

  const startPress = () => {
    longFiredRef.current = false;
    timerRef.current = setTimeout(() => {
      longFiredRef.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
      setEditOpen(true);
    }, LONG_PRESS_MS);
  };

  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClick = () => {
    if (longFiredRef.current) { longFiredRef.current = false; return; }
    fire();
  };

  return (
    <>
      <div
        className={`w-full rounded-lg border select-none transition-colors ${
          isActive
            ? 'bg-orange-500/15 border-orange-400/50'
            : 'bg-white/5 border-white/10 hover:border-white/25'
        }`}
      >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          onClick={handleClick}
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerCancel={endPress}
          onContextMenu={(e) => { e.preventDefault(); setEditOpen(true); }}
          className="flex flex-1 items-center gap-3 text-left min-w-0"
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
        <button
          onClick={() => setEditOpen(true)}
          className="shrink-0 -mr-1 p-1.5 rounded-md text-white/40 hover:text-orange-300 hover:bg-white/5 transition-colors"
          title="Редактировать звук"
        >
          <MoreVertical size={16} />
        </button>
        </div>
        {isActive && <LayerVolumeSlider padId={pad.id} />}
      </div>

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