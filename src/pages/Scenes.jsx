import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Layers, Sparkles, Square, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCustomPads } from '@/lib/useCustomPads';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { useScenes } from '@/lib/useScenes';
import { useAudio } from '@/lib/useAudio';
import { axisValue } from '@/lib/sceneAxes';
// padAxes/padMatchesSelection больше не нужны — сцена кормится звуками плиток.
import { useAxes } from '@/lib/useAxes';
import { useTileSounds } from '@/lib/useTileSounds';
import { audioEngine } from '@/lib/audioEngine';
import { syncSceneMix, loopableScenePads } from '@/lib/sceneMix';
import SceneWheel from '@/components/scene/SceneWheel';
import SceneSliders from '@/components/scene/SceneSliders';
import SavedScenes from '@/components/scene/SavedScenes';
import SceneSegmentDialog from '@/components/scene/SceneSegmentDialog';
import TileSoundsDialog from '@/components/scene/TileSoundsDialog';
import AddSegmentDialog from '@/components/scene/AddSegmentDialog';
import FolderUploadDialog from '@/components/pad/FolderUploadDialog';

const EMPTY = { location: null, action: null, weather: null, mood: null };

export default function Scenes() {
  const { pads, addPads, updatePad, removePad } = useCustomPads();
  const { overrides, setOverride } = useSoundOverrides();
  const { scenes, addScene, removeScene } = useScenes();
  const { activeSounds, stopAll } = useAudio();
  const { axes, addValue, removeValue } = useAxes();
  const { tileSounds: tileSoundsMap, getSounds } = useTileSounds();
  const { toast } = useToast();

  const [selection, setSelection] = useState(EMPTY);
  const [name, setName] = useState('');
  const [segment, setSegment] = useState(null); // { axisId, valueId } — открытый редактор сегмента
  const [tileSounds, setTileSounds] = useState(null); // { axisId, valueId, label } — диалог назначения звуков на плитку
  const [addAxis, setAddAxis] = useState(null); // ось, в которую добавляем сегмент
  const [driveOpen, setDriveOpen] = useState(false); // импорт с Диска внутри сцены
  const [sceneActive, setSceneActive] = useState(false); // сцена играет — слушаем колесо вживую
  const sceneIdsRef = useRef(new Set()); // текущий набор id играющих слоёв сцены

  const activeCount = Object.values(activeSounds).filter((v) => v.isPlaying !== false).length;
  const hasFilter = Object.values(selection).some(Boolean);
  const hasScene = hasFilter;

  // Карта пэдов по id (для запуска сохранённых сцен).
  const padsById = useMemo(() => {
    const m = {};
    for (const p of pads) m[p.id] = p;
    return m;
  }, [pads]);

  // Активные плитки = по одной на ось, где selection[axis] задан.
  // Сцена = ОБЪЕДИНЕНИЕ звуков всех активных плиток (логика ИЛИ, не И).
  const tileMatchIds = useMemo(() => {
    const ids = new Set();
    for (const axisId of Object.keys(selection)) {
      const valueId = selection[axisId];
      if (!valueId) continue;
      for (const sid of getSounds(axisId, valueId)) ids.add(sid);
    }
    return ids;
    // tileSoundsMap — чтобы пересчёт шёл при изменении назначений плиток.
  }, [selection, getSounds, tileSoundsMap]);

  // Итоговый список звуков сцены = звуки активных плиток.
  const matches = useMemo(() => {
    const byId = new Map(pads.map((p) => [p.id, p]));
    return Array.from(tileMatchIds).map((id) => byId.get(id)).filter(Boolean);
  }, [pads, tileMatchIds]);

  const onSelect = (axisId, valueId) =>
    setSelection((prev) => ({ ...prev, [axisId]: valueId }));

  // Запустить подходящие пэды как нормализованный фон сцены.
  // В авто-микс идут только лупы; громкость каждого слоя снижается по числу слоёв.
  const playMatches = () => {
    const loops = loopableScenePads(matches);
    if (loops.length === 0) {
      toast({
        title: 'Нет звуков для сцены',
        description: 'На выбранные плитки не назначено ни одного звука. Зажми плитку и добавь звуки.',
      });
      return;
    }
    setSceneActive(true);
    sceneIdsRef.current = syncSceneMix(audioEngine, matches, sceneIdsRef.current);
  };

  // Живое обновление: пока сцена играет, любое изменение набора звуков
  // (смена выбора на колесе) подмешивается в звук без повторного тапа.
  useEffect(() => {
    if (!sceneActive) return;
    sceneIdsRef.current = syncSceneMix(audioEngine, matches, sceneIdsRef.current);
  }, [matches, sceneActive]);

  // Полная остановка сцены: гасим всё и сбрасываем активность.
  const stopScene = () => {
    stopAll(0.4);
    setSceneActive(false);
    sceneIdsRef.current = new Set();
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
          onClick={stopScene}
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
            <p className="text-sm text-white/45">Сначала импортируйте звуки на главной.</p>
          </div>
        ) : (
          <>
            {/* Колесо атмосферы */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} className="text-orange-400" />
                <h2 className="text-xs font-mono tracking-[0.2em] text-white/60 uppercase">Собрать атмосферу</h2>
              </div>

              <div className="mb-3">
                <SceneSliders selection={selection} onSelect={onSelect} />
              </div>

              <SceneWheel
                axes={axes}
                selection={selection}
                onSelect={onSelect}
                onPlay={playMatches}
                onStop={stopScene}
                activeCount={activeCount}
                matchCount={matches.length}
                onSegmentLongPress={(axisId, valueId) => {
                  const v = axisValue(axisId, valueId);
                  setTileSounds({ axisId, valueId, label: v?.label || valueId });
                }}
                onAddSegment={(axisId) => setAddAxis(axisId)}
              />

              {hasScene && (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Название сцены…"
                      className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 placeholder:text-white/25 focus:border-orange-400/50 focus:outline-none"
                    />
                    <button
                      onClick={saveScene}
                      disabled={matches.length === 0}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider bg-white/5 border border-white/10 text-white/60 hover:border-orange-400/40 hover:text-orange-300 transition-colors disabled:opacity-40"
                    >
                      <Save size={13} />
                      СОХРАНИТЬ
                    </button>
                  </div>

                  <button
                    onClick={() => { stopScene(); setSelection(EMPTY); }}
                    className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
                  >
                    Сбросить выбор
                  </button>
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

      <TileSoundsDialog
        open={!!tileSounds}
        onClose={() => setTileSounds(null)}
        axisId={tileSounds?.axisId}
        valueId={tileSounds?.valueId}
        valueLabel={tileSounds?.label}
      />

      <SceneSegmentDialog
        axisId={segment?.axisId}
        valueId={segment?.valueId}
        open={!!segment}
        onClose={() => setSegment(null)}
        pads={pads}
        overrides={overrides}
        addPads={addPads}
        updatePad={updatePad}
        removePad={removePad}
        setOverride={setOverride}
        onRemoveSegment={(axisId, valueId) => {
          removeValue(axisId, valueId);
          setSelection((prev) => (prev[axisId] === valueId ? { ...prev, [axisId]: null } : prev));
        }}
      />

      <AddSegmentDialog
        axisId={addAxis}
        open={!!addAxis}
        onClose={() => setAddAxis(null)}
        onAdd={addValue}
      />

      <FolderUploadDialog
        open={driveOpen}
        onClose={() => setDriveOpen(false)}
        onImported={(sounds) => {
          addPads(sounds);
          setDriveOpen(false);
        }}
      />
    </div>
  );
}