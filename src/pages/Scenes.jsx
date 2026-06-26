import React, { useState, useMemo } from 'react';
import { Layers, Sparkles, Play, Square, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCustomPads } from '@/lib/useCustomPads';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { useScenes } from '@/lib/useScenes';
import { useAudio } from '@/lib/useAudio';
import { padAxes, padMatchesSelection } from '@/lib/sceneAxes';
import { audioEngine } from '@/lib/audioEngine';
import SceneWheel from '@/components/scene/SceneWheel';
import SceneSliders from '@/components/scene/SceneSliders';
import SceneMatchList from '@/components/scene/SceneMatchList';
import SavedScenes from '@/components/scene/SavedScenes';

const EMPTY = { location: null, action: null, weather: null, mood: null };

export default function Scenes() {
  const { pads, removePad } = useCustomPads();
  const { overrides } = useSoundOverrides();
  const { scenes, addScene, removeScene } = useScenes();
  const { activeSounds, stopAll } = useAudio();
  const { toast } = useToast();

  const [selection, setSelection] = useState(EMPTY);
  const [name, setName] = useState('');

  const activeCount = Object.values(activeSounds).filter((v) => v.isPlaying !== false).length;
  const hasFilter = Object.values(selection).some(Boolean);

  // Карта пэдов по id (для запуска сохранённых сцен).
  const padsById = useMemo(() => {
    const m = {};
    for (const p of pads) m[p.id] = p;
    return m;
  }, [pads]);

  // Пэды, подходящие под выбранный набор осей.
  const matches = useMemo(() => {
    if (!hasFilter) return [];
    return pads.filter((p) => padMatchesSelection(padAxes(p, overrides[p.id]), selection));
  }, [pads, overrides, selection, hasFilter]);

  const onSelect = (axisId, valueId) =>
    setSelection((prev) => ({ ...prev, [axisId]: valueId }));

  // Запустить все подходящие пэды как микс.
  const playMatches = () => {
    const playable = matches.filter((p) => p.url);
    if (playable.length === 0) {
      toast({
        title: hasFilter ? 'Нет звуков под этот выбор' : 'Сначала выберите сегменты',
        description: hasFilter
          ? 'У импортированных звуков не проставлены теги. Откройте звук (зажатие) и задайте локацию/действие.'
          : 'Выберите локацию и действие на колесе.',
      });
      return;
    }
    for (const pad of playable) {
      const loop = pad.isLoopable !== false;
      if (loop) audioEngine.playFile(pad.id, pad.url, pad.title, 0.6, true);
      else audioEngine.triggerFile(pad.id, pad.url, pad.title, 0.8);
    }
  };

  const saveScene = () => {
    const finalName = name.trim() || 'Без названия';
    addScene({ name: finalName, selection: { ...selection }, padIds: matches.map((p) => p.id) });
    setName('');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-orange-400" />
          <span className="text-[13px] font-mono tracking-[0.25em] text-white/80 uppercase">Сцены</span>
        </div>
        <button
          onClick={() => stopAll(0.4)}
          disabled={activeCount === 0}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider transition-all ${
            activeCount > 0
              ? 'bg-rose-600/20 border border-rose-500/50 text-rose-300'
              : 'bg-white/5 border border-white/10 text-white/25'
          }`}
        >
          <Square size={12} className={activeCount > 0 ? 'fill-rose-400' : ''} />
          {activeCount > 0 ? activeCount : 'STOP'}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-6">
        {pads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Layers size={40} className="text-white/15" strokeWidth={1.2} />
            <p className="text-sm text-white/45">Сначала импортируйте звуки с Google Диска на главной.</p>
          </div>
        ) : (
          <>
            {/* Колесо атмосферы */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} className="text-orange-400" />
                <h2 className="text-xs font-mono tracking-[0.2em] text-white/60 uppercase">Собрать атмосферу</h2>
              </div>

              <SceneWheel
                selection={selection}
                onSelect={onSelect}
                onPlay={playMatches}
                matchCount={matches.length}
              />

              <div className="mt-2">
                <SceneSliders selection={selection} onSelect={onSelect} />
              </div>

              {hasFilter && (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/40">
                      Подходит: <span className="text-orange-300 font-medium">{matches.length}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelection(EMPTY)}
                        className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
                      >
                        Сбросить
                      </button>
                      <button
                        onClick={playMatches}
                        disabled={matches.length === 0}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider border transition-colors ${
                          matches.length === 0
                            ? 'bg-white/5 border-white/10 text-white/25'
                            : 'bg-orange-500/20 border-orange-400/50 text-orange-200 hover:bg-orange-500/30'
                        }`}
                      >
                        <Play size={12} className="fill-orange-300" />
                        ЗАПУСТИТЬ ВСЁ
                      </button>
                    </div>
                  </div>

                  <SceneMatchList pads={matches} onRemoveCustom={removePad} />

                  {matches.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Название сцены…"
                        className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 placeholder:text-white/25 focus:border-orange-400/50 focus:outline-none"
                      />
                      <button
                        onClick={saveScene}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider bg-white/5 border border-white/10 text-white/60 hover:border-orange-400/40 hover:text-orange-300 transition-colors"
                      >
                        <Save size={13} />
                        СОХРАНИТЬ
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Сохранённые сцены */}
            <section>
              <h2 className="text-xs font-mono tracking-[0.2em] text-white/60 uppercase mb-3">Сохранённые сцены</h2>
              <SavedScenes scenes={scenes} padsById={padsById} onRemove={removeScene} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}