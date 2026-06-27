import React from 'react';
import { Play, Square, Plus, Check } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { useIsSoundActive } from '@/lib/useAudio';
import { audioEngine } from '@/lib/audioEngine';

// Строка звука-кандидата в подсказках поиска.
// Слева — превью (тап играет/глушит сам звук, чтобы оценить перед добавлением),
// справа — кнопка «+ в сцену» / «✓ в сцене». Никакого авто-микса: Хранитель
// добавляет каждый слой осознанно.
export default function CandidateRow({ pad, inScene, onAdd, onRemove }) {
  const isActive = useIsSoundActive(pad.id);
  const Icon = getIcon(pad.icon);

  const preview = () => {
    if (audioEngine.isPlaying(pad.id)) {
      audioEngine.stop(pad.id, 0.25);
    } else if (pad.url) {
      const loop = pad.isLoopable !== false;
      if (loop) audioEngine.playFile(pad.id, pad.url, pad.title, 0.6, true);
      else audioEngine.triggerFile(pad.id, pad.url, pad.title, 0.8);
    }
  };

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors ${
        inScene
          ? 'bg-orange-500/10 border-orange-400/40'
          : 'bg-white/5 border-white/10 hover:border-white/25'
      }`}
    >
      <button onClick={preview} className="flex flex-1 items-center gap-2.5 text-left min-w-0">
        <span className={`shrink-0 ${isActive ? 'text-orange-300' : 'text-white/45'}`}>
          {isActive ? <Square size={13} className="fill-orange-400" /> : <Play size={13} />}
        </span>
        <Icon size={14} className={inScene ? 'text-orange-300' : 'text-white/40'} />
        <span className={`flex-1 text-sm truncate ${inScene ? 'text-orange-50' : 'text-white/80'}`}>
          {pad.title}
        </span>
      </button>
      <button
        onClick={() => (inScene ? onRemove(pad.id) : onAdd(pad.id))}
        className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-md border transition-colors ${
          inScene
            ? 'border-orange-400/50 text-orange-300 hover:bg-orange-500/15'
            : 'border-white/15 text-white/55 hover:border-orange-400/50 hover:text-orange-300'
        }`}
        title={inScene ? 'Убрать из сцены' : 'Добавить в сцену'}
      >
        {inScene ? <Check size={14} /> : <Plus size={14} />}
      </button>
    </div>
  );
}