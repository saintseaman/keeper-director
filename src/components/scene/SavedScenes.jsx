import React from 'react';
import { Play, Square, Trash2, Layers } from 'lucide-react';
import { axisValue } from '@/lib/sceneAxes';
import { audioEngine } from '@/lib/audioEngine';
import { useAudio } from '@/lib/useAudio';

// Чипы-теги выбранных осей сцены (для краткого описания под названием).
function SceneTags({ selection }) {
  const items = Object.entries(selection || {})
    .map(([axisId, valueId]) => (valueId ? axisValue(axisId, valueId) : null))
    .filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map((v) => (
        <span key={v.id} className="flex items-center gap-1 text-[10px] text-white/40 bg-white/5 rounded px-1.5 py-0.5">
          <v.icon size={10} />
          {v.label}
        </span>
      ))}
    </div>
  );
}

// Звуки сцены, у которых есть проигрываемый url.
function scenePads(scene, padsById) {
  return (scene.padIds || []).map((id) => padsById[id]).filter((p) => p?.url);
}

function SceneCard({ scene, padsById, onRemove }) {
  const { activeSounds } = useAudio();
  const pads = scenePads(scene, padsById);
  // Сцена считается активной, если хотя бы один её звук сейчас играет.
  const isActive = pads.some((p) => activeSounds[p.id]?.isPlaying !== false && activeSounds[p.id]);

  const toggleScene = () => {
    if (isActive) {
      for (const p of pads) audioEngine.stop(p.id, 0.4);
      return;
    }
    for (const pad of pads) {
      const loop = pad.isLoopable !== false;
      if (loop) audioEngine.playFile(pad.id, pad.url, pad.title, 0.6, true);
      else audioEngine.triggerFile(pad.id, pad.url, pad.title, 0.8);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white/90 truncate">{scene.name}</div>
          <div className="text-[11px] text-white/35">{(scene.padIds || []).length} звук(ов)</div>
          <SceneTags selection={scene.selection} />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleScene}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider border transition-colors ${
              isActive
                ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 hover:bg-rose-600/30'
                : 'bg-orange-500/20 border-orange-400/50 text-orange-200 hover:bg-orange-500/30'
            }`}
          >
            {isActive ? (
              <>
                <Square size={13} className="fill-rose-400" />
                СТОП
              </>
            ) : (
              <>
                <Play size={13} className="fill-orange-300" />
                ЗАПУСК
              </>
            )}
          </button>
          <button
            onClick={() => onRemove(scene.id)}
            className="rounded-lg p-2 text-white/30 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            title="Удалить сцену"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SavedScenes({ scenes, padsById, onRemove }) {
  if (scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <Layers size={28} className="text-white/15" strokeWidth={1.2} />
        <p className="text-xs text-white/35">Пока нет сохранённых сцен.</p>
        <p className="text-[11px] text-white/25">Соберите атмосферу выше и сохраните её.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {scenes.map((scene) => (
        <SceneCard key={scene.id} scene={scene} padsById={padsById} onRemove={onRemove} />
      ))}
    </div>
  );
}