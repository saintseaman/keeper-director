import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Layers, Sparkles, Play, Square, Save, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCustomPads } from '@/lib/useCustomPads';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { useScenes } from '@/lib/useScenes';
import { useAudio } from '@/lib/useAudio';
import { padAxes, padMatchesSelection, axisValue } from '@/lib/sceneAxes';
import { useAxes } from '@/lib/useAxes';
import { useTileSounds } from '@/lib/useTileSounds';
import { audioEngine } from '@/lib/audioEngine';
import { syncSceneMix, loopableScenePads } from '@/lib/sceneMix';
import SceneWheel from '@/components/scene/SceneWheel';
import SceneSliders from '@/components/scene/SceneSliders';
import SceneMatchList from '@/components/scene/SceneMatchList';
import SavedScenes from '@/components/scene/SavedScenes';
import SceneSegmentDialog from '@/components/scene/SceneSegmentDialog';
import TileSoundsDialog from '@/components/scene/TileSoundsDialog';
import AddSegmentDialog from '@/components/scene/AddSegmentDialog';
import AddSoundToSceneDialog from '@/components/scene/AddSoundToSceneDialog';
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
  const [addSoundOpen, setAddSoundOpen] = useState(false); // диалог добавления звука в сцену
  const [driveOpen, setDriveOpen] = useState(false); // импорт с Диска внутри сцены
  // Ручные правки текущей сцены поверх автоподбора по фильтру:
  const [extraIds, setExtraIds] = useState([]); // вручную добавленные звуки
  const [excludedIds, setExcludedIds] = useState(new Set()); // убранные из сцены звуки
  const [sceneActive, setSceneActive] = useState(false); // сцена играет — слушаем колесо вживую
  const sceneIdsRef = useRef(new Set()); // текущий набор id играющих слоёв сцены

  const activeCount = Object.values(activeSounds).filter((v) => v.isPlaying !== false).length;
  const hasFilter = Object.values(selection).some(Boolean);
  const hasScene = hasFilter || extraIds.length > 0;

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

  // Итоговый список звуков сцены = (звуки активных плиток + вручную добавленные) − убранные.
  const matches = useMemo(() => {
    const byId = new Map(pads.map((p) => [p.id, p]));
    const ids = new Set(tileMatchIds);
    for (const id of extraIds) ids.add(id);
    for (const id of excludedIds) ids.delete(id);
    return Array.from(ids).map((id) => byId.get(id)).filter(Boolean);
  }, [pads, tileMatchIds, extraIds, excludedIds]);

  // Множество id текущей сцены — для подсветки в диалоге добавления.
  const sceneIds = useMemo(() => new Set(matches.map((p) => p.id)), [matches]);

  // Добавить/убрать звук из сцены вручную (поверх автоподбора).
  const addToScene = (id) => {
    setExcludedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setExtraIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };
  const removeFromScene = (id) => {
    setExtraIds((prev) => prev.filter((x) => x !== id));
    setExcludedIds((prev) => { const n = new Set(prev); n.add(id); return n; });
  };

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
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/40">
                      В сцене: <span className="text-orange-300 font-medium">{matches.length}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { stopScene(); setSelection(EMPTY); setExtraIds([]); setExcludedIds(new Set()); }}
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

                  <button
                    onClick={() => setAddSoundOpen(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 px-3 py-2.5 text-[11px] font-mono tracking-wider text-white/55 hover:border-orange-400/40 hover:text-orange-300 transition-colors"
                  >
                    <Plus size={14} />
                    ДОБАВИТЬ ЗВУК В СЦЕНУ
                  </button>

                  <SceneMatchList pads={matches} onRemoveCustom={removeFromScene} />

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

      <AddSoundToSceneDialog
        open={addSoundOpen}
        onClose={() => setAddSoundOpen(false)}
        pads={pads}
        sceneIds={sceneIds}
        onAdd={addToScene}
        onRemove={removeFromScene}
        onImport={() => { setAddSoundOpen(false); setDriveOpen(true); }}
      />

      <FolderUploadDialog
        open={driveOpen}
        onClose={() => setDriveOpen(false)}
        onImported={(sounds) => {
          addPads(sounds);
          setExtraIds((prev) => Array.from(new Set([...prev, ...sounds.map((s) => s.id)])));
          setExcludedIds((prev) => {
            const n = new Set(prev);
            for (const s of sounds) n.delete(s.id);
            return n;
          });
          setDriveOpen(false);
        }}
      />
    </div>
  );
}