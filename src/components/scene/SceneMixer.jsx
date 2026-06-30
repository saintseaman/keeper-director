import React from 'react';
import { SlidersHorizontal, VolumeX, Volume2, X, Headphones } from 'lucide-react';

// Групповой микшер активных плиток.
// groups = [{ key, label, ids: [soundId...] }] — только группы с играющими звуками.
// На вход — реактивные данные из useAudio (activeSounds, setVolume, stop)
// и состояние «приглушено» по группам (muted: { [key]: true }).
export default function SceneMixer({ groups, activeSounds, setVolume, stop, mutedGroups, onToggleMute, soloKey, onToggleSolo }) {
  if (groups.length === 0) {
    return (
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={15} className="text-orange-400" />
        <h2 className="text-xs font-mono tracking-[0.2em] text-white/60 uppercase">Микшер</h2>
        <p className="text-[11px] text-white/35 ml-1">Нет активных слоёв. Тапни плитку, чтобы добавить.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={15} className="text-orange-400" />
        <h2 className="text-xs font-mono tracking-[0.2em] text-white/60 uppercase">Микшер</h2>
        <span className="text-[11px] text-white/35">· {groups.length}</span>
      </div>

      <div className="space-y-2.5">
        {groups.map((g) => {
          const vols = g.ids.map((id) => activeSounds[id]?.volume ?? 0);
          const avg = vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : 0;
          const muted = !!mutedGroups[g.key];
          const isSolo = soloKey === g.key;
          const dimmed = soloKey && !isSolo;

          return (
            <div
              key={g.key}
              className={`rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-opacity ${dimmed ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[12px] font-mono text-white/80 truncate">{g.label}</span>
                  <span className="text-[10px] text-white/35">({g.ids.length})</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onToggleSolo(g.key, g.ids)}
                    className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-colors ${
                      isSolo
                        ? 'bg-orange-500/25 border-orange-400/60 text-orange-300'
                        : 'bg-white/5 border-white/10 text-white/45 hover:text-white/70'
                    }`}
                  >
                    <Headphones size={14} />
                  </button>
                  <button
                    onClick={() => onToggleMute(g.key, g.ids)}
                    className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-colors ${
                      muted
                        ? 'bg-orange-500/20 border-orange-400/50 text-orange-300'
                        : 'bg-white/5 border-white/10 text-white/45 hover:text-white/70'
                    }`}
                  >
                    {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <button
                    onClick={() => g.ids.forEach((id) => stop(id, 0.3))}
                    className="flex items-center justify-center w-7 h-7 rounded-lg border border-white/10 bg-white/5 text-white/45 hover:text-rose-300 hover:border-rose-400/40 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : avg}
                disabled={muted}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  g.ids.forEach((id) => setVolume(id, v));
                }}
                className="w-full accent-orange-500 disabled:opacity-40"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}