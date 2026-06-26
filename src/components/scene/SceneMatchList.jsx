import React from 'react';
import { Play, Square } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { useIsSoundActive } from '@/lib/useAudio';
import { audioEngine } from '@/lib/audioEngine';

// Одна строка подходящего пэда: иконка, название, кнопка play/stop.
function MatchRow({ pad }) {
  const isActive = useIsSoundActive(pad.id);
  const Icon = getIcon(pad.icon);

  const toggle = () => {
    if (audioEngine.isPlaying(pad.id)) {
      audioEngine.stop(pad.id, 0.3);
    } else if (pad.url) {
      const loop = pad.isLoopable !== false;
      if (loop) audioEngine.playFile(pad.id, pad.url, pad.title, 0.6, true);
      else audioEngine.triggerFile(pad.id, pad.url, pad.title, 0.8);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
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
  );
}

export default function SceneMatchList({ pads }) {
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
        <MatchRow key={p.id} pad={p} />
      ))}
    </div>
  );
}